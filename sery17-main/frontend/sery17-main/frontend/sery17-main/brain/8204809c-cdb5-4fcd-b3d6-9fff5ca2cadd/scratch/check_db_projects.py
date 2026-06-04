import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

# Set console output to utf-8
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

async def check_projects():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    projects = await db.projects.find({}, {'name': 1, '_id': 0}).to_list(100)
    print("Projects in DB:")
    for p in projects:
        name = p['name']
        print(f"- {name}")
    
    # Check reports count for these projects
    for p in projects:
        name = p['name']
        count = await db.reports.count_documents({'project': name, 'is_deleted': False})
        print(f"Project: {name}, Reports Count: {count}")
        
        # Check if there are reports with regex
        keywords = [k for k in name.replace('-', ' ').split() if len(k) > 1]
        if keywords:
            p_regex = ".*".join(keywords).replace('أ', '[أا]').replace('إ', '[إا]').replace('ا', '[اأإ]')
            regex_count = await db.reports.count_documents({'project': {'$regex': p_regex, '$options': 'i'}, 'is_deleted': False})
            print(f"  Regex Match Count: {regex_count} (pattern: {p_regex})")

if __name__ == "__main__":
    asyncio.run(check_projects())
