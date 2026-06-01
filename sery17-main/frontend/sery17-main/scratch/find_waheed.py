from pymongo import MongoClient

def find_waheed():
    client = MongoClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    users = list(db.users.find({"$or": [{"username": {"$regex": "وحيد"}}, {"full_name": {"$regex": "وحيد"}}]}))
    for u in users:
        print(f"ID: {u.get('id')}, Username: {u.get('username')}, Full Name: {u.get('full_name')}")

if __name__ == "__main__":
    find_waheed()
