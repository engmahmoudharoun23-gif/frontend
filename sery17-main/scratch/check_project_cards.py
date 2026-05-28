import asyncio
import sys
import json
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def check_cards():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    cards = await db.project_cards.find().to_list(100)
    for c in cards:
        project = c.get('project', 'Unknown')
        labels = [card.get('label') for card in c.get('cards', [])]
        print(f"Project: {project}, Cards: {labels}")
    client.close()

if __name__ == "__main__":
    asyncio.run(check_cards())
