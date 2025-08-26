// A middleware to escape and validate route parameters
const escapeRouteParams = (req, res, next) => {
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            if (req.params[key]) {
                // Replace any potentially problematic characters with their URI encoded versions
                req.params[key] = encodeURIComponent(req.params[key])
                    .replace(/%20/g, '+')
                    .replace(/[^\w\-\+\.~]/g, '');
            }
        });
    }
    next();
};

module.exports = escapeRouteParams;
