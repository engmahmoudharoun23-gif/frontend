import motor.motor_asyncio
import asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    user = await db.users.find_one({"id": "b619d398-1927-4c57-8c56-8499ad5ef297"})
    print(f"Mahmoud User Doc: {user}")

if __name__ == "__main__":
    asyncio.run(main())
