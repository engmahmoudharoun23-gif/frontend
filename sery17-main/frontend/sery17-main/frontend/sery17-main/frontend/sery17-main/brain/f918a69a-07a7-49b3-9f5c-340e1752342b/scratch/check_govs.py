
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

async def check_govs():
    env_path = Path("d:/sery17-main/sery17-main/backend/.env")
    load_dotenv(dotenv_path=env_path)
    db = AsyncIOMotorClient(os.environ['MONGO_URL'])[os.environ['DB_NAME']]
    
    # Check Shawky's reports governorates
    reports = await db.reports.find({"created_by": "b5ae8ee4-b568-4193-be71-fa16d6897af6"}).to_list(100)
    for r in reports:
        gov = r.get('governorate')
        print(f"Report ID: {r.get('id')}, Gov: '{gov}', Hex: {gov.encode('utf-8').hex() if gov else 'None'}")
    
    # Check Shawky's user governorates
    user = await db.users.find_one({"id": "b5ae8ee4-b568-4193-be71-fa16d6897af6"})
    print(f"User Govs: {user.get('governorates')}")
    if user.get('governorates'):
        for g in user.get('governorates'):
            print(f"User Gov: '{g}', Hex: {g.encode('utf-8').hex()}")

if __name__ == "__main__":
    asyncio.run(check_govs())
