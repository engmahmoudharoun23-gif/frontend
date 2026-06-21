from pymongo import MongoClient

def inspect_users():
    client = MongoClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
    db = client['wfm_reports']
    
    users = db.users.find({"role": "user"})
    for u in users:
        print(f"Name: {u.get('full_name')} | Username: {u.get('username')} | Level2: {u.get('can_create_subusers')} | Govs: {len(u.get('governorates', []))}")

if __name__ == "__main__":
    inspect_users()
