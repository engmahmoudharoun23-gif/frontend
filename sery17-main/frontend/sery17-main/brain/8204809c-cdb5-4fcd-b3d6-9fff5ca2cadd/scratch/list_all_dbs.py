
import motor.motor_asyncio
import asyncio

async def list_dbs():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    dbs = await client.list_database_names()
    print("Databases on this system:")
    for d in dbs:
        print(f" - {d}")

asyncio.run(list_dbs())
