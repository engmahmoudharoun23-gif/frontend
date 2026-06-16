import json
from pymongo import MongoClient

def test():
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    user = db.users.find_one({"full_name": {"$regex": "مختار"}})
    
    projects = user.get("projects", [])
    govs = user.get("governorates", [])
    
    result = {
        "user_projects": projects,
        "user_govs": govs,
        "counts": {}
    }
    
    for p in projects:
        c = db.reports.count_documents({
            "project": p,
            "governorate": {"$in": govs}
        })
        result["counts"][p] = c
        
    # Also check "مشروع المحافظات الغربية"
    c_garb = db.reports.count_documents({
        "project": "مشروع المحافظات الغربية",
        "governorate": {"$in": govs}
    })
    result["counts"]["مشروع المحافظات الغربية"] = c_garb

    with open("d:\\sery17-main\\sery17-main\\scratch\\reports_summary.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    test()
