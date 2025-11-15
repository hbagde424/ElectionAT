const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// Helper functions for import operations
const toKey = (s) => String(s || '').trim();
const toUpper = (s) => String(s || '').trim().toUpperCase();
const toTitle = (s) => {
  const x = String(s || '').trim().toLowerCase();
  const firstChar = x.charAt(0).toUpperCase();
  return firstChar + x.slice(1);
};

/**
 * Resolve hierarchical entities (State, Division, Parliament, Assembly, Block, Booth)
 * from row data with validation
 */
async function resolveHierarchy(row) {
  const result = {};
  
  // 1. State (required)
  const stateValue = toKey(row.state ?? row.State ?? row.state_name ?? row.State_Name);
  if (!stateValue) {
    throw new Error('State is required; provide state name or id in column "state"');
  }
  
  const isStateObjectId = /^[a-fA-F0-9]{24}$/.test(stateValue);
  result.state = isStateObjectId 
    ? await State.findById(stateValue)
    : await State.findOne({ name: { $regex: `^${stateValue}$`, $options: 'i' } });
  
  if (!result.state) {
    throw new Error(`State not found for state='${stateValue}'`);
  }

  // 2. Division (required)
  const divisionCode = toUpper(row.division_code ?? row.Division_Code ?? row.DIVISION_CODE ?? row.division ?? row.Division);
  if (!divisionCode) {
    throw new Error('Division is required; provide division_code in column "division_code"');
  }

  result.division = await Division.findOne({ division_code: { $regex: `^${divisionCode}$`, $options: 'i' } });
  if (!result.division) {
    // Try by name as fallback
    result.division = await Division.findOne({ name: { $regex: `^${divisionCode}$`, $options: 'i' } });
  }
  if (!result.division) {
    throw new Error(`Division not found for division_code='${divisionCode}'`);
  }

  // Validate division belongs to state
  if (String(result.division.state_id) !== String(result.state._id)) {
    throw new Error(`Division '${divisionCode}' does not belong to state '${stateValue}'`);
  }

  // 3. Parliament (required)
  const parliamentNoRaw = row.parliament_no ?? row.Parliament_No ?? row.PARLIAMENT_NO ?? row.parliament ?? row.Parliament;
  const parliamentNo = parliamentNoRaw !== undefined && parliamentNoRaw !== null && parliamentNoRaw !== '' 
    ? Number(String(parliamentNoRaw).trim()) 
    : NaN;
  
  if (Number.isNaN(parliamentNo)) {
    throw new Error('Parliament number is required; provide parliament_no');
  }

  result.parliament = await Parliament.findOne({ parliament_no: parliamentNo });
  if (!result.parliament) {
    // Try name fallback
    const parlName = toKey(row.parliament ?? row.Parliament ?? row.parliament_name ?? row.Parliament_Name);
    if (parlName) {
      result.parliament = await Parliament.findOne({ name: { $regex: `^${parlName}$`, $options: 'i' } });
    }
  }
  
  if (!result.parliament) {
    throw new Error(`Parliament not found for parliament_no=${parliamentNo}`);
  }

  // Validate parliament belongs to division and state
  if (String(result.parliament.division_id) !== String(result.division._id)) {
    throw new Error(`Parliament ${parliamentNo} does not belong to division '${divisionCode}'`);
  }
  if (String(result.parliament.state_id) !== String(result.state._id)) {
    throw new Error(`Parliament ${parliamentNo} does not belong to state '${stateValue}'`);
  }

  // 4. Assembly (required)
  const assemblyNo = toKey(row.assembly_no ?? row.Assembly_No ?? row.ASSEMBLY_NO ?? row.AC_NO ?? row.ac_no);
  if (!assemblyNo) {
    throw new Error('Assembly number (AC_NO) is required');
  }

  result.assembly = await Assembly.findOne({ AC_NO: assemblyNo });
  if (!result.assembly) {
    // Try by name fallback
    const assemblyName = toKey(row.assembly ?? row.Assembly ?? row.assembly_name ?? row.Assembly_Name);
    if (assemblyName) {
      result.assembly = await Assembly.findOne({ name: { $regex: `^${assemblyName}$`, $options: 'i' } });
    }
  }

  if (!result.assembly) {
    throw new Error(`Assembly not found for AC_NO='${assemblyNo}'`);
  }

  // Validate assembly hierarchy
  if (String(result.assembly.parliament_id) !== String(result.parliament._id)) {
    throw new Error(`Assembly ${assemblyNo} does not belong to parliament ${parliamentNo}`);
  }

  // 5. Block (required)
  const blockNo = toKey(row.block_no ?? row.Block_No ?? row.BLOCK_NO ?? row.block ?? row.Block);
  if (!blockNo) {
    throw new Error('Block number is required');
  }

  result.block = await Block.findOne({ BLOCK_NO: blockNo });
  if (!result.block) {
    // Try by name fallback
    const blockName = toKey(row.block ?? row.Block ?? row.block_name ?? row.Block_Name);
    if (blockName) {
      result.block = await Block.findOne({ name: { $regex: `^${blockName}$`, $options: 'i' } });
    }
  }

  if (!result.block) {
    throw new Error(`Block not found for block_no='${blockNo}'`);
  }

  // Validate block hierarchy
  if (String(result.block.assembly_id) !== String(result.assembly._id)) {
    throw new Error(`Block ${blockNo} does not belong to assembly ${assemblyNo}`);
  }

  // 6. Booth (required)
  const boothNo = toKey(row.booth_no ?? row.Booth_No ?? row.BOOTH_NO ?? row.booth ?? row.Booth);
  if (!boothNo) {
    throw new Error('Booth number is required');
  }

  result.booth = await Booth.findOne({ booth_number: boothNo });
  if (!result.booth) {
    // Try by name fallback
    const boothName = toKey(row.booth ?? row.Booth ?? row.booth_name ?? row.Booth_Name);
    if (boothName) {
      result.booth = await Booth.findOne({ name: { $regex: `^${boothName}$`, $options: 'i' } });
    }
  }

  if (!result.booth) {
    throw new Error(`Booth not found for booth_no='${boothNo}'`);
  }

  // Validate booth hierarchy
  if (String(result.booth.block_id) !== String(result.block._id)) {
    throw new Error(`Booth ${boothNo} does not belong to block ${blockNo}`);
  }

  return result;
}

module.exports = {
  resolveHierarchy,
  toKey,
  toUpper,
  toTitle
};
