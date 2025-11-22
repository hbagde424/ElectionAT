const BoothVolunteers = require('../models/boothVolunteers');
const Booth = require('../models/booth');
const Party = require('../models/party');
const State = require('../models/state');
const Division = require('../models/Division');
const Assembly = require('../models/Assembly');
const Parliament = require('../models/Parliament');
const Block = require('../models/block');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// @desc    Get all booth volunteers
// @route   GET /api/booth-volunteers
// @access  Private (Requires authentication via serviceToken)
exports.getBoothVolunteers = async (req, res, next) => {
  try {
    // Log incoming query for debugging filter-related 500 errors
    console.log('getBoothVolunteers called with query:', req.query);
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;

    // Build search filter
    let filter = {};
    // Validate hierarchy if IDs are provided (guard against invalid ObjectId strings)
    const isValidObjectId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
    try {
      if (req.query.booth_id && isValidObjectId(req.query.booth_id)) {
        const booth = await Booth.findById(req.query.booth_id);
        if (!booth) {
          return res.status(404).json({ success: false, error: 'Booth not found' });
        }
        req.query.block_id = booth.block_id;
        req.query.assembly_id = booth.assembly_id;
        req.query.parliament_id = booth.parliament_id;
        req.query.division_id = booth.division_id;
        req.query.state_id = booth.state_id;
      } else if (req.query.block_id && isValidObjectId(req.query.block_id)) {
        const block = await Block.findById(req.query.block_id);
        if (!block) {
          return res.status(404).json({ success: false, error: 'Block not found' });
        }
        req.query.assembly_id = block.assembly_id;
        req.query.parliament_id = block.parliament_id;
        req.query.division_id = block.division_id;
        req.query.state_id = block.state_id;
      } else if (req.query.assembly_id && isValidObjectId(req.query.assembly_id)) {
        const assembly = await Assembly.findById(req.query.assembly_id);
        if (!assembly) {
          return res.status(404).json({ success: false, error: 'Assembly not found' });
        }
        req.query.parliament_id = assembly.parliament_id;
        req.query.division_id = assembly.division_id;
        req.query.state_id = assembly.state_id;
      } else if (req.query.parliament_id && isValidObjectId(req.query.parliament_id)) {
        const parliament = await Parliament.findById(req.query.parliament_id);
        if (!parliament) {
          return res.status(404).json({ success: false, error: 'Parliament not found' });
        }
        req.query.division_id = parliament.division_id;
        req.query.state_id = parliament.state_id;
      } else if (req.query.division_id && isValidObjectId(req.query.division_id)) {
        const division = await Division.findById(req.query.division_id);
        if (!division) {
          return res.status(404).json({ success: false, error: 'Division not found' });
        }
        req.query.state_id = division.state_id;
      }
    } catch (e) {
      // If any lookup throws unexpectedly, log and continue to next steps so we don't return 500
      console.error('Hierarchy validation error (non-fatal):', e);
    }

    // Search functionality (robust, all string fields and referenced fields)
    if (req.query.search) {
      const search = req.query.search;
      const mongoose = require('mongoose');
      const [boothIds, partyIds, stateIds, divisionIds, assemblyIds, parliamentIds, blockIds, userIds] = await Promise.all([
        Booth.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { booth_number: { $regex: search, $options: 'i' } }
          ]
        }, '_id').then(docs => docs.map(d => d._id)),
        Party.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => d._id)),
        State.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => d._id)),
        Division.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => d._id)),
        Assembly.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => d._id)),
        Parliament.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => d._id)),
        Block.find({ name: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => d._id)),
        User.find({ username: { $regex: search, $options: 'i' } }, '_id').then(docs => docs.map(d => d._id))
      ]);
      const orArr = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { area_responsibility: { $regex: search, $options: 'i' } },
        { post: { $regex: search, $options: 'i' } },
        { activity_level: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } }
      ];
      if (boothIds.length) orArr.push({ booth_id: { $in: boothIds } });
      if (partyIds.length) orArr.push({ party_id: { $in: partyIds } });
      if (stateIds.length) orArr.push({ state_id: { $in: stateIds } });
      if (divisionIds.length) orArr.push({ division_id: { $in: divisionIds } });
      if (assemblyIds.length) orArr.push({ assembly_id: { $in: assemblyIds } });
      if (parliamentIds.length) orArr.push({ parliament_id: { $in: parliamentIds } });
      if (blockIds.length) orArr.push({ block_id: { $in: blockIds } });
      if (userIds.length) orArr.push({ created_by: { $in: userIds } });
      filter.$or = orArr;
    }


    // Helper function for ObjectId or name lookup (normalize dashes to spaces)
    const handleIdOrName = async (param, model, nameField = 'name') => {
      if (!req.query[param]) return null;
      let value = req.query[param];
      // Coerce non-string values (ObjectId, numbers) to string to safely call replace()/regex tests
      if (typeof value !== 'string') {
        try {
          value = value.toString();
        } catch (e) {
          // Fallback: serialize JSON
          value = JSON.stringify(value);
        }
      }
      value = value.replace(/-/g, ' ');
      const isObjectId = /^[a-f\d]{24}$/i.test(value);
      if (isObjectId) {
        return value;
      } else {
        const doc = await model.findOne({ [nameField]: { $regex: value, $options: 'i' } });
        return doc ? doc._id : null;
      }
    };

    // Add filters (support both ObjectId and name for all params)
    if (req.query.booth_id || req.query.booth) {
      const boothId = await handleIdOrName('booth_id', Booth) || await handleIdOrName('booth', Booth);
      if (boothId) filter.booth_id = boothId;
      else if (req.query.booth_id || req.query.booth) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.party_id || req.query.party) {
      const partyId = await handleIdOrName('party_id', Party) || await handleIdOrName('party', Party);
      if (partyId) filter.party_id = partyId;
      else if (req.query.party_id || req.query.party) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.state_id || req.query.state) {
      const stateId = await handleIdOrName('state_id', State) || await handleIdOrName('state', State);
      if (stateId) filter.state_id = stateId;
      else if (req.query.state_id || req.query.state) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.division_id || req.query.division) {
      const divisionId = await handleIdOrName('division_id', Division) || await handleIdOrName('division', Division);
      if (divisionId) filter.division_id = divisionId;
      else if (req.query.division_id || req.query.division) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.assembly_id || req.query.assembly) {
      const assemblyId = await handleIdOrName('assembly_id', Assembly) || await handleIdOrName('assembly', Assembly);
      if (assemblyId) filter.assembly_id = assemblyId;
      else if (req.query.assembly_id || req.query.assembly) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.parliament_id || req.query.parliament) {
      const parliamentId = await handleIdOrName('parliament_id', Parliament) || await handleIdOrName('parliament', Parliament);
      if (parliamentId) filter.parliament_id = parliamentId;
      else if (req.query.parliament_id || req.query.parliament) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.block_id || req.query.block) {
      const blockId = await handleIdOrName('block_id', Block) || await handleIdOrName('block', Block);
      if (blockId) filter.block_id = blockId;
      else if (req.query.block_id || req.query.block) return res.status(200).json({ success: true, count: 0, total: 0, page, pages: 0, data: [] });
    }
    if (req.query.activity) {
      filter.activity_level = req.query.activity;
    }

    // If userHierarchy exists, restrict by user's scope (most specific first) unless superAdmin
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      if (req.userHierarchy.booth) {
        filter.booth_id = req.userHierarchy.booth._id;
      } else if (req.userHierarchy.block) {
        filter.block_id = req.userHierarchy.block._id;
      } else if (req.userHierarchy.assembly) {
        filter.assembly_id = req.userHierarchy.assembly._id;
      } else if (req.userHierarchy.parliament) {
        filter.parliament_id = req.userHierarchy.parliament._id;
      } else if (req.userHierarchy.division) {
        filter.division_id = req.userHierarchy.division._id;
      } else if (req.userHierarchy.state) {
        filter.state_id = req.userHierarchy.state._id;
      }
    }

    // If searching, ignore pagination and return all results
    let volunteers, total;
    if (req.query.search) {
      volunteers = await BoothVolunteers.find(filter)
        .populate('booth', 'name booth_number')
        .populate('party', 'name symbol')
        .populate('state', 'name')
        .populate('division', 'name')
        .populate('assembly', 'name')
        .populate('parliament', 'name')
        .populate('block', 'name')
        .populate('created_by', 'username')
        .populate('updated_by', 'username')
        .sort({ name: 1 })
        .exec();
      total = volunteers.length;
    } else {
      volunteers = await BoothVolunteers.find(filter)
        .populate('booth', 'name booth_number')
        .populate('party', 'name symbol')
        .populate('state', 'name')
        .populate('division', 'name')
        .populate('assembly', 'name')
        .populate('parliament', 'name')
        .populate('block', 'name')
        .populate('created_by', 'username')
        .populate('updated_by', 'username')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec();
      total = await BoothVolunteers.countDocuments(filter);
    }

    res.status(200).json({
      success: true,
      count: volunteers.length,
      total,
      page,
      pages: limit ? Math.ceil(total / limit) : 1,
      data: volunteers
    });
  } catch (err) {
    // Log query + stack to make debugging easier when frontend sees 500
    console.error('Error in getBoothVolunteers - query:', req.query);
    console.error(err && err.stack ? err.stack : err);
    next(err);
  }
};

