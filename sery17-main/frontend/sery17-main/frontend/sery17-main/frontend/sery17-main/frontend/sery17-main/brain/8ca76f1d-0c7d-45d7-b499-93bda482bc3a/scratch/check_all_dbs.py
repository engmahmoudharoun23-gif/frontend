import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_db():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    dbs = await client.list_database_names()
    print(f"Databases: {dbs}")
    
    for db_name in dbs:
        if db_name in ['admin', 'config', 'local']: continue
        db = client[db_name]
        colls = await db.list_collection_names()
        print(f"\nDB: {db_name}, Collections: {colls}")
        if 'projects' in colls:
            count = await db.projects.count_documents({})
            print(f"  - projects: {count} docs")
            if count > 0:
                docs = await db.projects.find().to_list(10)
                for d in docs:
                    print(f"    - {d.get('name')}")
        if 'users' in colls:
            count = await db.users.count_documents({})
            print(f"  - users: {count} docs")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
