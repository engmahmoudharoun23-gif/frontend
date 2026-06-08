import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    user = await db.users.find_one({"username": "Eng Abdelhafiz"})
    print("User Abdelhafiz:")
    import pprint
    pprint.pprint(user)
    client.close()

if __name__ == "__main__":
    asyncio.run(inspect())
