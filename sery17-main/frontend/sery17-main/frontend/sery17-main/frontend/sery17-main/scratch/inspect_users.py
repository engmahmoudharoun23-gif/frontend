import motor.motor_asyncio
import asyncio
import json

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    users = await db.users.find().to_list(100)
    
    with open("d:/sery17-main/sery17-main/scratch/users_dump.json", "w", encoding="utf-8") as out:
        # Convert ObjectId or other non-serializable objects to string
        clean_users = []
        for u in users:
            clean_u = {}
            for k, v in u.items():
                if k == "_id":
                    clean_u[k] = str(v)
                else:
                    clean_u[k] = v
            clean_users.append(clean_u)
            
        json.dump(clean_users, out, ensure_ascii=False, indent=2)
        
    print(f"Dumped {len(users)} users successfully to scratch/users_dump.json")

if __name__ == "__main__":
    asyncio.run(main())
