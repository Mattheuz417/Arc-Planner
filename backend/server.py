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


class SmartDaysOff(BaseModel):
    model_config = ConfigDict(extra="ignore")
    available_days_off: int
    days_off_used: int
    can_take_day_off: bool
    message: str


class DashboardStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_disciplines: int
    total_units: int
    completed_units: int
    remaining_units: int
    days_off_count: int
    disciplines: List[dict]
    smart_days_off: Optional[SmartDaysOff] = None



class StudyCycleCreate(BaseModel):
    name: str


class StudyCycle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    active: bool
    created_at: str


class CycleItemCreate(BaseModel):
    discipline_id: str


class CycleItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    cycle_id: str
    discipline_id: str
    discipline_name: str
    order: int
    is_current: bool


class CycleItemReorder(BaseModel):
    item_ids: List[str]


class CycleStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")
    has_cycle: bool
    current_item: Optional[CycleItem]
    all_items: List[CycleItem]
    cycle_completed_today: bool


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
    except jwt.InvalidTokenError:
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
            
            from datetime import datetime as dt
            deadline_str = discipline["deadline"]
            start_str = discipline["start_date"]
            
            # Handle both ISO format strings and date strings
            if 'T' in deadline_str:
                deadline_date = dt.fromisoformat(deadline_str.replace("Z", "+00:00"))
            else:
                deadline_date = dt.fromisoformat(deadline_str + "T00:00:00+00:00")
            
            if 'T' in start_str:
                start_date = dt.fromisoformat(start_str.replace("Z", "+00:00"))
            else:
                start_date = dt.fromisoformat(start_str + "T00:00:00+00:00")
            
            now = dt.now(timezone.utc)
            
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
    
    # Calculate smart days off
    smart_days_off_response = await get_smart_days_off(current_user)
    
    return DashboardStats(
        total_disciplines=len(disciplines),
        total_units=total_units,
        completed_units=completed_units,
        remaining_units=total_units - completed_units,
        days_off_count=days_off_count,
        disciplines=discipline_stats,
        smart_days_off=smart_days_off_response
    )



class StudySuggestion(BaseModel):
    model_config = ConfigDict(extra="ignore")
    discipline_name: str
    discipline_id: str
    urgency_score: float
    reason: str
    remaining_units: int
    remaining_days: int


class CompletionPrediction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    scenario: str
    units_per_day: float
    predicted_completion_date: str
    days_until_completion: int
    on_track: bool


class CompletionSimulation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    average_productivity: float
    current_prediction: Optional[CompletionPrediction]
    scenarios: List[CompletionPrediction]
    warning: Optional[str]


@api_router.get("/dashboard/study-suggestion")
async def get_study_suggestion(current_user: User = Depends(get_current_user)):
    disciplines = await db.disciplines.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    
    if not disciplines:
        return {"suggestion": None, "message": "Nenhuma disciplina criada ainda"}
    
    now = datetime.now(timezone.utc)
    suggestions = []
    
    for discipline in disciplines:
        tracks = await db.tracks.find(
            {"discipline_id": discipline["id"]},
            {"_id": 0, "id": 1}
        ).to_list(1000)
        
        track_ids = [t["id"] for t in tracks]
        
        if not track_ids:
            continue
        
        units = await db.units.find(
            {"track_id": {"$in": track_ids}},
            {"_id": 0}
        ).to_list(10000)
        
        total_units = len(units)
        completed_units = sum(1 for u in units if u["completed"])
        remaining_units = total_units - completed_units
        
        if remaining_units == 0:
            continue
        
        deadline_str = discipline["deadline"]
        if 'T' in deadline_str:
            deadline_date = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        else:
            deadline_date = datetime.fromisoformat(deadline_str + "T00:00:00+00:00")
        
        remaining_days = max(1, (deadline_date - now).days)
        urgency_score = remaining_units / remaining_days
        
        progress_percentage = (completed_units / total_units * 100) if total_units > 0 else 0
        
        if urgency_score > 2:
            reason = "Prazo próximo e muitas UA restantes"
        elif progress_percentage < 30:
            reason = "Baixo progresso em relação ao prazo"
        elif remaining_days < 7:
            reason = "Prazo muito próximo"
        else:
            reason = "Disciplina com maior urgência"
        
        suggestions.append({
            "discipline_name": discipline["name"],
            "discipline_id": discipline["id"],
            "urgency_score": round(urgency_score, 2),
            "reason": reason,
            "remaining_units": remaining_units,
            "remaining_days": remaining_days
        })
    
    if not suggestions:
        return {"suggestion": None, "message": "Todas as disciplinas estão completas"}
    
    suggestions.sort(key=lambda x: x["urgency_score"], reverse=True)
    top_suggestion = suggestions[0]
    
    return {
        "suggestion": StudySuggestion(**top_suggestion),
        "all_suggestions": suggestions[:3]
    }


