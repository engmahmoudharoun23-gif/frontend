import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def main():
    client = AsyncIOMotorClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client["wfm_reports"]
    users = await db.users.find({}).to_list(None)
    out = []
    for u in users:
        out.append({
            "name": u.get("name", ""),
            "username": u.get("username", ""),
            "projects": u.get("projects", [])
        })
    with open("../scratch/users_dump.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

asyncio.run(main())
