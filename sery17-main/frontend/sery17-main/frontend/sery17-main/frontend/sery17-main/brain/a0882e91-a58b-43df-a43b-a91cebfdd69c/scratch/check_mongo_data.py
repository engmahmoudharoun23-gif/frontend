import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    
    # List all databases
    dbs = await client.list_database_names()
    print(f"Databases: {dbs}")
    
    for db_name in dbs:
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"\nDatabase: {db_name}")
        for coll_name in collections:
            count = await db[coll_name].count_documents({})
            print(f"  - {coll_name}: {count} documents")
            if coll_name == "users":
                users = await db[coll_name].find().to_list(10)
                print(f"    Sample users: {[u.get('username') for u in users]}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_db())
