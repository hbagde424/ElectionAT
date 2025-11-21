// Shared import helpers for all import endpoints

const State = require('../models/state');
const Division = require('../models/Division');
const Parliament = require('../models/Parliament');
const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const Panchayat = require('../models/Panchayat');
const Village = require('../models/Village');
const Falliya = require('../models/Falliya');

// Normalize functions
const toKey = (s) => String(s || '').trim();
const toUpper = (s) => String(s || '').trim().toUpperCase();
const toLower = (s) => String(s || '').trim().toLowerCase();
const toNumber = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).trim());
  return isNaN(n) ? null : n;
};

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

  // Panchayat (name or id) - prefer matching within block if available
  const panchayatValue = toKey(row.panchayat_name ?? row.panchayat ?? row.panchayatName ?? row.panchayat_name);
  if (panchayatValue) {
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(panchayatValue);
    if (isObjectId) {
      result.panchayat = await Panchayat.findById(panchayatValue);
    }
    if (!result.panchayat) {
      const regex = { $regex: `^${panchayatValue}$`, $options: 'i' };
      if (result.block && result.block._id) {
        result.panchayat = await Panchayat.findOne({ panchayat_name: regex, block_id: result.block._id });
      }
      if (!result.panchayat) {
        result.panchayat = await Panchayat.findOne({ panchayat_name: regex });
      }
    }
  }

  // Village (name or id) - prefer within panchayat when possible
  const villageValue = toKey(row.village_name ?? row.village ?? row.villageName);
  if (villageValue) {
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(villageValue);
    if (isObjectId) {
      result.village = await Village.findById(villageValue);
    }
    if (!result.village) {
      const regex = { $regex: `^${villageValue}$`, $options: 'i' };
      if (result.panchayat && result.panchayat._id) {
        result.village = await Village.findOne({ village_name: regex, panchayat_id: result.panchayat._id });
      }
      if (!result.village) {
        result.village = await Village.findOne({ village_name: regex });
      }
    }
  }

  // Falliya (name or id) - prefer within village when possible
  const falliyaValue = toKey(row.falliya_name ?? row.falliya ?? row.falliyaName);
  if (falliyaValue) {
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(falliyaValue);
    if (isObjectId) {
      result.falliya = await Falliya.findById(falliyaValue);
    }
    if (!result.falliya) {
      const regex = { $regex: `^${falliyaValue}$`, $options: 'i' };
      if (result.village && result.village._id) {
        result.falliya = await Falliya.findOne({ falliya_name: regex, village_id: result.village._id });
      }
      if (!result.falliya) {
        result.falliya = await Falliya.findOne({ falliya_name: regex });
      }
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
  toNumber,
  resolveGeographicHierarchy,
  validateHierarchy
};
