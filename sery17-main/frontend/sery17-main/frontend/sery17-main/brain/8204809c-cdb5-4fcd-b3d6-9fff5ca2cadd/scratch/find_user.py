
import motor.motor_asyncio
import asyncio
import json
import os

async def find_db_and_user():
    mongo_url = "mongodb://localhost:27017"
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    
    # List all databases
    db_names = await client.list_database_names()
    print(f"Databases: {db_names}")
    
    for db_name in db_names:
        if db_name in ['admin', 'local', 'config']: continue
        db = client[db_name]
        users = await db.users.find({}, {"name": 1, "username": 1}).to_list(100)
        if users:
            print(f"Found users in DB '{db_name}':")
            for u in users:
                print(f" - {u.get('name')} ({u.get('username')})")
            
            # Find specific user
            target = await db.users.find_one({"name": {"$regex": "البشير", "$options": "i"}})
            if target:
                target.pop("_id", None)
                print(f"\nTarget User found in '{db_name}':")
                print(json.dumps(target, indent=4, ensure_ascii=False))
                break

asyncio.run(find_db_and_user())
