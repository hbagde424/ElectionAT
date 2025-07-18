const mongoose = require('mongoose');
const Country = require('./models/Country');
const State = require('../models/State');
const District = require('./models/District');
const Constituency = require('./models/Constituency');
const Party = require('./models/Party');
const Coalition = require('./models/Coalition');
const CoalitionMember = require('./models/CoalitionMember');
const Candidate = require('./models/Candidate');
const Election = require('./models/Election');
const ElectionResult = require('./models/ElectionResult');
const VoterDemographic = require('./models/VoterDemographic');
const Parliament = require('./models/Parliament');
const Year = require('./models/Year');

const seedDatabase = async () => {
  await mongoose.connect('mongodb://localhost:27017/electionAT');

  const year2024 = await Year.create({
    year_id: 1,
    year: 2024,
    description: 'General elections of India, 2024'
  });

  const india = await Country.create({
    country_id: 1,
    name: 'India',
    ISO_code: 'IN',
    population: 1400000000,
    area_sq_km: 3287263
  });

  const mp = await State.create({
    state_id: 1,
    country_id: india.country_id,
    name: 'Madhya Pradesh',
    capital: 'Bhopal'
  });

  const bhopalDistrict = await District.create({
    district_id: 1,
    state_id: mp.state_id,
    name: 'Bhopal',
    population: 2371061
  });

  const bhopalConstituency = await Constituency.create({
    constituency_id: 1,
    district_id: bhopalDistrict.district_id,
    name: 'Bhopal Lok Sabha',
    type: 'Parliament',
    total_voters: 1800000,
    year_id: year2024.year_id
  });

  const bjp = await Party.create({
    party_id: 1,
    name: 'Bharatiya Janata Party',
    abbreviation: 'BJP',
    founded_year: 1980,
    ideology: 'Hindutva, Nationalism',
    flag_color: 'Saffron'
  });

  const nda = await Coalition.create({
    coalition_id: 1,
    name: 'National Democratic Alliance',
    formed_date: new Date('1998-03-01'),
    dissolved_date: null
  });

  await CoalitionMember.create({
    coalition_id: nda.coalition_id,
    party_id: bjp.party_id
  });

  const candidate = await Candidate.create({
    candidate_id: 1,
    name: 'Shivraj Singh Chouhan',
    party_id: bjp.party_id,
    constituency_id: bhopalConstituency.constituency_id,
    age: 64,
    gender: 'Male',
    education: 'Graduate',
    year_id: year2024.year_id
  });

  const election = await Election.create({
    election_id: 1,
    type: 'Parliamentary',
    date: new Date('2024-04-19'),
    country_id: india.country_id,
    description: '17th Lok Sabha Election',
    status: 'Completed',
    year_id: year2024.year_id
  });

  await ElectionResult.create({
    result_id: 1,
    election_id: election.election_id,
    constituency_id: bhopalConstituency.constituency_id,
    candidate_id: candidate.candidate_id,
    votes: 800000,
    position: 1,
    vote_percentage: 55.3,
    deposit_lost: false,
    year_id: year2024.year_id
  });

  await VoterDemographic.create({
    demo_id: 1,
    constituency_id: bhopalConstituency.constituency_id,
    total_voters: 1800000,
    male_voters: 950000,
    female_voters: 850000,
    age_18_25: 300000,
    age_26_35: 400000,
    age_36_45: 350000,
    age_46_55: 300000,
    age_56_65: 250000,
    age_65_plus: 200000,
    year_id: year2024.year_id
  });

  await Parliament.create({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[77.4, 23.2], [77.5, 23.3], [77.6, 23.2], [77.4, 23.2]]]
        },
        properties: {
          Name: 'Bhopal',
          year_id: year2024.year_id
        }
      }
    ]
  });

  console.log('✅ Data inserted successfully!');
  process.exit();
};

seedDatabase().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
