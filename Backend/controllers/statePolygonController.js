const StatePolygon = require('../models/statePolygon');

// Get all state polygons
const getStatePolygons = async (req, res) => {
    try {
        const statePolygons = await StatePolygon.find();
        res.status(200).json({
            success: true,
            count: statePolygons.length,
            msg: 'State polygons retrieved successfully',
            data: statePolygons
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Get single state polygon by state code
const getStatePolygonByCode = async (req, res) => {
    try {
        const statePolygon = await StatePolygon.findOne({
            'features.properties.Name': req.params.stateCode
        });

        if (!statePolygon) {
            return res.status(404).json({
                success: false,
                error: 'State polygon not found'
            });
        }

        res.status(200).json({
            success: true,
            data: statePolygon
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
};

// Create new state polygon
const createStatePolygon = async (req, res) => {
    try {
        const { type, name, crs, features } = req.body;

        // Validate required fields
        if (!type || !name || !features) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: type, name, features'
            });
        }

        // Validate type is FeatureCollection
        if (type !== 'FeatureCollection') {
            return res.status(400).json({
                success: false,
                error: 'Type must be "FeatureCollection"'
            });
        }

        // Validate features is an array
        if (!Array.isArray(features) || features.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Features must be a non-empty array'
            });
        }

        // Create new state polygon document
        const newStatePolygon = new StatePolygon({
            type,
            name,
            crs: crs || {
                type: 'name',
                properties: {
                    name: 'EPSG:4326'
                }
            },
            features
        });

        const savedPolygon = await newStatePolygon.save();

        res.status(201).json({
            success: true,
            msg: 'State polygon created successfully',
            data: savedPolygon
        });
    } catch (error) {
        console.error('Error creating state polygon:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error creating state polygon'
        });
    }
};

// Seed state polygon data
const seedStatePolygons = async (req, res) => {
    try {
        const { insertMPData } = require('../utils/mpDataInsertion');
        await insertMPData();

        res.status(200).json({
            success: true,
            msg: 'State polygon data seeded successfully'
        });
    } catch (error) {
        console.error('Error seeding state polygon data:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error seeding state polygon data'
        });
    }
};

module.exports = {
    getStatePolygons,
    getStatePolygonByCode,
    createStatePolygon,
    seedStatePolygons
};
