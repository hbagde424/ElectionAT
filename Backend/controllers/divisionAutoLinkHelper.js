/**
 * Helper functions to automatically link related data to divisions
 * When a division is created or updated, this finds and links all related records
 */

const Assembly = require('../models/Assembly');
const Block = require('../models/block');
const Booth = require('../models/booth');
const Parliament = require('../models/Parliament');
const District = require('../models/District');
const BLO = require('../models/BLO');
const BLA = require('../models/BLA');

/**
 * Auto-link related data to a division
 * Searches for records that should belong to this division and updates their division_id
 * @param {ObjectId} divisionId - The division ID to link data to
 * @param {String} divisionName - The division name (for searching)
 * @returns {Object} Summary of linked records
 */
async function autoLinkDivisionData(divisionId, divisionName) {
  try {
    const summary = {
      parliaments: 0,
      assemblies: 0,
      blocks: 0,
      booths: 0,
      districts: 0,
      blos: 0,
      blas: 0
    };

    if (!divisionId || !divisionName) {
      return summary;
    }

    // Create regex for case-insensitive search
    const nameRegex = { $regex: divisionName, $options: 'i' };

    // 1. Link Parliaments by name
    const parliamentResult = await Parliament.updateMany(
      { name: nameRegex, division_id: { $ne: divisionId } },
      { division_id: divisionId }
    );
    summary.parliaments = parliamentResult.modifiedCount;

    // 2. Link Assemblies by name
    const assemblyResult = await Assembly.updateMany(
      { name: nameRegex, division_id: { $ne: divisionId } },
      { division_id: divisionId }
    );
    summary.assemblies = assemblyResult.modifiedCount;

    // 3. Link Blocks by name
    const blockResult = await Block.updateMany(
      { name: nameRegex, division_id: { $ne: divisionId } },
      { division_id: divisionId }
    );
    summary.blocks = blockResult.modifiedCount;

    // 4. Link Booths by name
    const boothResult = await Booth.updateMany(
      { name: nameRegex, division_id: { $ne: divisionId } },
      { division_id: divisionId }
    );
    summary.booths = boothResult.modifiedCount;

    // 5. Link Districts by name
    const districtResult = await District.updateMany(
      { name: nameRegex, division_id: { $ne: divisionId } },
      { division_id: divisionId }
    );
    summary.districts = districtResult.modifiedCount;

    // 6. Link BLOs by name
    const bloResult = await BLO.updateMany(
      { name: nameRegex, division_id: { $ne: divisionId } },
      { division_id: divisionId }
    );
    summary.blos = bloResult.modifiedCount;

    // 7. Link BLAs by name
    const blaResult = await BLA.updateMany(
      { name: nameRegex, division_id: { $ne: divisionId } },
      { division_id: divisionId }
    );
    summary.blas = blaResult.modifiedCount;

    console.log(`[AUTO-LINK] Division "${divisionName}" linked:`, summary);
    return summary;
  } catch (err) {
    console.error('[AUTO-LINK] Error linking division data:', err.message);
    return {
      parliaments: 0,
      assemblies: 0,
      blocks: 0,
      booths: 0,
      districts: 0,
      blos: 0,
      blas: 0,
      error: err.message
    };
  }
}

/**
 * Auto-link data by hierarchy
 * Links records based on parent-child relationships
 * @param {ObjectId} divisionId - The division ID
 * @returns {Object} Summary of linked records
 */
async function autoLinkByHierarchy(divisionId) {
  try {
    const summary = {
      assemblies: 0,
      blocks: 0,
      booths: 0,
      blos: 0,
      blas: 0
    };

    if (!divisionId) {
      return summary;
    }

    // 1. Find all parliaments for this division
    const parliaments = await Parliament.find({ division_id: divisionId }).select('_id');
    const parliamentIds = parliaments.map(p => p._id);

    if (parliamentIds.length > 0) {
      // Link assemblies to this division if they belong to parliaments in this division
      const assemblyResult = await Assembly.updateMany(
        { parliament_id: { $in: parliamentIds }, division_id: { $ne: divisionId } },
        { division_id: divisionId }
      );
      summary.assemblies = assemblyResult.modifiedCount;

      // Link BLOs to this division if they belong to parliaments in this division
      const bloResult = await BLO.updateMany(
        { parliament_id: { $in: parliamentIds }, division_id: { $ne: divisionId } },
        { division_id: divisionId }
      );
      summary.blos = bloResult.modifiedCount;
    }

    // 2. Find all blocks for this division
    const blocks = await Block.find({ division_id: divisionId }).select('_id');
    const blockIds = blocks.map(b => b._id);

    if (blockIds.length > 0) {
      // Link booths to this division if they belong to blocks in this division
      const boothResult = await Booth.updateMany(
        { block_id: { $in: blockIds }, division_id: { $ne: divisionId } },
        { division_id: divisionId }
      );
      summary.booths = boothResult.modifiedCount;
    }

    // 3. Find all assemblies for this division
    const assemblies = await Assembly.find({ division_id: divisionId }).select('_id');
    const assemblyIds = assemblies.map(a => a._id);

    if (assemblyIds.length > 0) {
      // Link BLAs to this division if they belong to assemblies in this division
      const blaResult = await BLA.updateMany(
        { assembly_id: { $in: assemblyIds }, division_id: { $ne: divisionId } },
        { division_id: divisionId }
      );
      summary.blas = blaResult.modifiedCount;
    }

    console.log(`[AUTO-LINK-HIERARCHY] Division linked by hierarchy:`, summary);
    return summary;
  } catch (err) {
    console.error('[AUTO-LINK-HIERARCHY] Error linking by hierarchy:', err.message);
    return {
      assemblies: 0,
      blocks: 0,
      booths: 0,
      blos: 0,
      blas: 0,
      error: err.message
    };
  }
}

module.exports = {
  autoLinkDivisionData,
  autoLinkByHierarchy
};
