from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('JWT_SECRET', 'arc-planner-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: str


class DisciplineCreate(BaseModel):
    name: str
    start_date: str
    deadline: str


class Discipline(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    start_date: str
    deadline: str
    created_at: str


class TrackCreate(BaseModel):
    name: str


class Track(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    discipline_id: str
    name: str
    order: int


class TrackUpdate(BaseModel):
    name: str


class TrackReorder(BaseModel):
    track_ids: List[str]


class UnitCreate(BaseModel):
    count: int


class Unit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    track_id: str
    number: int
    completed: bool
    completed_at: Optional[str] = None


class DayOffCreate(BaseModel):
    date: str


class DayOff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    date: str


class DashboardStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_disciplines: int
    total_units: int
    completed_units: int
    remaining_units: int
    days_off_count: int
    disciplines: List[dict]


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hashed_password,
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id})
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name
        }
    }


@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not pwd_context.verify(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    token = create_access_token({"sub": user["id"]})
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"]
        }
    }


@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@api_router.get("/disciplines", response_model=List[Discipline])
async def get_disciplines(current_user: User = Depends(get_current_user)):
    disciplines = await db.disciplines.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    return disciplines


@api_router.post("/disciplines", response_model=Discipline)
async def create_discipline(discipline_data: DisciplineCreate, current_user: User = Depends(get_current_user)):
    discipline_id = str(uuid.uuid4())
    discipline_doc = {
        "id": discipline_id,
        "user_id": current_user.id,
        "name": discipline_data.name,
        "start_date": discipline_data.start_date,
        "deadline": discipline_data.deadline,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.disciplines.insert_one(discipline_doc)
    return Discipline(**discipline_doc)


@api_router.get("/disciplines/{discipline_id}", response_model=Discipline)
async def get_discipline(discipline_id: str, current_user: User = Depends(get_current_user)):
    discipline = await db.disciplines.find_one(
        {"id": discipline_id, "user_id": current_user.id},
        {"_id": 0}
    )
    if not discipline:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    return Discipline(**discipline)


@api_router.put("/disciplines/{discipline_id}", response_model=Discipline)
async def update_discipline(
    discipline_id: str,
    discipline_data: DisciplineCreate,
    current_user: User = Depends(get_current_user)
):
    result = await db.disciplines.update_one(
        {"id": discipline_id, "user_id": current_user.id},
        {"$set": {
            "name": discipline_data.name,
            "start_date": discipline_data.start_date,
            "deadline": discipline_data.deadline
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    discipline = await db.disciplines.find_one(
        {"id": discipline_id},
        {"_id": 0}
    )
    return Discipline(**discipline)


@api_router.delete("/disciplines/{discipline_id}")
async def delete_discipline(discipline_id: str, current_user: User = Depends(get_current_user)):
    result = await db.disciplines.delete_one({"id": discipline_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    await db.tracks.delete_many({"discipline_id": discipline_id})
    
    tracks = await db.tracks.find({"discipline_id": discipline_id}, {"_id": 0, "id": 1}).to_list(1000)
    track_ids = [t["id"] for t in tracks]
    if track_ids:
        await db.units.delete_many({"track_id": {"$in": track_ids}})
    
    return {"message": "Disciplina deletada com sucesso"}


@api_router.post("/disciplines/{discipline_id}/tracks", response_model=Track)
async def create_track(
    discipline_id: str,
    track_data: TrackCreate,
    current_user: User = Depends(get_current_user)
):
    discipline = await db.disciplines.find_one({"id": discipline_id, "user_id": current_user.id})
    if not discipline:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    max_order = await db.tracks.find_one(
        {"discipline_id": discipline_id},
        {"_id": 0, "order": 1},
        sort=[("order", -1)]
    )
    order = (max_order["order"] + 1) if max_order else 0
    
    track_id = str(uuid.uuid4())
    track_doc = {
        "id": track_id,
        "discipline_id": discipline_id,
        "name": track_data.name,
        "order": order
    }
    await db.tracks.insert_one(track_doc)
    return Track(**track_doc)


@api_router.get("/disciplines/{discipline_id}/tracks", response_model=List[Track])
async def get_tracks(discipline_id: str, current_user: User = Depends(get_current_user)):
    discipline = await db.disciplines.find_one({"id": discipline_id, "user_id": current_user.id})
    if not discipline:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    
    tracks = await db.tracks.find(
        {"discipline_id": discipline_id},
        {"_id": 0}
    ).sort("order", 1).to_list(1000)
    return tracks


@api_router.put("/tracks/{track_id}", response_model=Track)
async def update_track(track_id: str, track_data: TrackUpdate, current_user: User = Depends(get_current_user)):
    track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not track:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    
    discipline = await db.disciplines.find_one({"id": track["discipline_id"], "user_id": current_user.id})
    if not discipline:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    await db.tracks.update_one(
        {"id": track_id},
        {"$set": {"name": track_data.name}}
    )
    
    updated_track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    return Track(**updated_track)


@api_router.delete("/tracks/{track_id}")
async def delete_track(track_id: str, current_user: User = Depends(get_current_user)):
    track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not track:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    
    discipline = await db.disciplines.find_one({"id": track["discipline_id"], "user_id": current_user.id})
    if not discipline:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    await db.tracks.delete_one({"id": track_id})
    await db.units.delete_many({"track_id": track_id})
    
    return {"message": "Trilha deletada com sucesso"}


@api_router.post("/tracks/reorder")
async def reorder_tracks(reorder_data: TrackReorder, current_user: User = Depends(get_current_user)):
    for idx, track_id in enumerate(reorder_data.track_ids):
        await db.tracks.update_one(
            {"id": track_id},
            {"$set": {"order": idx}}
        )
    return {"message": "Trilhas reordenadas com sucesso"}


@api_router.post("/tracks/{track_id}/units")
async def create_units(track_id: str, unit_data: UnitCreate, current_user: User = Depends(get_current_user)):
    track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not track:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    
    discipline = await db.disciplines.find_one({"id": track["discipline_id"], "user_id": current_user.id})
    if not discipline:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    existing_count = await db.units.count_documents({"track_id": track_id})
    
    units = []
    for i in range(unit_data.count):
        unit_id = str(uuid.uuid4())
        unit_doc = {
            "id": unit_id,
            "track_id": track_id,
            "number": existing_count + i + 1,
            "completed": False,
            "completed_at": None
        }
        units.append(unit_doc)
    
    if units:
        await db.units.insert_many(units)
    
    return {"message": f"{unit_data.count} unidades criadas com sucesso"}


@api_router.get("/tracks/{track_id}/units", response_model=List[Unit])
async def get_units(track_id: str, current_user: User = Depends(get_current_user)):
    track = await db.tracks.find_one({"id": track_id}, {"_id": 0})
    if not track:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    
    discipline = await db.disciplines.find_one({"id": track["discipline_id"], "user_id": current_user.id})
    if not discipline:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    units = await db.units.find(
        {"track_id": track_id},
        {"_id": 0}
    ).sort("number", 1).to_list(1000)
    return units


@api_router.patch("/units/{unit_id}/toggle", response_model=Unit)
async def toggle_unit(unit_id: str, current_user: User = Depends(get_current_user)):
    unit = await db.units.find_one({"id": unit_id}, {"_id": 0})
    if not unit:
        raise HTTPException(status_code=404, detail="Unidade não encontrada")
    
    track = await db.tracks.find_one({"id": unit["track_id"]}, {"_id": 0})
    if not track:
        raise HTTPException(status_code=404, detail="Trilha não encontrada")
    
    discipline = await db.disciplines.find_one({"id": track["discipline_id"], "user_id": current_user.id})
    if not discipline:
        raise HTTPException(status_code=403, detail="Não autorizado")
    
    new_completed = not unit["completed"]
    completed_at = datetime.now(timezone.utc).isoformat() if new_completed else None
    
    await db.units.update_one(
        {"id": unit_id},
        {"$set": {"completed": new_completed, "completed_at": completed_at}}
    )
    
    updated_unit = await db.units.find_one({"id": unit_id}, {"_id": 0})
    return Unit(**updated_unit)


@api_router.post("/days-off", response_model=DayOff)
async def create_day_off(day_off_data: DayOffCreate, current_user: User = Depends(get_current_user)):
    existing = await db.days_off.find_one({"user_id": current_user.id, "date": day_off_data.date})
    if existing:
        raise HTTPException(status_code=400, detail="Folga já registrada para esta data")
    
    day_off_id = str(uuid.uuid4())
    day_off_doc = {
        "id": day_off_id,
        "user_id": current_user.id,
        "date": day_off_data.date
    }
    await db.days_off.insert_one(day_off_doc)
    return DayOff(**day_off_doc)


@api_router.get("/days-off", response_model=List[DayOff])
async def get_days_off(current_user: User = Depends(get_current_user)):
    days_off = await db.days_off.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    return days_off


@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    disciplines = await db.disciplines.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    
    total_units = 0
    completed_units = 0
    discipline_stats = []
    
    for discipline in disciplines:
        tracks = await db.tracks.find(
            {"discipline_id": discipline["id"]},
            {"_id": 0, "id": 1}
        ).to_list(1000)
        
        track_ids = [t["id"] for t in tracks]
        
        if track_ids:
            units = await db.units.find(
                {"track_id": {"$in": track_ids}},
                {"_id": 0}
            ).to_list(10000)
            
            disc_total = len(units)
            disc_completed = sum(1 for u in units if u["completed"])
            
            total_units += disc_total
            completed_units += disc_completed
            
            from datetime import datetime
            deadline_date = datetime.fromisoformat(discipline["deadline"].replace("Z", "+00:00"))
            start_date = datetime.fromisoformat(discipline["start_date"].replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            
            total_days = (deadline_date - start_date).days
            remaining_days = max(0, (deadline_date - now).days)
            
            days_off_count = await db.days_off.count_documents({"user_id": current_user.id})
            remaining_study_days = max(0, remaining_days - days_off_count)
            
            remaining_units = disc_total - disc_completed
            study_pace = round(remaining_units / remaining_study_days, 2) if remaining_study_days > 0 else 0
            
            discipline_stats.append({
                **discipline,
                "total_units": disc_total,
                "completed_units": disc_completed,
                "remaining_units": remaining_units,
                "remaining_days": remaining_days,
                "study_pace": study_pace
            })
        else:
            discipline_stats.append({
                **discipline,
                "total_units": 0,
                "completed_units": 0,
                "remaining_units": 0,
                "remaining_days": 0,
                "study_pace": 0
            })
    
    days_off_count = await db.days_off.count_documents({"user_id": current_user.id})
    
    return DashboardStats(
        total_disciplines=len(disciplines),
        total_units=total_units,
        completed_units=completed_units,
        remaining_units=total_units - completed_units,
        days_off_count=days_off_count,
        disciplines=discipline_stats
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()