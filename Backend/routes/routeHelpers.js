const express = require('express');

// Helper to validate route parameters
const validateParam = (param) => {
    if (!param || typeof param !== 'string') {
        throw new Error('Invalid parameter');
    }
    // Remove any characters that could cause path-to-regexp issues
    return param.replace(/[^a-zA-Z0-9-_]/g, '');
};

// Helper to create a safe route handler
const createSafeHandler = (handler) => {
    return (req, res, next) => {
        try {
            // Validate and sanitize all route parameters
            if (req.params) {
                Object.keys(req.params).forEach(key => {
                    req.params[key] = validateParam(req.params[key]);
                });
            }
            return handler(req, res, next);
        } catch (error) {
            next(error);
        }
    };
};

// Helper to safely register routes
const registerRoute = (router, method, path, ...handlers) => {
    const safeHandlers = handlers.map(handler => createSafeHandler(handler));
    router[method.toLowerCase()](path, ...safeHandlers);
};

module.exports = {
    validateParam,
    createSafeHandler,
    registerRoute
};
