from pymongo import MongoClient

def test():
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    user = db.users.find_one({"full_name": {"$regex": "مختار"}})
    
    print("User Projects:", user.get("projects"))
    print("User Governorates:", user.get("governorates"))
    
    query = {
        "is_deleted": {"$ne": True},
        "governorate": {"$in": user.get("governorates", [])},
        "project": {"$in": user.get("projects", [])}
    }
    
    # All reports matching this
    all_count = db.reports.count_documents(query)
    
    # Reports created by Mukhtar
    mukhtar_query = query.copy()
    mukhtar_query["created_by"] = user.get("username")
    mukhtar_count = db.reports.count_documents(mukhtar_query)
    
    print(f"Total reports matching his governorate/project: {all_count}")
    print(f"Reports actually created by Mukhtar: {mukhtar_count}")
    print(f"Difference (what he should see extra): {all_count - mukhtar_count}")
    
    if all_count - mukhtar_count > 0:
        other_reports = db.reports.find(query).limit(5)
        for r in other_reports:
            print(f"Report: {r.get('report_number')} - created_by: {r.get('created_by')}")

if __name__ == "__main__":
    test()
