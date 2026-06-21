import asyncio
import httpx
from pymongo import MongoClient

async def test():
    # 1. Connect to DB and find Mukhtar
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    user = db.users.find_one({"full_name": {"$regex": "مختار"}})
    if not user:
        print("Mukhtar not found")
        return
        
    user_id = user["id"]
    
    # 2. To get a valid token, we can just use the login endpoint if we know the password.
    # We don't. We must generate a JWT.
    import jwt
    from datetime import datetime, timedelta, timezone
    
    # SECRET_KEY and ALGORITHM from server.py
    SECRET_KEY = "your-secret-key-change-this"
    ALGORITHM = "HS256"
    
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # 3. Call the API
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {encoded_jwt}"}
        params = {"skip": 0, "limit": 10}
        
        response = await client.get("http://localhost:8001/api/reports", headers=headers, params=params)
        print("Status:", response.status_code)
        
        if response.status_code == 200:
            print("Total Reports Returned:", response.json().get("total"))
            
if __name__ == "__main__":
    asyncio.run(test())
