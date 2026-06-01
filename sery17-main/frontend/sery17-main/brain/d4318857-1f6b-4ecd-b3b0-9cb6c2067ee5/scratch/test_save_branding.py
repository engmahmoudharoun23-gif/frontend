import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def update_branding():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    update_data = {
        "footer_year": "2027",
        "login_footer_description": "Test Login Description",
        "internal_footer_description": "Test Internal Description",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": "manual_script"
    }
    
    result = await db.platform_settings.update_one(
        {"key": "branding"},
        {"$set": update_data},
        upsert=True
    )
    print(f"Update Result: {result.modified_count}, Upserted ID: {result.upserted_id}")
    
    branding = await db.platform_settings.find_one({"key": "branding"})
    print(f"Updated Branding: {branding}")

if __name__ == "__main__":
    asyncio.run(update_branding())
