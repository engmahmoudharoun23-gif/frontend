import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_extracts():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    print("--- All Extracts ---")
    async for extract in db.extracts.find({"is_deleted": False}):
        print(f"ID: {extract.get('id')}, Project: '{extract.get('project')}', Created By: {extract.get('created_by')}, Number: {extract.get('extract_number')}")
    
    print("\n--- Users Check ---")
    async for user in db.users.find({"level": {"$in": ["1", "2", 1, 2]}}):
        print(f"Username: {user.get('username')}, Level: {user.get('level')}, Projects: {user.get('projects')}, ID: {user.get('id')}")

if __name__ == "__main__":
    asyncio.run(check_extracts())
