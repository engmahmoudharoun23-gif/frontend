import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_projects():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    async def print_hex(label, name):
        if name:
            hex_str = " ".join([f"{ord(c):04x}" for c in name])
            print(f"{label}: '{name}' (Hex: {hex_str})")
        else:
            print(f"{label}: None")

    print("--- Projects in projects collection ---")
    projects = await db.projects.find({}, {"name": 1}).to_list(100)
    for p in projects:
        await print_hex("Project", p.get("name"))
        
    print("\n--- Projects in water_connections ---")
    water_projects = await db.water_connections.distinct("project")
    for p in water_projects:
        await print_hex("Water Project", p)
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_projects())
