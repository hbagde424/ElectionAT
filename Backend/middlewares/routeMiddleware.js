const express = require('express');

// Middleware to handle route parameter validation and sanitization
const routeMiddleware = (req, res, next) => {
    try {
        // Sanitize all route parameters
        if (req.params) {
            Object.keys(req.params).forEach(key => {
                const value = req.params[key];
                if (value && typeof value === 'string') {
                    // Remove any characters that could cause path-to-regexp issues
                    req.params[key] = value.replace(/[^\w\-\.\/]/g, '');
                }
            });
        }

        // Add additional route context for debugging
        req._routeInfo = {
            originalUrl: req.originalUrl,
            path: req.path,
            method: req.method,
            params: req.params
        };

        next();
    } catch (error) {
        next(error);
    }
};

// Create a safe router that includes parameter validation
const createSafeRouter = (options = {}) => {
    const router = express.Router({
        strict: true,
        caseSensitive: true,
        mergeParams: false,
        ...options
    });

    // Add parameter validation to the router
    router.use(routeMiddleware);

    return router;
};

module.exports = {
    routeMiddleware,
    createSafeRouter
};
