const mongoose = require('mongoose');
require('dotenv').config();

const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Your test data
    const testData = {
      state_name: 'Madhya Pradesh',
      division_code: '4',
      parliament_no: '25',
      AC_NO: '197',
      block_name: '1',
      booth_number: '1'
    };

    console.log('\n=== DIAGNOSTIC REPORT ===\n');
    console.log('Looking for:', testData);

    // Check State
    console.log('\n1. STATE LOOKUP:');
    const state = await State.findOne({ name: { $regex: `^${testData.state_name}`, $options: 'i' } });
    console.log('   Found:', state ? `${state.name} (ID: ${state._id})` : 'NOT FOUND');

    // Check Division
    console.log('\n2. DIVISION LOOKUP:');
    const division = await Division.findOne({ division_code: { $regex: `^${testData.division_code}`, $options: 'i' } });
    console.log('   Found:', division ? `${division.name} (Code: ${division.division_code}, ID: ${division._id})` : 'NOT FOUND');

    // Check Parliament
    console.log('\n3. PARLIAMENT LOOKUP:');
    const parliament = await Parliament.findOne({ parliament_no: Number(testData.parliament_no) });
    console.log('   Found:', parliament ? `${parliament.name} (No: ${parliament.parliament_no}, ID: ${parliament._id})` : 'NOT FOUND');

    // Check Assembly
    console.log('\n4. ASSEMBLY LOOKUP:');
    const assembly = await Assembly.findOne({ AC_NO: String(testData.AC_NO) });
    console.log('   Found:', assembly ? `${assembly.name} (AC_NO: ${assembly.AC_NO}, ID: ${assembly._id})` : 'NOT FOUND');

    // Check Block
    console.log('\n5. BLOCK LOOKUP:');
    const block = await Block.findOne({ block_no: Number(testData.block_name) });
    console.log('   Found:', block ? `${block.name} (No: ${block.block_no}, ID: ${block._id})` : 'NOT FOUND');

    // Check Booth
    console.log('\n6. BOOTH LOOKUP:');
    const booth1 = await Booth.findOne({ booth_number: String(testData.booth_number) });
    console.log('   String match:', booth1 ? `${booth1.name} (No: ${booth1.booth_number}, ID: ${booth1._id})` : 'NOT FOUND');
    
    const booth2 = await Booth.findOne({ booth_number: Number(testData.booth_number) });
    console.log('   Number match:', booth2 ? `${booth2.name} (No: ${booth2.booth_number}, ID: ${booth2._id})` : 'NOT FOUND');

    // Show sample booths
    console.log('\n7. SAMPLE BOOTHS IN DB:');
    const sampleBooths = await Booth.find().limit(5);
    sampleBooths.forEach(b => {
      console.log(`   - ${b.name} (booth_number: ${b.booth_number}, type: ${typeof b.booth_number})`);
    });

    console.log('\n=== END REPORT ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

diagnose();
