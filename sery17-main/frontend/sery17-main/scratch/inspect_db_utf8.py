import motor.motor_asyncio
import asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    
    with open("d:/sery17-main/sery17-main/scratch/db_output_utf8.txt", "w", encoding="utf-8") as out:
        dbs = await client.list_database_names()
        out.write(f"Databases: {dbs}\n")
        
        db = client["wfm_reports"]
        
        # Let's list all collections
        collections = await db.list_collection_names()
        out.write(f"Collections in wfm_reports: {collections}\n\n")
        
        try:
            projects = await db.projects.find().to_list(100)
            if projects:
                out.write("--- Projects ---\n")
                for p in projects:
                    out.write(f"Project: {p.get('name')} (ID: {p.get('id')})\n")
            
            govs = await db.project_governorates.find().to_list(1000)
            if govs:
                out.write(f"\n--- Project Governorates (Count: {len(govs)}) ---\n")
                for g in govs[:100]:
                    out.write(f"  Gov Name: {g.get('name')}, Project: {g.get('project')}\n")
        except Exception as e:
            out.write(f"Error: {str(e)}\n")

if __name__ == "__main__":
    asyncio.run(main())
