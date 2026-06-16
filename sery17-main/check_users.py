import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def get_user():
    client = AsyncIOMotorClient('mongodb+srv://mahmoud123:mahmoud123@cluster0.n1byl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    db = client['sery_app']
    
    # get Amin Mokhtar
    user = await db.users.find_one({"username": {"$regex": "amin", "$options": "i"}})
    if not user:
        user = await db.users.find_one({"full_name": {"$regex": "امين", "$options": "i"}})
    
    print("Amin Role:", user.get("role") if user else "Not found")
    print("Amin Govs:", user.get("governorates") if user else "Not found")
    
    # get ElShazly
    user2 = await db.users.find_one({"username": {"$regex": "shazly", "$options": "i"}})
    if not user2:
        user2 = await db.users.find_one({"full_name": {"$regex": "شاذلي", "$options": "i"}})
    
    print("Shazly Role:", user2.get("role") if user2 else "Not found")
    print("Shazly Govs:", user2.get("governorates") if user2 else "Not found")
    
    # get Mohamed Esmat
    user3 = await db.users.find_one({"username": {"$regex": "esmat", "$options": "i"}})
    if not user3:
        user3 = await db.users.find_one({"full_name": {"$regex": "عصمت", "$options": "i"}})
    
    print("Esmat Role:", user3.get("role") if user3 else "Not found")
    print("Esmat Govs:", user3.get("governorates") if user3 else "Not found")

asyncio.run(get_user())
