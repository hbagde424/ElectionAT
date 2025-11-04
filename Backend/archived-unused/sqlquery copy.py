from pymongo import MongoClient
from datetime import datetime

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['electionAT']

# Drop existing collections (for clean setup)
db.country.drop()
db.state.drop()
db.district.drop()
db.year.drop()
db.constituency.drop()
db.party.drop()
db.coalition.drop()
db.candidate.drop()
db.election.drop()
db.electionresult.drop()
db.pollingstation.drop()
db.pollingstationstats.drop()
db.candidatevotes.drop()
db.voterdemographic.drop()
db.parliament.drop()

# Create indexes (similar to SQL indexes)
def create_indexes():
    db.country.create_index([("ISO_code", 1)], unique=True)
    db.state.create_index([("country_id", 1)])
    db.district.create_index([("state_id", 1)])
    db.constituency.create_index([("district_id", 1), ("year_id", 1)])
    db.constituency.create_index([("year_id", 1)])
    db.candidate.create_index([("party_id", 1), ("constituency_id", 1), ("year_id", 1)])
    db.election.create_index([("country_id", 1), ("year_id", 1)])
    db.electionresult.create_index([("election_id", 1), ("constituency_id", 1), ("year_id", 1)])
    db.pollingstation.create_index([("constituency_id", 1)])
    db.voterdemographic.create_index([("constituency_id", 1), ("year_id", 1)])

# Insert sample data
def insert_sample_data():
    # Insert country
    country = db.country.insert_one({
        "name": "India",
        "ISO_code": "IN",
        "population": 1393409038,
        "area_sq_km": 3287263
    }).inserted_id
    
    # Insert year
    year = db.year.insert_one({
        "year": 2024,
        "description": "Year of General Election"
    }).inserted_id
    
    # Insert state
    state = db.state.insert_one({
        "country_id": country,
        "name": "Madhya Pradesh",
        "capital": "Bhopal"
    }).inserted_id
    
    # Insert district
    district = db.district.insert_one({
        "state_id": state,
        "name": "Indore",
        "population": 2200000
    }).inserted_id
    
    # Insert constituency
    constituency = db.constituency.insert_one({
        "district_id": district,
        "name": "Indore-1",
        "type": "General",
        "total_voters": 500000,
        "year_id": year
    }).inserted_id
    
    # Insert party
    party = db.party.insert_one({
        "name": "BJP",
        "abbreviation": "BJP",
        "founded_year": 1980,
        "ideology": "Right-wing",
        "flag_color": "Saffron"
    }).inserted_id
    
    # Insert coalition
    coalition = db.coalition.insert_one({
        "name": "NDA",
        "formed_date": datetime(1998, 3, 1),
        "dissolved_date": None
    }).inserted_id
    
    # Insert coalition member
    db.coalitionmember.insert_one({
        "coalition_id": coalition,
        "party_id": party
    })
    
    # Insert candidate
    candidate = db.candidate.insert_one({
        "name": "Amit Shah",
        "party_id": party,
        "constituency_id": constituency,
        "age": 56,
        "gender": "Male",
        "education": "Postgraduate",
        "year_id": year
    }).inserted_id
    
    # Insert election
    election = db.election.insert_one({
        "type": "General",
        "date": datetime(2024, 4, 1),
        "country_id": country,
        "description": "General Election for Parliament",
        "status": "Scheduled",
        "year_id": year
    }).inserted_id
    
    # Insert election result
    db.electionresult.insert_one({
        "election_id": election,
        "constituency_id": constituency,
        "candidate_id": candidate,
        "votes": 300000,
        "position": 1,
        "vote_percentage": 60.00,
        "deposit_lost": False,
        "year_id": year
    })
    
    # Insert polling stations
    polling_station1 = db.pollingstation.insert_one({
        "constituency_id": constituency,
        "booth_name": "Polling Station 1",
        "block_name": "Block 1",
        "booth_address": "123 Main Street, Indore",
        "local_issues": "Road condition improvement"
    }).inserted_id
    
    polling_station2 = db.pollingstation.insert_one({
        "constituency_id": constituency,
        "booth_name": "Polling Station 2",
        "block_name": "Block 2",
        "booth_address": "456 Another Street, Indore",
        "local_issues": "Water supply issues"
    }).inserted_id
    
    # Insert polling station stats
    db.pollingstationstats.insert_one({
        "polling_station_id": polling_station1,
        "total_valid_votes": 500000,
        "total_rejected_votes": 5000,
        "nota": 10000,
        "total": 515000,
        "total_registered_voters": 600000,
        "voter_turnout": 85.00,
        "delta_positive": 2.50,
        "tendered_votes": 2000
    })
    
    db.pollingstationstats.insert_one({
        "polling_station_id": polling_station2,
        "total_valid_votes": 505000,
        "total_rejected_votes": 4000,
        "nota": 9000,
        "total": 515000,
        "total_registered_voters": 610000,
        "voter_turnout": 83.00,
        "delta_positive": 2.00,
        "tendered_votes": 1800
    })
    
    # Insert candidate votes
    candidates = [
        {"polling_station_id": polling_station1, "candidate_name": "Umang Singhar", "total_votes": 120000},
        {"polling_station_id": polling_station1, "candidate_name": "Dhoomsingh Mandloi", "total_votes": 150000},
        {"polling_station_id": polling_station1, "candidate_name": "Sardar Singh Meda", "total_votes": 130000},
        {"polling_station_id": polling_station1, "candidate_name": "Suman Bai Bheru Singh Anare", "total_votes": 110000},
        {"polling_station_id": polling_station2, "candidate_name": "Umang Singhar", "total_votes": 125000},
        {"polling_station_id": polling_station2, "candidate_name": "Dhoomsingh Mandloi", "total_votes": 140000},
        {"polling_station_id": polling_station2, "candidate_name": "Sardar Singh Meda", "total_votes": 135000},
        {"polling_station_id": polling_station2, "candidate_name": "Suman Bai Bheru Singh Anare", "total_votes": 115000}
    ]
    db.candidatevotes.insert_many(candidates)
    
    # Insert voter demographic
    db.voterdemographic.insert_one({
        "constituency_id": constituency,
        "total_voters": 500000,
        "male_voters": 250000,
        "female_voters": 250000,
        "age_18_25": 100000,
        "age_26_35": 150000,
        "age_36_45": 120000,
        "age_46_55": 80000,
        "age_56_65": 40000,
        "age_65_plus": 30000,
        "year_id": year
    })
    
    # Insert parliament
    db.parliament.insert_one({
        "type": "Polygon",
        "features": {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[77.0, 23.0], [77.1, 23.0], [77.1, 23.1], [77.0, 23.1], [77.0, 23.0]]},
            "properties": {
                "Name": "Madhya Pradesh",
                "year_id": 2024
            }
        },
        "year_id": year
    })

# Create indexes and insert data
create_indexes()
insert_sample_data()

print("MongoDB database setup completed successfully!")