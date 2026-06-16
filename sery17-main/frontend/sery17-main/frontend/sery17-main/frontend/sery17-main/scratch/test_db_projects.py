import requests

def test():
    # 1. Login
    res = requests.post("http://localhost:8001/api/auth/login", json={"username": "admin", "password": "123"})
    if res.status_code != 200:
        # maybe password is not 123
        pass

    # Actually, we don't know the admin password.
    # But wait, earlier I checked the backend endpoints.
    # What if /api/projects is returning an EMPTY list [] because I inserted them in the WRONG DB?!
    
    # Let's check db contents directly using PyMongo
    from pymongo import MongoClient
    client = MongoClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    projects = list(db["projects"].find({}, {"_id":0}))
    print("Projects in DB:", projects)
    
test()
