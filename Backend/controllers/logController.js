const ActivityLog = require('../models/ActivityLog');

// GET /api/logs
// Query params: page, limit, userId, email, role, action, entity, success, from, to, search
exports.getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.email) filter.userEmail = new RegExp(req.query.email, 'i');
    if (req.query.role) filter.role = req.query.role;
    if (req.query.action) filter.action = req.query.action;
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.success !== undefined) filter.success = req.query.success === 'true';

    // Date range
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to);
    }

    // Free text search across message and endpoint
    if (req.query.search) {
      filter.$or = [
        { message: new RegExp(req.query.search, 'i') },
        { endpoint: new RegExp(req.query.search, 'i') },
        { userEmail: new RegExp(req.query.search, 'i') },
      ];
    }

    const [items, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      page,
      pages: Math.ceil(total / limit),
      total,
      count: items.length,
      data: items,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/logs/meta - simple distinct lists to power filters
exports.getLogMeta = async (req, res, next) => {
  try {
    const [actions, entities, roles, emails] = await Promise.all([
      ActivityLog.distinct('action'),
      ActivityLog.distinct('entity'),
      ActivityLog.distinct('role'),
      ActivityLog.distinct('userEmail'),
    ]);
    res.json({ success: true, actions, entities, roles, emails });
  } catch (err) {
    next(err);
  }
};

// GET /api/logs/:id - single log by id
exports.getLogById = async (req, res, next) => {
  try {
    const log = await ActivityLog.findById(req.params.id).lean();
    if (!log) return res.status(404).json({ success: false, message: 'Log not found' });
    res.json({ success: true, data: log });
  } catch (err) {
    next(err);
  }
};
