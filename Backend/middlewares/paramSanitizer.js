// Parameter sanitization middleware
const sanitizeParam = (value) => {
    if (typeof value !== 'string') return '';
    // Remove any potentially problematic characters
    return value.replace(/[^\w\-\s]/g, '');
};

// Create a wrapper for route handlers that ensures safe parameter handling
const createSafeHandler = (handler) => {
    return (req, res, next) => {
        try {
            // Sanitize route parameters
            if (req.params) {
                Object.keys(req.params).forEach(key => {
                    req.params[key] = sanitizeParam(req.params[key]);
                });
            }
            return handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    sanitizeParam,
    createSafeHandler
};
