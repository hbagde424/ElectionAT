const mongoose = require('mongoose');
require('./config/db');
const Booth = require('./models/booth');

async function inspectBooths() {
  try {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('=== INSPECTING BOOTH 156 ===');
    
    // Get the booth that shows in available sample
    const boothSample = await Booth.findOne({ name: 'पिपरी' });
    if (boothSample) {
      console.log('Found booth sample:', {
        _id: boothSample._id,
        name: boothSample.name,
        booth_number: boothSample.booth_number,
        booth_number_type: typeof boothSample.booth_number,
        booth_number_length: boothSample.booth_number.length,
        booth_number_raw: JSON.stringify(boothSample.booth_number)
      });
      
      // Test exact match
      const exactMatch = await Booth.findOne({ booth_number: '156' });
      console.log('Exact match result:', exactMatch ? 'FOUND' : 'NOT FOUND');
      
      // Test with parseInt
      const numericMatch = await Booth.findOne({ booth_number: 156 });
      console.log('Numeric match result:', numericMatch ? 'FOUND' : 'NOT FOUND');
      
      // Test with string coercion
      const stringMatch = await Booth.findOne({ booth_number: String(156) });
      console.log('String match result:', stringMatch ? 'FOUND' : 'NOT FOUND');
      
    } else {
      console.log('Could not find booth sample');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

inspectBooths();