@api_router.get("/dashboard/completion-simulation")
async def get_completion_simulation(current_user: User = Depends(get_current_user)):
    disciplines = await db.disciplines.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    
    if not disciplines:
        return {
            "average_productivity": 0,
            "current_prediction": None,
            "scenarios": [],
            "warning": None
        }
    
    now = datetime.now(timezone.utc)
    
    total_completed_units = 0
    oldest_completion_date = None
    total_remaining_units = 0
    earliest_deadline = None
    
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
            
            completed_units = [u for u in units if u["completed"] and u.get("completed_at")]
            total_completed_units += len(completed_units)
            total_remaining_units += len([u for u in units if not u["completed"]])
            
            for unit in completed_units:
                completed_at_str = unit["completed_at"]
                if 'T' in completed_at_str:
                    completed_date = datetime.fromisoformat(completed_at_str.replace("Z", "+00:00"))
                    if oldest_completion_date is None or completed_date < oldest_completion_date:
                        oldest_completion_date = completed_date
        
        deadline_str = discipline["deadline"]
        if 'T' in deadline_str:
            deadline_date = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        else:
            deadline_date = datetime.fromisoformat(deadline_str + "T00:00:00+00:00")
        
        if earliest_deadline is None or deadline_date < earliest_deadline:
            earliest_deadline = deadline_date
    
    if total_completed_units == 0 or oldest_completion_date is None:
        average_productivity = 0
        study_days = 0
    else:
        study_days = max(1, (now - oldest_completion_date).days)
        average_productivity = total_completed_units / study_days
    
    scenarios = []
    
    for units_per_day in [1, 2, 3]:
        if units_per_day > 0:
            days_until_completion = int(total_remaining_units / units_per_day)
            predicted_date = now + timedelta(days=days_until_completion)
            
            on_track = True
            if earliest_deadline and predicted_date > earliest_deadline:
                on_track = False
            
            scenarios.append(CompletionPrediction(
                scenario=f"{units_per_day} UA/dia",
                units_per_day=float(units_per_day),
                predicted_completion_date=predicted_date.strftime("%d/%m/%Y"),
                days_until_completion=days_until_completion,
                on_track=on_track
            ))
    
    current_prediction = None
    warning = None
    
    if average_productivity > 0 and total_remaining_units > 0:
        days_until_completion = int(total_remaining_units / average_productivity)
        predicted_date = now + timedelta(days=days_until_completion)
        
        on_track = True
        if earliest_deadline and predicted_date > earliest_deadline:
            on_track = False
            warning = "⚠ Nesse ritmo você terminará após o prazo"
        
        current_prediction = CompletionPrediction(
            scenario="Ritmo atual",
            units_per_day=round(average_productivity, 2),
            predicted_completion_date=predicted_date.strftime("%d/%m/%Y"),
            days_until_completion=days_until_completion,
            on_track=on_track
        )
    
    return CompletionSimulation(
        average_productivity=round(average_productivity, 2),
        current_prediction=current_prediction,
        scenarios=scenarios,
        warning=warning
    )



