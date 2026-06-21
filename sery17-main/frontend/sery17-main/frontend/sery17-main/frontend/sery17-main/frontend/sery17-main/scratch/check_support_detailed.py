import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_support():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    msgs = await db.support_messages.find().to_list(100)
    print("Support Messages:")
    for m in msgs:
        print(f"- From: {m.get('sender_name')}, Text: {m.get('message')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_support())
