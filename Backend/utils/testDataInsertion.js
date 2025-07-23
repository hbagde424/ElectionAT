const StatePolygon = require('../models/statePolygon');

const insertTestStatePolygon = async () => {
    try {
        // Check if data already exists
        const existing = await StatePolygon.findOne({
            'features.properties.Name': 'Madhya Pradesh'
        });

        if (existing) {
            console.log('Test data already exists');
            return;
        }

        const testData = {
            type: 'FeatureCollection',
            name: 'MP_Map',
            crs: {
                type: 'name',
                properties: {
                    name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
                }
            },
            features: [
                {
                    type: 'Feature',
                    properties: {
                        Name: 'Madhya Pradesh',
                        Type: 'State'
                    },
                    geometry: {
                        type: 'MultiPolygon',
                        coordinates: [
                            [
                                [
                                    [78.372109, 26.864060],
                                    [78.471109, 26.764060],
                                    [78.572109, 26.964060],
                                    [78.372109, 26.864060]
                                ]
                            ]
                        ]
                    }
                }
            ]
        };

        const statePolygon = new StatePolygon(testData);
        await statePolygon.save();
        console.log('Test state polygon data inserted successfully');
    } catch (error) {
        console.error('Error inserting test data:', error);
    }
};

module.exports = { insertTestStatePolygon };
