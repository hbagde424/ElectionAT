from pymongo import MongoClient

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")  # Apne URI ke hisaab se update karein
db = client["electionAT"]

# Collections jo aapko **delete nahi** karni hai
collections_to_keep = ["AssemblyMaps", "Assemblypolygens", "Districtpolygens", "Parliamentpolygens", "users"]  # Yahan apni collections ka naam daalein jo bachaana hai

# Sabhi collections ka list
all_collections = db.list_collection_names()

# Delete karne waali collections
collections_to_delete = [col for col in all_collections if col not in collections_to_keep]

# Delete process
for col in collections_to_delete:
    db[col].drop()
    print(f"Deleted collection: {col}")

print("Finished deleting unwanted collections.")
