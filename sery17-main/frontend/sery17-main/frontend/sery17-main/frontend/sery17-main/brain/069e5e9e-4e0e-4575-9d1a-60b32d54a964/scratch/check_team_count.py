from pymongo import MongoClient
import os

client = MongoClient('mongodb://localhost:27017/')
db = client['sery17']
collection = db['team_members']

count = collection.count_documents({})
print(f"Total Team Members: {count}")

# Check first 5 members
for member in collection.find().limit(5):
    print(member)
