import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.abspath("d:/sery17-main/sery17-main/backend"))

from server import get_water_connections, db

async def main():
    # Fetch Abdelmonem user doc
    user = await db.users.find_one({"username": "Eng Abdelmonem Shamshoom"})
    
    # We call get_water_connections with page=1, limit=10, and user
    # We can pass mock Depends values
    from fastapi import HTTPException
    
    res = await get_water_connections(current_user=user)
    print("API Result Keys:", res.keys())
    print("Total Count:", res["total_count"])
    print("Connections:")
    for c in res["connections"]:
        print(f"ID: {c.get('id')}, Gov: {c.get('governorate')}, Customer: {c.get('customer_name')}")

if __name__ == "__main__":
    asyncio.run(main())
