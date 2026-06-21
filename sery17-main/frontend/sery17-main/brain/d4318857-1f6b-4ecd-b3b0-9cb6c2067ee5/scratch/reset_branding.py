import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

async def reset_branding():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    
    update_data = {
        "footer_year": "2026",
        "copyright_text": "جميع الحقوق محفوظة",
        "login_footer_description": "نظام إدارة البلاغات المستلمة من WFM لربط المكاتب الاستشارية مع شركة المياه الوطنية.",
        "internal_footer_description": "نظام إدارة البلاغات المستلمة من WFM",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": "reset_script"
    }
    
    await db.platform_settings.update_one(
        {"key": "branding"},
        {"$set": update_data},
        upsert=True
    )
    print("Branding reset successfully.")

if __name__ == "__main__":
    asyncio.run(reset_branding())