// @desc    Get single booth volunteer
// @route   GET /api/booth-volunteers/:id
// @access  Private (Requires authentication via serviceToken)
exports.getBoothVolunteer = async (req, res, next) => {
  try {
    const volunteer = await BoothVolunteers.findById(req.params.id)
      .populate('booth', 'name booth_number')
      .populate('party', 'name symbol')
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('assembly', 'name')
      .populate('parliament', 'name')
      .populate('block', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Booth volunteer not found'
      });
    }

    // Enforce user hierarchy for single resource
    if (req.userHierarchy && req.user && req.user.role !== 'superAdmin') {
      const uh = req.userHierarchy;
      const outside = (
        (uh.booth && volunteer.booth_id.toString() !== uh.booth._id.toString()) ||
        (uh.block && volunteer.block_id.toString() !== uh.block._id.toString()) ||
        (uh.assembly && volunteer.assembly_id.toString() !== uh.assembly._id.toString()) ||
        (uh.parliament && volunteer.parliament_id.toString() !== uh.parliament._id.toString()) ||
        (uh.division && volunteer.division_id.toString() !== uh.division._id.toString()) ||
        (uh.state && volunteer.state_id.toString() !== uh.state._id.toString())
      );
      if (outside) {
        return res.status(403).json({ success: false, message: 'Access denied: geographic restriction' });
      }
    }

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create booth volunteer
// @route   POST /api/booth-volunteers
// @access  Private (Admin/Coordinator)
exports.createBoothVolunteer = async (req, res, next) => {
  try {
    // Verify all references exist
    const [
      booth,
      party,
      state,
      division,
      assembly,
      parliament,
      block
    ] = await Promise.all([
      Booth.findById(req.body.booth_id),
      Party.findById(req.body.party_id),
      State.findById(req.body.state_id),
      Division.findById(req.body.division_id),
      Assembly.findById(req.body.assembly_id),
      Parliament.findById(req.body.parliament_id),
      Block.findById(req.body.block_id)
    ]);

    if (!booth) {
      return res.status(400).json({ success: false, message: 'Booth not found' });
    }
    if (!party) {
      return res.status(400).json({ success: false, message: 'Party not found' });
    }
    if (!state) {
      return res.status(400).json({ success: false, message: 'State not found' });
    }
    if (!division) {
      return res.status(400).json({ success: false, message: 'Division not found' });
    }
    if (!assembly) {
      return res.status(400).json({ success: false, message: 'Assembly not found' });
    }
    if (!parliament) {
      return res.status(400).json({ success: false, message: 'Parliament not found' });
    }
    if (!block) {
      return res.status(400).json({ success: false, message: 'Block not found' });
    }

    // Check if user exists in request
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized - user not identified'
      });
    }

    const volunteerData = {
      ...req.body,
      created_by: req.user.id
    };

    // Handle document uploads if files are present
    if (req.files && req.files.length > 0) {
      volunteerData.documents = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
    }

    const volunteer = await BoothVolunteers.create(volunteerData);

    res.status(201).json({
      success: true,
      data: volunteer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer with this phone number already exists for this booth'
      });
    }
    next(err);
  }
};

