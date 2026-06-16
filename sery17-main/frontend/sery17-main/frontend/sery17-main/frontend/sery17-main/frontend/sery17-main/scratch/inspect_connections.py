import motor.motor_asyncio
import asyncio
import json

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    water = await db.water_connections.find().to_list(100)
    sewage = await db.sewage_connections.find().to_list(100)
    
    with open("d:/sery17-main/sery17-main/scratch/connections_dump.json", "w", encoding="utf-8") as out:
        clean_data = {
            "water_connections": [],
            "sewage_connections": []
        }
        for item in water:
            clean_item = {}
            for k, v in item.items():
                if k == "_id":
                    clean_item[k] = str(v)
                else:
                    clean_item[k] = v
            clean_data["water_connections"].append(clean_item)
            
        for item in sewage:
            clean_item = {}
            for k, v in item.items():
                if k == "_id":
                    clean_item[k] = str(v)
                else:
                    clean_item[k] = v
            clean_data["sewage_connections"].append(clean_item)
            
        json.dump(clean_data, out, ensure_ascii=False, indent=2)
        
    print(f"Dumped {len(water)} water and {len(sewage)} sewage connections successfully.")

if __name__ == "__main__":
    asyncio.run(main())
