from pymongo import MongoClient
import os

client = MongoClient('mongodb://localhost:27017/')
db = client['sery17']
collection = db['users']

count = collection.count_documents({})
print(f"Total Users: {count}")
