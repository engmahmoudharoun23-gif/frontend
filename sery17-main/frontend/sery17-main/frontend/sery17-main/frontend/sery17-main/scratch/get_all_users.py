from pymongo import MongoClient
import json

def get_users():
    client = MongoClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    users = list(db.users.find({}, {"_id": 0, "username": 1, "full_name": 1}))
    with open("scratch/all_users.json", "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    get_users()
