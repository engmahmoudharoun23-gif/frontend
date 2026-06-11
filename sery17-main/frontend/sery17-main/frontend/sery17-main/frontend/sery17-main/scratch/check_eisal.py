import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
from datetime import datetime, timedelta

async def check():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    now = datetime.utcnow()
    ago_72 = now - timedelta(hours=72)
    
    all_reports = await db.reports.find({
        'is_deleted': {'$ne': True}
    }, {"_id": 0, "project": 1, "created_at": 1, "start_date": 1}).to_list(10000)
    
    project_counts = {}
    for r in all_reports:
        dt = None
        sd = r.get('start_date')
        ca = r.get('created_at')
        if isinstance(sd, datetime): dt = sd
        elif isinstance(sd, str): 
            try: dt = datetime.fromisoformat(sd.replace('Z', ''))
            except: pass
        
        if not dt:
            if isinstance(ca, datetime): dt = ca
            elif isinstance(ca, str):
                try: dt = datetime.fromisoformat(ca.replace('Z', ''))
                except: pass
        
        if dt and dt >= ago_72:
            p = r.get('project', 'Unknown')
            project_counts[p] = project_counts.get(p, 0) + 1
    
    res = {
        "project_counts": project_counts
    }
    
    with open('scratch/eisal_govs.json', 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=2, default=str)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check())
