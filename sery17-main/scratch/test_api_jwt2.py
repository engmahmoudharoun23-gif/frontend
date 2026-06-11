import asyncio
import httpx
from pymongo import MongoClient

async def test():
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    user = db.users.find_one({"full_name": {"$regex": "مختار"}})
    user_id = user["id"]
    
    import jwt
    from datetime import datetime, timedelta, timezone
    SECRET_KEY = "your-secret-key-change-this"
    ALGORITHM = "HS256"
    expire = datetime.now(timezone.utc) + timedelta(minutes=60)
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {encoded_jwt}"}
        params = {"skip": 0, "limit": 10}
        response = await client.get("http://localhost:8001/api/reports", headers=headers, params=params)
        print("Status:", response.status_code)
        print("Response:", response.text[:200])
        
if __name__ == "__main__":
    asyncio.run(test())
