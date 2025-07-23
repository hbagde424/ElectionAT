const StatePolygon = require('../models/statePolygon');
const fs = require('fs');
const path = require('path');

const mpDataPath = path.join(__dirname, '../Data/madhypradesh.json');
const mpGeoJSON = JSON.parse(fs.readFileSync(mpDataPath, 'utf8'));

const mpMapData = {
    "type": "FeatureCollection",
    "name": "MP_Map",
    "crs": {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    },
    "features": mpGeoJSON.features.map(feature => ({
        ...feature,
        properties: {
            Name: "Madhya Pradesh",
            Type: "State"
        }
    }))
};

const insertMPData = async () => {
    try {
        // Check if data already exists
        const existingData = await StatePolygon.findOne({ "name": "MP_Map" });
        if (existingData) {
            console.log('MP Map data already exists in database');
            return;
        }

        // Create new document
        const statePolygon = new StatePolygon(mpMapData);
        await statePolygon.save();
        console.log('MP Map data inserted successfully');
    } catch (error) {
        console.error('Error inserting MP Map data:', error);
        throw error;
    }
};

module.exports = { insertMPData };
