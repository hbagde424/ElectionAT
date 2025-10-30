const mongoose = require('mongoose');

/**
 * Middleware to validate ObjectId-like params.
 * It checks req.params keys that end with 'id' (case-insensitive).
 * - If the param is missing/empty -> responds 400
 * - If the param value looks like a 24-hex ObjectId, validates with mongoose.Types.ObjectId.isValid
 *   and responds 400 if invalid.
 * Otherwise it lets the request pass (covers numeric or custom ids).
 */
module.exports = (req, res, next) => {
  try {
    const params = req.params || {};
    for (const [key, val] of Object.entries(params)) {
      if (!key || typeof key !== 'string') continue;
      if (!key.toLowerCase().endsWith('id')) continue;

      // Missing or empty param should be considered a bad request
      if (val === undefined || val === null || String(val).trim() === '') {
        return res.status(400).json({ success: false, error: `Missing id parameter: ${key}` });
      }

      const s = String(val);
      // If it looks like a Mongo ObjectId (24 hex chars), validate it.
      if (/^[0-9a-fA-F]{24}$/.test(s)) {
        if (!mongoose.Types.ObjectId.isValid(s)) {
          return res.status(400).json({ success: false, error: `Invalid ObjectId for parameter ${key}: ${s}` });
        }
      }
      // Otherwise assume it's a non-ObjectId identifier (e.g., booth number) and allow it.
    }
    return next();
  } catch (err) {
    // Fail-safe: don't block requests due to middleware error
    console.error('validateObjectIdParams error:', err);
    return next();
  }
};
