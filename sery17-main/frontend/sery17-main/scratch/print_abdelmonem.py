import motor.motor_asyncio
import asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    user = await db.users.find_one({"id": "e4e7fd3f-06e3-44e4-9f69-4725c73925ce"})
    with open("d:/sery17-main/sery17-main/scratch/user_record_unicode.txt", "w", encoding="utf-8") as out:
        out.write(f"User Record: {user}\n")
        out.write(f"Username: {user.get('username')}\n")
        out.write(f"Governorates: {user.get('governorates')}\n")
        out.write(f"Projects: {user.get('projects')}\n")
        out.write(f"Project Permissions: {user.get('project_permissions')}\n")

if __name__ == "__main__":
    asyncio.run(main())
