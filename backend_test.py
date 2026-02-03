import requests
import sys
import json
from datetime import datetime
import uuid
import io
import pandas as pd

class UPANALeadSystemTester:
    def __init__(self, base_url="https://psych-coordinator.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_lead_id = None
        self.session_id = f"test_session_{int(datetime.now().timestamp())}"

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:500]}")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_init(self):
        """Test admin initialization"""
        return self.run_test(
            "Admin Initialization",
            "POST",
            "auth/init-admin",
            200
        )

    def test_admin_login(self):
        """Test admin login"""
        return self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "juanr502@yahoo.es", "password": "Juanjose5826"}
        )

    def test_create_lead(self):
        """Test lead creation"""
        lead_data = {
            "name": f"Test Lead {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@test.com",
            "phone": "12345678",
            "career_interest": "psicologia_clinica"
        }
        
        success, response = self.run_test(
            "Create Lead",
            "POST",
            "leads",
            200,
            data=lead_data
        )
        
        if success and 'id' in response:
            self.test_lead_id = response['id']
            print(f"   Created lead ID: {self.test_lead_id}")
        
        return success, response

    def test_get_leads(self):
        """Test getting all leads"""
        return self.run_test(
            "Get All Leads",
            "GET",
            "leads",
            200
        )

    def test_get_lead_detail(self):
        """Test getting lead detail"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        return self.run_test(
            "Get Lead Detail",
            "GET",
            f"leads/{self.test_lead_id}",
            200
        )

    def test_update_lead(self):
        """Test updating lead"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        return self.run_test(
            "Update Lead",
            "PUT",
            f"leads/{self.test_lead_id}",
            200,
            data={"status": "contactado", "notes": "Test note from automated testing"}
        )

    def test_get_metrics(self):
        """Test getting metrics"""
        return self.run_test(
            "Get Metrics",
            "GET",
            "metrics",
            200
        )

    def test_get_careers(self):
        """Test getting careers"""
        return self.run_test(
            "Get Careers",
            "GET",
            "careers",
            200
        )

    def test_chat_ai(self):
        """Test AI chat functionality"""
        return self.run_test(
            "AI Chat",
            "POST",
            "chat",
            200,
            data={
                "session_id": self.session_id,
                "message": "¿Cuáles son las carreras disponibles en UPANA?"
            }
        )

    def test_generate_email_message(self):
        """Test email message generation"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        return self.run_test(
            "Generate Email Message",
            "POST",
            "generate-message",
            200,
            data={"lead_id": self.test_lead_id, "message_type": "email"}
        )

    def test_generate_whatsapp_message(self):
        """Test WhatsApp message generation"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        return self.run_test(
            "Generate WhatsApp Message",
            "POST",
            "generate-message",
            200,
            data={"lead_id": self.test_lead_id, "message_type": "whatsapp"}
        )

    def test_create_interaction(self):
        """Test creating interaction"""
        if not self.test_lead_id:
            print("❌ No test lead ID available")
            return False, {}
        
        return self.run_test(
            "Create Interaction",
            "POST",
            "interactions",
            200,
            data={
                "lead_id": self.test_lead_id,
                "interaction_type": "email",
                "message": "Test interaction message"
            }
        )

    def test_export_report(self):
        """Test report export"""
        success, _ = self.run_test(
            "Export Excel Report",
            "GET",
            "reports/export?format=excel",
            200
        )
        return success, {}

    def test_leads_filtering(self):
        """Test leads filtering"""
        return self.run_test(
            "Filter Leads by Status",
            "GET",
            "leads?status=nuevo",
            200
        )

def main():
    print("🚀 Starting UPANA Lead Management System API Tests")
    print("=" * 60)
    
    tester = UPANALeadSystemTester()
    
    # Test sequence
    tests = [
        tester.test_admin_init,
        tester.test_admin_login,
        tester.test_get_careers,
        tester.test_create_lead,
        tester.test_get_leads,
        tester.test_get_lead_detail,
        tester.test_update_lead,
        tester.test_get_metrics,
        tester.test_chat_ai,
        tester.test_generate_email_message,
        tester.test_generate_whatsapp_message,
        tester.test_create_interaction,
        tester.test_leads_filtering,
        tester.test_export_report
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.test_lead_id:
        print(f"🆔 Test Lead ID created: {tester.test_lead_id}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())