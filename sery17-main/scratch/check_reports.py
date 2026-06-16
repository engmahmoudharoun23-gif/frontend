from pymongo import MongoClient

def test():
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    # Check all projects and governorates in reports
    reports = db.reports.aggregate([
        {"$group": {"_id": {"project": "$project", "governorate": "$governorate"}, "count": {"$sum": 1}}}
    ])
    
    for r in reports:
        print(f"Project: {r['_id'].get('project')}, Gov: {r['_id'].get('governorate')}, Count: {r['count']}")

if __name__ == "__main__":
    test()
