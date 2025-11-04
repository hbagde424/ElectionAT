const mongoose = require('mongoose');
require('./config/db');
const Booth = require('./models/booth');
const Gender = require('./models/gender');
const BoothDemographics = require('./models/boothDemographics');

async function checkBooths() {
  try {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('=== CHECKING BOOTH DATA ===');
    
    // Get sample booths
    const booths = await Booth.find().limit(20).select('name booth_number _id');
    console.log('Sample booths:', booths.map(b => ({ id: b._id, name: b.name, booth_number: b.booth_number })));
    
    // Check specific booth numbers from frontend logs
    const testBooths = ['45', '60', '139', '70'];
    
    for (const boothNum of testBooths) {
      console.log(`\n--- Checking booth number: ${boothNum} ---`);
      
      const booth = await Booth.findOne({ booth_number: boothNum });
      if (booth) {
        console.log(`✅ Found booth: ${booth.name}, ID: ${booth._id}`);
        
        // Check if gender data exists for this booth
        const genderData = await Gender.find({ booth_id: booth._id });
        console.log(`Gender records: ${genderData.length}`);
        
        // Check booth demographics
        const demographics = await BoothDemographics.findOne({ booth_id: booth._id });
        if (demographics) {
          console.log(`✅ Demographics found - Male: ${demographics.male_electors}, Female: ${demographics.female_electors}, Total: ${demographics.total_electors}`);
        } else {
          console.log('❌ No demographics data');
        }
      } else {
        console.log(`❌ Booth ${boothNum} not found`);
      }
    }
    
    // Also check what booth numbers actually exist
    console.log('\n=== AVAILABLE BOOTH NUMBERS (first 20) ===');
    const availableBooths = await Booth.find().limit(20).select('booth_number name');
    availableBooths.forEach(b => console.log(`${b.booth_number} - ${b.name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBooths();