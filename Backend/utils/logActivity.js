const ActivityLog = require('../models/ActivityLog');

// Safely clone data for logging (avoid circular refs and big blobs)
const safeClone = (obj) => {
  try {
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (value === undefined) return null;
        if (value && typeof value === 'object' && value._id) return String(value._id);
        return value;
      })
    );
  } catch (e) {
    return null;
  }
};

// Compute shallow diff between two plain objects (for logging field changes)
function diffObjects(before, after, ignore = ['_id', '__v', 'createdAt', 'updatedAt', 'timestamp']) {
  const changes = [];
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  for (const key of keys) {
    if (ignore.includes(key)) continue;
    const fromVal = before ? before[key] : undefined;
    const toVal = after ? after[key] : undefined;
    const from = safeClone(fromVal);
    const to = safeClone(toVal);
    const equal = JSON.stringify(from) === JSON.stringify(to);
    if (!equal) {
      changes.push({ field: key, from, to });
    }
  }
  return changes;
}

function buildRemark(user, details) {
  try {
    const who = [user?.username || user?.name || user?.email || 'Unknown', user?.role ? `(${user.role})` : null].filter(Boolean).join(' ');
    const where = [details.entity, details.entityId ? `#${String(details.entityId)}` : null].filter(Boolean).join(' ');
    let remark = `${who} ${details.action || ''} ${where}`.trim();

    if (details.action === 'UPDATE' && Array.isArray(details.changes) && details.changes.length) {
      const parts = details.changes.map((c) => `${c.field}: ${JSON.stringify(c.from)} -> ${JSON.stringify(c.to)}`);
      remark += `; Changed: ${parts.join(', ')}`;
    }

    if ((details.action === 'DELETE' || details.action === 'CREATE') && details.meta) {
      const keys = Object.keys(details.meta || {});
      if (keys.length) {
        const kv = keys.map((k) => `${k}=${JSON.stringify(details.meta[k])}`).join(', ');
        remark += `; Details: ${kv}`;
      }
    }

    if (!details.action && details.message) {
      remark += `; ${details.message}`;
    }
    return remark;
  } catch (e) {
    return details.message || null;
  }
}

async function logActivity(req, details = {}) {
  try {
    const user = req.user || {};
    const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString();
    const userAgent = req.headers['user-agent'];
    const remark = details.remark || buildRemark(user, details);

    const log = new ActivityLog({
      userId: user._id || null,
      userEmail: user.email || details.userEmail || null,
      userName: user.username || user.name || null,
      role: user.role || null,
      action: details.action,
      entity: details.entity,
      entityId: details.entityId ? String(details.entityId) : undefined,
      endpoint: req.originalUrl,
      method: req.method,
      ip,
      userAgent,
      success: details.success !== false, // default true
      message: details.message,
      remark,
      changes: details.changes || [],
      meta: details.meta || undefined,
    });

    await log.save();
  } catch (err) {
    // Do not block request on logging errors
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to write activity log:', err.message);
    }
  }
}

module.exports = {
  logActivity,
  diffObjects,
};
