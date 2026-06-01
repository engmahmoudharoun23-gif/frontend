import motor.motor_asyncio
import asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    conn = await db.water_connections.find_one({"id": "836f6bb9-d2fd-40c1-8af8-dc93e731b8b9"})
    print(f"Jeddah Connection: {conn}")

if __name__ == "__main__":
    asyncio.run(main())
