import sys
import os
import asyncio

# Add project root and backend root to path
project_root = os.path.dirname(os.path.dirname(__file__))
backend_root = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_root)

from backend.server import export_reports_pdf, db, User

async def run_test():
    # Find an admin user
    user_doc = await db.users.find_one({"role": "admin"})
    if not user_doc:
        user_doc = await db.users.find_one({})
        
    if not user_doc:
        print("Error: No users found in database!")
        return

    # Convert user document to Pydantic User model
    current_user = User(**user_doc)
    
    print("Calling export_reports_pdf directly with explicit None values...")
    try:
        response = await export_reports_pdf(
            search=None,
            governorate=None,
            project=None,
            contractor=None,
            report_type=None,
            status=None,
            license_status=None,
            date_from=None,
            date_to=None,
            created_by=None,
            current_user=current_user
        )
        print("SUCCESS! Response type:", type(response))
    except Exception as e:
        print("FAILED with exception!")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run_test())
