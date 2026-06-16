from pymongo import MongoClient

def test():
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    # Are there reports in 'مشروع المحافظات الغربية' for 'الدوادمي'?
    count1 = db.reports.count_documents({
        "project": {"$regex": "المحافظات الغربية", "$options": "i"},
        "governorate": {"$regex": "الدوادمي", "$options": "i"}
    })
    
    count2 = db.reports.count_documents({
        "project": {"$regex": "الدوادمي", "$options": "i"},
        "governorate": {"$regex": "الدوادمي", "$options": "i"}
    })
    
    print(f"Reports in الغربية for الدوادمي: {count1}")
    print(f"Reports in الدوادمي for الدوادمي: {count2}")

if __name__ == "__main__":
    test()
