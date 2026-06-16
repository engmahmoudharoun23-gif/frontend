import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient("mongodb+srv://sery17:sery17sery17@cluster0.k2sh8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    db = client.wfm_reports
    
    print("Checking recent 15 Safety Reports:")
    reports = await db.safety_reports.find({"is_deleted": {"$ne": True}}).sort("created_at", -1).limit(15).to_list(15)
    
    count_with_files = 0
    count_without_files = 0
    
    for r in reports:
        date = r.get("date", "NoDate")
        proj = r.get("project", "NoProj")
        created_at = r.get("created_at", "")
        
        has_file = False
        file_len = 0
        file_type = "None"
        
        if r.get("image"):
            has_file = True
            file_len = len(r.get("image"))
            file_type = "image field"
        elif r.get("images") and len(r.get("images")) > 0:
            has_file = True
            file_len = sum(len(img) if isinstance(img, str) else len(img.get("data", "")) for img in r.get("images"))
            file_type = "images array"
            
        if has_file:
            print(f"- [HAS FILE] {date} | {proj} | FileSize: ~{file_len/1024:.1f} KB | Type: {file_type} | Created: {created_at}")
            count_with_files += 1
        else:
            print(f"- [EMPTY]    {date} | {proj} | Created: {created_at}")
            count_without_files += 1
            
    print(f"\nSummary: {count_with_files} have files, {count_without_files} are empty.")
    
asyncio.run(check())
