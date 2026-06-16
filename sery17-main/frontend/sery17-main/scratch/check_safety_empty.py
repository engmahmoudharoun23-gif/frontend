import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check():
    client = AsyncIOMotorClient('mongodb://127.0.0.1:27017/')
    db = client.wfm_db
    reps = await db.safety_reports.find({"is_deleted": {"$ne": True}}).to_list(100)
    
    no_image_reps = []
    for r in reps:
        has_image = bool(r.get('image'))
        has_images = bool(r.get('images') and len(r.get('images', [])) > 0)
        has_file = bool(r.get('file'))
        has_files = bool(r.get('files') and len(r.get('files', [])) > 0)
        has_file_url = bool(r.get('file_url'))
        
        if not has_image and not has_images:
            no_image_reps.append({
                "id": r.get('id'),
                "date": r.get('date'),
                "project": r.get('project'),
                "has_file": has_file,
                "has_files": has_files,
                "has_file_url": has_file_url,
                "keys": list(r.keys())
            })
            
    print(f"Total reports: {len(reps)}")
    print(f"Reports with NO image or images: {len(no_image_reps)}")
    for nr in no_image_reps:
        print(nr)

asyncio.run(check())
