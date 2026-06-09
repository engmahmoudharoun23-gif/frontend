import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv('../backend/.env')

async def main():
    mongo_url = os.environ.get("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client.wfm_reports
    
    users = ["Eng Mahmoud Haroun", "admin", "Eng Medhat Hussien"]
    with open("admin_names_output.txt", "w", encoding="utf-8") as f:
        for username in users:
            u = await db.users.find_one({"username": username})
            if u:
                f.write(f"Username: {u.get('username')}\n")
                f.write(f"  Full Name: {u.get('full_name')}\n")
                f.write(f"  Title: {u.get('title')}\n")
                f.write("-" * 30 + "\n")
            
if __name__ == '__main__':
    asyncio.run(main())