// @desc    Update booth volunteer
// @route   PUT /api/booth-volunteers/:id
// @access  Private (Admin/Coordinator)
exports.updateBoothVolunteer = async (req, res, next) => {
  try {
    let volunteer = await BoothVolunteers.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Booth volunteer not found'
      });
    }

    // Verify all references exist if being updated
    const verificationPromises = [];
    if (req.body.booth_id) verificationPromises.push(Booth.findById(req.body.booth_id));
    if (req.body.party_id) verificationPromises.push(Party.findById(req.body.party_id));
    if (req.body.state_id) verificationPromises.push(State.findById(req.body.state_id));
    if (req.body.division_id) verificationPromises.push(Division.findById(req.body.division_id));
    if (req.body.assembly_id) verificationPromises.push(Assembly.findById(req.body.assembly_id));
    if (req.body.parliament_id) verificationPromises.push(Parliament.findById(req.body.parliament_id));
    if (req.body.block_id) verificationPromises.push(Block.findById(req.body.block_id));

    const verificationResults = await Promise.all(verificationPromises);

    for (const result of verificationResults) {
      if (!result) {
        return res.status(400).json({
          success: false,
          message: 'Invalid reference ID provided'
        });
      }
    }

    // Add updated_by info
    req.body.updated_by = req.user.id;
    req.body.updated_at = new Date();

    // Handle document uploads if files are present
    if (req.files && req.files.length > 0) {
      const newDocuments = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
      
      req.body.documents = volunteer.documents ? [...volunteer.documents, ...newDocuments] : newDocuments;
    }

    volunteer = await BoothVolunteers.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('booth', 'name booth_number')
      .populate('party', 'name symbol')
      .populate('state', 'name')
      .populate('division', 'name')
      .populate('assembly', 'name')
      .populate('parliament', 'name')
      .populate('block', 'name')
      .populate('created_by', 'username')
      .populate('updated_by', 'username');

    res.status(200).json({
      success: true,
      data: volunteer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer with this phone number already exists for this booth'
      });
    }
    next(err);
  }
};

