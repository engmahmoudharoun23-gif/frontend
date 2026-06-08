
import motor.motor_asyncio
import asyncio
import json

async def check_user():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    user = await db.users.find_one({"username": "AlBashir"})
    if user:
        user.pop("_id", None)
        print(json.dumps(user, indent=4, ensure_ascii=False))
    else:
        print("User not found")

asyncio.run(check_user())
