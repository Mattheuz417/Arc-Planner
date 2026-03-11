import requests
import sys
import json
from datetime import datetime, timedelta

class ArcPlannerAPITester:
    def __init__(self, base_url="https://studyflow-hub-5.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.discipline_id = None
        self.track_id = None
        self.unit_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"teste{timestamp}@arcplanner.com",
            "password": "teste123456",
            "name": f"Usuário Teste {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test user login with predefined credentials"""
        test_data = {
            "email": "teste@arcplanner.com",
            "password": "teste123456"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_me(self):
        """Test authentication verification"""
        success, response = self.run_test(
            "Auth Me",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_discipline(self):
        """Test discipline creation"""
        start_date = datetime.now().isoformat()
        deadline = (datetime.now() + timedelta(days=30)).isoformat()
        
        test_data = {
            "name": "Matemática Avançada",
            "start_date": start_date,
            "deadline": deadline
        }
        
        success, response = self.run_test(
            "Create Discipline",
            "POST",
            "disciplines",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.discipline_id = response['id']
            print(f"   Discipline ID: {self.discipline_id}")
            return True
        return False

    def test_get_disciplines(self):
        """Test listing disciplines"""
        success, response = self.run_test(
            "Get Disciplines",
            "GET",
            "disciplines",
            200
        )
        
        if success:
            print(f"   Found {len(response)} disciplines")
        return success

    def test_get_discipline_detail(self):
        """Test getting discipline details"""
        if not self.discipline_id:
            print("❌ No discipline ID available for detail test")
            return False
            
        success, response = self.run_test(
            "Get Discipline Detail",
            "GET",
            f"disciplines/{self.discipline_id}",
            200
        )
        return success

    def test_update_discipline(self):
        """Test updating discipline"""
        if not self.discipline_id:
            print("❌ No discipline ID available for update test")
            return False
            
        start_date = datetime.now().isoformat()
        deadline = (datetime.now() + timedelta(days=45)).isoformat()
        
        test_data = {
            "name": "Matemática Avançada - Atualizada",
            "start_date": start_date,
            "deadline": deadline
        }
        
        success, response = self.run_test(
            "Update Discipline",
            "PUT",
            f"disciplines/{self.discipline_id}",
            200,
            data=test_data
        )
        return success

    def test_create_track(self):
        """Test track creation"""
        if not self.discipline_id:
            print("❌ No discipline ID available for track creation")
            return False
            
        test_data = {
            "name": "Álgebra Linear"
        }
        
        success, response = self.run_test(
            "Create Track",
            "POST",
            f"disciplines/{self.discipline_id}/tracks",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.track_id = response['id']
            print(f"   Track ID: {self.track_id}")
            return True
        return False

    def test_get_tracks(self):
        """Test listing tracks"""
        if not self.discipline_id:
            print("❌ No discipline ID available for tracks listing")
            return False
            
        success, response = self.run_test(
            "Get Tracks",
            "GET",
            f"disciplines/{self.discipline_id}/tracks",
            200
        )
        
        if success:
            print(f"   Found {len(response)} tracks")
        return success

    def test_update_track(self):
        """Test updating track"""
        if not self.track_id:
            print("❌ No track ID available for update test")
            return False
            
        test_data = {
            "name": "Álgebra Linear - Atualizada"
        }
        
        success, response = self.run_test(
            "Update Track",
            "PUT",
            f"tracks/{self.track_id}",
            200,
            data=test_data
        )
        return success

    def test_create_units(self):
        """Test creating learning units"""
        if not self.track_id:
            print("❌ No track ID available for units creation")
            return False
            
        test_data = {
            "count": 5
        }
        
        success, response = self.run_test(
            "Create Units",
            "POST",
            f"tracks/{self.track_id}/units",
            200,
            data=test_data
        )
        return success

    def test_get_units(self):
        """Test listing units"""
        if not self.track_id:
            print("❌ No track ID available for units listing")
            return False
            
        success, response = self.run_test(
            "Get Units",
            "GET",
            f"tracks/{self.track_id}/units",
            200
        )
        
        if success and len(response) > 0:
            self.unit_id = response[0]['id']
            print(f"   Found {len(response)} units, first unit ID: {self.unit_id}")
        return success

    def test_toggle_unit(self):
        """Test toggling unit completion"""
        if not self.unit_id:
            print("❌ No unit ID available for toggle test")
            return False
            
        success, response = self.run_test(
            "Toggle Unit",
            "PATCH",
            f"units/{self.unit_id}/toggle",
            200
        )
        
        if success:
            print(f"   Unit completed: {response.get('completed', 'unknown')}")
        return success

    def test_create_day_off(self):
        """Test creating day off"""
        today = datetime.now().strftime('%Y-%m-%d')
        
        test_data = {
            "date": today
        }
        
        success, response = self.run_test(
            "Create Day Off",
            "POST",
            "days-off",
            200,
            data=test_data
        )
        return success

    def test_get_days_off(self):
        """Test listing days off"""
        success, response = self.run_test(
            "Get Days Off",
            "GET",
            "days-off",
            200
        )
        
        if success:
            print(f"   Found {len(response)} days off")
        return success

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            print(f"   Stats: {response.get('total_disciplines', 0)} disciplines, "
                  f"{response.get('total_units', 0)} total units, "
                  f"{response.get('completed_units', 0)} completed")
        return success

    def test_delete_track(self):
        """Test deleting track"""
        if not self.track_id:
            print("❌ No track ID available for deletion test")
            return False
            
        success, response = self.run_test(
            "Delete Track",
            "DELETE",
            f"tracks/{self.track_id}",
            200
        )
        return success

    def test_delete_discipline(self):
        """Test deleting discipline"""
        if not self.discipline_id:
            print("❌ No discipline ID available for deletion test")
            return False
            
        success, response = self.run_test(
            "Delete Discipline",
            "DELETE",
            f"disciplines/{self.discipline_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Arc Planner API Tests")
    print("=" * 50)
    
    tester = ArcPlannerAPITester()
    
    # Test sequence
    tests = [
        # Authentication tests
        ("Register User", tester.test_register),
        ("Verify Auth", tester.test_auth_me),
        
        # Discipline CRUD tests
        ("Create Discipline", tester.test_create_discipline),
        ("List Disciplines", tester.test_get_disciplines),
        ("Get Discipline Detail", tester.test_get_discipline_detail),
        ("Update Discipline", tester.test_update_discipline),
        
        # Track tests
        ("Create Track", tester.test_create_track),
        ("List Tracks", tester.test_get_tracks),
        ("Update Track", tester.test_update_track),
        
        # Units tests
        ("Create Units", tester.test_create_units),
        ("List Units", tester.test_get_units),
        ("Toggle Unit", tester.test_toggle_unit),
        
        # Days off tests
        ("Create Day Off", tester.test_create_day_off),
        ("List Days Off", tester.test_get_days_off),
        
        # Dashboard tests
        ("Dashboard Stats", tester.test_dashboard_stats),
        
        # Cleanup tests
        ("Delete Track", tester.test_delete_track),
        ("Delete Discipline", tester.test_delete_discipline),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())