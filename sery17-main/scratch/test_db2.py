from pymongo import MongoClient
import pprint

def test():
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    user = db.users.find_one({"full_name": {"$regex": "مختار"}})
    if not user:
        print("User Mukhtar not found")
        return
        
    pprint.pprint(user.get("project_permissions"))

if __name__ == "__main__":
    test()
