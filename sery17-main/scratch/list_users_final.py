import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def list_users_final():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    users = await db.users.find().to_list(100)
    print(f"{'Username':<15} | {'Full Name':<25} | {'Role':<10}")
    print("-" * 60)
    for u in users:
        print(f"{u.get('username', 'N/A'):<15} | {u.get('full_name', 'N/A'):<25} | {u.get('role', 'N/A'):<10}")
    client.close()

if __name__ == "__main__":
    asyncio.run(list_users_final())
