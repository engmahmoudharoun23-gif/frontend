import motor.motor_asyncio
import asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    # Analyze water connections
    print("--- WATER CONNECTIONS ---")
    pipeline = [
        {"$group": {
            "_id": {
                "project": "$project",
                "governorate": "$governorate",
                "created_by": "$created_by"
            },
            "count": {"$sum": 1}
        }}
    ]
    cursor = db.water_connections.aggregate(pipeline)
    async for doc in cursor:
        print(doc)
        
    # Analyze sewage connections
    print("\n--- SEWAGE CONNECTIONS ---")
    cursor = db.sewage_connections.aggregate(pipeline)
    async for doc in cursor:
        print(doc)

if __name__ == "__main__":
    asyncio.run(main())
