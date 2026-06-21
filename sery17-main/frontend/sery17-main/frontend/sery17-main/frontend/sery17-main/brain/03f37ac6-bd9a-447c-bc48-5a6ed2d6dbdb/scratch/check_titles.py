import asyncio
import os
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv('.env')

async def check():
    url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    print(f"URL: {url}, DB: {db_name}")
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    users = await db.users.find({}, {'username': 1, 'full_name': 1, 'title': 1}).to_list(None)
    for u in users:
        print(f"User: {u.get('username')}, Full Name: {u.get('full_name')}, Title: {u.get('title')}")

if __name__ == "__main__":
    asyncio.run(check())