// @desc    Delete booth volunteer
// @route   DELETE /api/booth-volunteers/:id
// @access  Private (Admin only)
exports.deleteBoothVolunteer = async (req, res, next) => {
  try {
    const volunteer = await BoothVolunteers.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Booth volunteer not found'
      });
    }

    // Delete associated documents from filesystem
    if (volunteer.documents && volunteer.documents.length > 0) {
      volunteer.documents.forEach(doc => {
        if (doc.path && fs.existsSync(doc.path)) {
          fs.unlinkSync(doc.path);
        }
      });
    }

    await volunteer.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete single document from volunteer
// @route   DELETE /api/booth-volunteers/:id/documents/:documentId
// @access  Private (Admin/Coordinator)
exports.deleteVolunteerDocument = async (req, res, next) => {
  try {
    const volunteer = await BoothVolunteers.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: 'Booth volunteer not found'
      });
    }

    const documentIndex = volunteer.documents.findIndex(
      doc => doc._id.toString() === req.params.documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    const document = volunteer.documents[documentIndex];

    // Delete file from filesystem
    if (document.path && fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
    }

    // Remove document from array
    volunteer.documents.splice(documentIndex, 1);
    volunteer.updated_by = req.user.id;
    volunteer.updated_at = new Date();

    await volunteer.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by booth
// @route   GET /api/booth-volunteers/booth/:boothId
// @access  Private (Requires authentication via serviceToken)
exports.getVolunteersByBooth = async (req, res, next) => {
  try {
    // Verify booth exists
    const booth = await Booth.findById(req.params.boothId);
    if (!booth) {
      return res.status(404).json({
        success: false,
        message: 'Booth not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ booth_id: req.params.boothId })
      .sort({ name: 1 })
      .populate('party', 'name symbol')
      .populate('created_by', 'username');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by party
// @route   GET /api/booth-volunteers/party/:partyId
// @access  Private (Requires authentication via serviceToken)
exports.getVolunteersByParty = async (req, res, next) => {
  try {
    // Verify party exists
    const party = await Party.findById(req.params.partyId);
    if (!party) {
      return res.status(404).json({
        success: false,
        message: 'Party not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ party_id: req.params.partyId })
      .sort({ name: 1 })
      .populate('booth', 'name booth_number')
      .populate('state', 'name');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get volunteers by state
// @route   GET /api/booth-volunteers/state/:stateId
// @access  Private (Requires authentication via serviceToken)
exports.getVolunteersByState = async (req, res, next) => {
  try {
    // Verify state exists
    const state = await State.findById(req.params.stateId);
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'State not found'
      });
    }

    const volunteers = await BoothVolunteers.find({ state_id: req.params.stateId })
      .sort({ name: 1 })
      .populate('booth', 'name booth_number')
      .populate('party', 'name symbol');

    res.status(200).json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Import booth volunteers from Excel
// @route   POST /api/booth-volunteers/import
// @access  Private/Admin
exports.importBoothVolunteers = async (req, res, next) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No data provided. Expected array of rows.'
      });
    }

    const { resolveGeographicHierarchy, validateHierarchy } = require('./importHelpers');

    const results = { imported: 0, total: rows.length, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Resolve geographic hierarchy
        const geo = await resolveGeographicHierarchy(row);

        // Validate required hierarchy fields
        const hierarchyErrors = validateHierarchy(geo, ['state', 'division', 'parliament', 'assembly', 'block', 'booth']);
        if (hierarchyErrors.length > 0) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: hierarchyErrors.join(', ')
          });
          continue;
        }

        // Check for required fields
        if (!row.name || !row.contact) {
          results.errors.push({
            row: i + 1,
            data: row,
            error: 'name and contact are required'
          });
          continue;
        }

        // Resolve party if provided
        let partyId = null;
        if (row.party) {
          const party = await Party.findOne({ name: { $regex: new RegExp(`^${row.party}$`, 'i') } });
          if (party) {
            partyId = party._id;
          }
        }

        // Create booth volunteer entry
        const volunteerData = {
          name: row.name,
          contact: row.contact,
          booth: geo.booth._id,
          state_id: geo.state._id,
          division_id: geo.division._id,
          parliament_id: geo.parliament._id,
          assembly_id: geo.assembly._id,
          block_id: geo.block._id,
          role: row.role || 'volunteer',
          created_by: req.user._id
        };

        if (partyId) volunteerData.party = partyId;
        if (row.email) volunteerData.email = row.email;
        if (row.address) volunteerData.address = row.address;

        await BoothVolunteers.create(volunteerData);
        results.imported++;

      } catch (err) {
        results.errors.push({
          row: i + 1,
          data: row,
          error: err.message || 'Failed to import booth volunteer'
        });
      }
    }

    res.status(200).json({
      success: true,
      imported: results.imported,
      total: results.total,
      errors: results.errors
    });

  } catch (err) {
    next(err);
  }
};