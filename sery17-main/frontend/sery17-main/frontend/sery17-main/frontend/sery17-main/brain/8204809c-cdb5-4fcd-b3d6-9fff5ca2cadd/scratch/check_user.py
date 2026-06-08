
import motor.motor_asyncio
import asyncio
import json

async def check_user():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.sery17_db
    user = await db.users.find_one({"$or": [{"username": "البشير الطيب خليفة"}, {"name": {"$regex": "البشير", "$options": "i"}}]})
    if user:
        # Convert ObjectId if any
        user.pop("_id", None)
        print(json.dumps(user, indent=4, ensure_ascii=False))
    else:
        print("User not found")

asyncio.run(check_user())
