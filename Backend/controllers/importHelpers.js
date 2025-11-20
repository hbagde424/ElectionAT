// Shared import helpers for all import endpoints

const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');

// Normalize functions
const toKey = (s) => String(s || '').trim();
const toUpper = (s) => String(s || '').trim().toUpperCase();
const toLower = (s) => String(s || '').trim().toLowerCase();

// Resolve geographic hierarchy from codes/names
async function resolveGeographicHierarchy(row) {
  const result = {
    state: null,
    division: null,
    parliament: null,
    assembly: null,
    block: null,
    booth: null
  };

  // State (name or ID or state_no)
  const stateValue = toKey(row.state ?? row.State ?? row.state_name ?? row.state_no);
  if (stateValue) {
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(stateValue);
    if (isObjectId) {
      result.state = await State.findById(stateValue);
    }
    if (!result.state && !isNaN(Number(stateValue))) {
      result.state = await State.findOne({ state_no: Number(stateValue) });
    }
    if (!result.state) {
      result.state = await State.findOne({ name: { $regex: `^${stateValue}$`, $options: 'i' } });
    }
  }

  // Division (code or name)
  const divisionValue = toUpper(row.division_code ?? row.division);
  if (divisionValue) {
    result.division = await Division.findOne({ division_code: { $regex: `^${divisionValue}$`, $options: 'i' } });
    if (!result.division) {
      result.division = await Division.findOne({ name: { $regex: `^${divisionValue}$`, $options: 'i' } });
    }
  }

  // Parliament (number or name)
  const parliamentValue = row.parliament_no ?? row.parliament;
  if (parliamentValue !== undefined && parliamentValue !== null && parliamentValue !== '') {
    const pn = Number(String(parliamentValue).trim());
    if (!isNaN(pn)) {
      result.parliament = await Parliament.findOne({ parliament_no: pn });
    }
    if (!result.parliament) {
      result.parliament = await Parliament.findOne({ name: { $regex: `^${parliamentValue}$`, $options: 'i' } });
    }
  }

  // Assembly (AC_NO or common variants or name)
  const assemblyValue = row.assembly_no ?? row.AC_NO ?? row.AC_No ?? row.ACNo ?? row.ac_no ?? row.acno ?? row.assembly;
  if (assemblyValue !== undefined && assemblyValue !== null && assemblyValue !== '') {
    // Try to find by AC_NO (stored often as string or number)
    result.assembly = await Assembly.findOne({ AC_NO: String(assemblyValue).trim() });
    if (!result.assembly) {
      // Try numeric match as well
      const pn = Number(String(assemblyValue).trim());
      if (!isNaN(pn)) {
        result.assembly = await Assembly.findOne({ AC_NO: String(pn) });
      }
    }
    if (!result.assembly) {
      result.assembly = await Assembly.findOne({ name: { $regex: `^${assemblyValue}$`, $options: 'i' } });
    }
  }

  // Block (support numeric block_no variants, name or ID)
  const blockValueRaw = row.block_no ?? row.blockNo ?? row.blocknumber ?? row.block_number ?? row.blockNumber ?? row.block ?? row.block_name;
  const blockValue = toKey(blockValueRaw);
  if (blockValue) {
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(blockValue);
    if (isObjectId) {
      result.block = await Block.findById(blockValue);
    }
    // If numeric, try matching block_no field
    if (!result.block && !isNaN(Number(blockValue))) {
      result.block = await Block.findOne({ block_no: Number(blockValue) });
    }
    if (!result.block) {
      result.block = await Block.findOne({ name: { $regex: `^${blockValue}$`, $options: 'i' } });
    }
  }

  // Booth (number or name)
  const boothValue = row.booth_number ?? row.booth;
  if (boothValue !== undefined && boothValue !== null && boothValue !== '') {
    result.booth = await Booth.findOne({ booth_number: String(boothValue).trim() });
    if (!result.booth) {
      result.booth = await Booth.findOne({ name: { $regex: `^${boothValue}$`, $options: 'i' } });
    }
  }

  return result;
}

// Validate required hierarchy
function validateHierarchy(geo, required = []) {
  const errors = [];
  for (const field of required) {
    if (!geo[field]) {
      errors.push(`${field} not found`);
    }
  }
  return errors;
}

module.exports = {
  toKey,
  toUpper,
  toLower,
  resolveGeographicHierarchy,
  validateHierarchy
};
