import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    dbs = await client.list_database_names()
    print(f"Databases: {dbs}")
    for db_name in dbs:
        if db_name in ['admin', 'local', 'config']: continue
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f" - {db_name}: {collections}")
        if 'users' in collections:
            users = await db.users.find({}).to_list(100)
            print(f"   Users: {[u.get('username') for u in users]}")

if __name__ == "__main__":
    asyncio.run(main())
