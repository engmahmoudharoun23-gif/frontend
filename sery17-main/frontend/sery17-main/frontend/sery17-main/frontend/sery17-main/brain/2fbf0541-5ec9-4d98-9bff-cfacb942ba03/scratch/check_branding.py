import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_branding():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    branding = await db.platform_settings.find_one({"key": "branding"})
    if branding:
        print("Branding found:")
        for k, v in branding.items():
            if k != "_id":
                print(f"  {k}: {v}")
    else:
        print("Branding not found!")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_branding())
