const { logActivity } = require('../utils/logActivity');

// Middleware to detect downloads (responses with Content-Disposition: attachment)
// Usage: place this before route handlers that may send file downloads.
module.exports = function downloadLogger(entityResolver) {
  // entityResolver: (req) => ({ entity, entityId, filename, meta })
  return (req, res, next) => {
    const originalSetHeader = res.setHeader.bind(res);
    let isAttachment = false;
    let filename = null;

    res.setHeader = (name, value) => {
      if (name && typeof name === 'string' && name.toLowerCase() === 'content-disposition') {
        isAttachment = /attachment/i.test(String(value));
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(String(value));
        filename = decodeURIComponent((match && (match[1] || match[2])) || '');
      }
      return originalSetHeader(name, value);
    };

    res.on('finish', async () => {
      if (isAttachment) {
        const base = typeof entityResolver === 'function' ? entityResolver(req) || {} : {};
        await logActivity(req, {
          action: 'DOWNLOAD',
          entity: base.entity,
          entityId: base.entityId,
          meta: { filename: base.filename || filename, ...(base.meta || {}) },
          success: res.statusCode >= 200 && res.statusCode < 400,
        });
      }
    });

    next();
  };
};
