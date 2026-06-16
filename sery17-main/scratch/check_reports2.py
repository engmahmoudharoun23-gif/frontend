from pymongo import MongoClient

def test():
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    reports = db.reports.aggregate([
        {"$group": {"_id": {"project": "$project", "governorate": "$governorate"}, "count": {"$sum": 1}}}
    ])
    
    with open("d:\\sery17-main\\sery17-main\\scratch\\reports_summary.txt", "w", encoding="utf-8") as f:
        for r in reports:
            f.write(f"Project: {r['_id'].get('project')}, Gov: {r['_id'].get('governorate')}, Count: {r['count']}\n")

if __name__ == "__main__":
    test()
