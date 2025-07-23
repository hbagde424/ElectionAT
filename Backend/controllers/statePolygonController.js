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
    seedStatePolygons
};
