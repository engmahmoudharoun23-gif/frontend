import asyncio
import sys
import httpx

sys.path.append(r'd:\sery17-main\sery17-main\backend')
import server
from database import db
from jose import jwt

async def test():
    # Get Mukhtar's user ID
    user = await db.users.find_one({"full_name": {"$regex": "مختار"}})
    if not user:
        print("Mukhtar not found")
        return
        
    user_id = user["id"]
    print(f"Mukhtar ID: {user_id}")
    
    # Generate a JWT token directly
    access_token_expires = server.timedelta(minutes=server.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = server.create_access_token(
        data={"sub": user_id}, expires_delta=access_token_expires
    )
    
    # Make API call to localhost:8001/api/reports
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Exact params sent by Reports.js (initially)
        params = {
          "search": "",
          "governorate": "",
          "project": "",
          "contractor": "",
          "report_type": "",
          "status": "",
          "license_status": "",
          "date_from": "",
          "date_to": "",
          "start_date_from": "",
          "start_date_to": "",
          "created_by": "",
          "skip": 0,
          "limit": 10
        }
        
        response = await client.get("http://localhost:8001/api/reports", headers=headers, params=params)
        
        if response.status_code == 200:
            data = response.json()
            reports = data.get("reports", [])
            total = data.get("total", 0)
            print(f"API Returned {len(reports)} reports, Total in DB: {total}")
            for r in reports:
                print(f" - {r.get('report_number')} by {r.get('created_by')}")
        else:
            print(f"Error {response.status_code}: {response.text}")

if __name__ == "__main__":
    asyncio.run(test())
