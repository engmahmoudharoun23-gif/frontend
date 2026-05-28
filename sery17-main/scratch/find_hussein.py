import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.wfm_reports
    contractors = await db.contractors.find({}, {"_id": 0}).to_list(100)
    
    lines = []
    lines.append("=== Contractors ===")
    for c in contractors:
        lines.append(f"Name: {c.get('name')}, Project: {c.get('project')}")

    users = await db.users.find({}, {"_id": 0}).to_list(100)
    lines.append("\n=== Users ===")
    for u in users:
        lines.append(f"Username: {u.get('username')}, Projects: {u.get('projects')}, Permissions: {u.get('permissions')}, Project Permissions: {u.get('project_permissions')}")

    with open("../scratch/output.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("Done! Written to scratch/output.txt")

asyncio.run(main())