@api_router.get("/dashboard/smart-days-off")
async def get_smart_days_off(current_user: User = Depends(get_current_user)):
    """
    Calcula folgas disponíveis baseado no ritmo de estudo do usuário.
    
    Fórmula:
    prazo_total = deadline - hoje
    predicted_days_to_finish = remaining_UA / units_per_day
    folgas_possiveis = prazo_total - predicted_days_to_finish
    """
    disciplines = await db.disciplines.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(1000)
    
    if not disciplines:
        return SmartDaysOff(
            available_days_off=0,
            days_off_used=0,
            can_take_day_off=False,
            message="Crie disciplinas para começar"
        )
    
    now = datetime.now(timezone.utc)
    
    # Calculate average productivity
    total_completed_units = 0
    oldest_completion_date = None
    total_remaining_units = 0
    earliest_deadline = None
    
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
            
            completed_units = [u for u in units if u["completed"] and u.get("completed_at")]
            total_completed_units += len(completed_units)
            total_remaining_units += len([u for u in units if not u["completed"]])
            
            for unit in completed_units:
                completed_at_str = unit["completed_at"]
                if 'T' in completed_at_str:
                    completed_date = datetime.fromisoformat(completed_at_str.replace("Z", "+00:00"))
                    if oldest_completion_date is None or completed_date < oldest_completion_date:
                        oldest_completion_date = completed_date
        
        deadline_str = discipline["deadline"]
        if 'T' in deadline_str:
            deadline_date = datetime.fromisoformat(deadline_str.replace("Z", "+00:00"))
        else:
            deadline_date = datetime.fromisoformat(deadline_str + "T00:00:00+00:00")
        
        if earliest_deadline is None or deadline_date < earliest_deadline:
            earliest_deadline = deadline_date
    
    days_off_used = await db.days_off.count_documents({"user_id": current_user.id})
    
    # If no productivity data yet
    if total_completed_units == 0 or oldest_completion_date is None:
        if earliest_deadline:
            prazo_total = max(0, (earliest_deadline - now).days)
            available_days_off = max(0, prazo_total - total_remaining_units)
            
            return SmartDaysOff(
                available_days_off=available_days_off,
                days_off_used=days_off_used,
                can_take_day_off=available_days_off > 0,
                message=f"Você tem {available_days_off} dias de folga possíveis" if available_days_off > 0 else "Complete algumas UAs para calcular suas folgas"
            )
        else:
            return SmartDaysOff(
                available_days_off=0,
                days_off_used=days_off_used,
                can_take_day_off=False,
                message="Configure prazos para suas disciplinas"
            )
    
    # Calculate average productivity
    study_days = max(1, (now - oldest_completion_date).days)
    units_per_day = total_completed_units / study_days
    
    if units_per_day == 0 or not earliest_deadline:
        return SmartDaysOff(
            available_days_off=0,
            days_off_used=days_off_used,
            can_take_day_off=False,
            message="Estude mais para calcular suas folgas disponíveis"
        )
    
    # Calculate available days off
    prazo_total = max(0, (earliest_deadline - now).days)
    predicted_days_to_finish = int(total_remaining_units / units_per_day)
    folgas_possiveis = max(0, prazo_total - predicted_days_to_finish - days_off_used)
    
    can_take = folgas_possiveis > 0
    
    if folgas_possiveis > 0:
        message = f"Você tem {folgas_possiveis} dias de folga disponíveis"
    elif folgas_possiveis == 0:
        message = "Você não tem folgas disponíveis no momento"
    else:
        message = "Aumente seu ritmo de estudo para ganhar folgas"
    
    return SmartDaysOff(
        available_days_off=folgas_possiveis,
        days_off_used=days_off_used,
        can_take_day_off=can_take,
        message=message
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