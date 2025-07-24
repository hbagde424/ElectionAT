import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HierarchicalMap = () => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const currentLayerRef = useRef(null);
    const [currentLevel, setCurrentLevel] = useState('state');
    const [selectedFeature, setSelectedFeature] = useState(null);

    useEffect(() => {
        // Initialize map
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([23.4707, 77.9455], 6); // Centered on MP

            // Add base layers
            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 18
            }).addTo(mapInstanceRef.current);

            const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 18
            });

            // Add layer control
            const baseMaps = {
                "Street Map": osmLayer,
                "Satellite View": satelliteLayer
            };
            L.control.layers(baseMaps).addTo(mapInstanceRef.current);

            // Load initial state data
            loadStateData();
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    const resetLayer = () => {
        if (currentLayerRef.current) {
            mapInstanceRef.current.removeLayer(currentLayerRef.current);
            currentLayerRef.current = null;
        }
    };

    // State data will be fetched from API

    // Parliamentary constituency data by division
    const parliamentaryData = {
        bhopal: [
            { id: 'BPL01', name: 'Bhopal', pcNo: '18' },
            { id: 'BPL02', name: 'Vidisha', pcNo: '19' },
            { id: 'BPL03', name: 'Rajgarh', pcNo: '20' }
        ],
        indore: [
            { id: 'IND01', name: 'Indore', pcNo: '25' },
            { id: 'IND02', name: 'Dhar', pcNo: '24' }
        ],
        // Add more parliamentary constituencies for other divisions
    };

    const mpDivisionsData = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: {
                    id: 'bhopal',
                    name: 'Bhopal Division',
                    divisionCode: 'BPL',
                    stateName: 'Madhya Pradesh',
                    parliamentarySeats: 3,
                    districts: ['Bhopal', 'Sehore', 'Raisen', 'Vidisha', 'Rajgarh']
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [77.12, 23.08], // Bhopal division boundary
                        [77.35, 22.95],
                        [77.68, 22.89],
                        [77.92, 22.94],
                        [78.15, 23.12],
                        [78.32, 23.35],
                        [78.28, 23.68],
                        [78.15, 23.92],
                        [77.85, 24.08],
                        [77.52, 24.12],
                        [77.25, 23.98],
                        [77.08, 23.75],
                        [77.05, 23.42],
                        [77.12, 23.08]
                    ]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'chambal',
                    name: 'Chambal Division',
                    divisionCode: 'CHM',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[77.0, 25.5], [78.5, 25.5], [78.5, 26.5], [77.0, 26.5], [77.0, 25.5]]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'gwalior',
                    name: 'Gwalior Division',
                    divisionCode: 'GWL',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[77.5, 24.5], [79.0, 24.5], [79.0, 25.5], [77.5, 25.5], [77.5, 24.5]]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'indore',
                    name: 'Indore Division',
                    divisionCode: 'IND',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[75.5, 22.0], [76.5, 22.0], [76.5, 23.0], [75.5, 23.0], [75.5, 22.0]]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'jabalpur',
                    name: 'Jabalpur Division',
                    divisionCode: 'JBP',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[79.5, 22.5], [80.5, 22.5], [80.5, 23.5], [79.5, 23.5], [79.5, 22.5]]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'narmadapuram',
                    name: 'Narmadapuram Division',
                    divisionCode: 'NRM',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[77.0, 22.0], [78.0, 22.0], [78.0, 23.0], [77.0, 23.0], [77.0, 22.0]]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'rewa',
                    name: 'Rewa Division',
                    divisionCode: 'RWA',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[81.0, 24.0], [82.0, 24.0], [82.0, 25.0], [81.0, 25.0], [81.0, 24.0]]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'sagar',
                    name: 'Sagar Division',
                    divisionCode: 'SGR',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[78.5, 23.5], [79.5, 23.5], [79.5, 24.5], [78.5, 24.5], [78.5, 23.5]]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'shahdol',
                    name: 'Shahdol Division',
                    divisionCode: 'SDL',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[81.5, 23.0], [82.5, 23.0], [82.5, 24.0], [81.5, 24.0], [81.5, 23.0]]]
                }
            },
            {
                type: 'Feature',
                properties: {
                    id: 'ujjain',
                    name: 'Ujjain Division',
                    divisionCode: 'UJN',
                    stateName: 'Madhya Pradesh'
                },
                geometry: {
                    type: 'Polygon',
                    coordinates: [[[75.0, 23.0], [76.0, 23.0], [76.0, 24.0], [75.0, 24.0], [75.0, 23.0]]]
                }
            }
        ]
    };

    const loadStateData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/state-polygons');
            if (!response.ok) {
                throw new Error('Failed to fetch state data');
            }
            const responseData = await response.json();
            if (responseData.success && responseData.data && responseData.data.length > 0) {
                const stateData = responseData.data[0];

                // Validate MultiPolygon structure
                const validatedStateData = {
                    ...stateData,
                    features: stateData.features.map(feature => {
                        // Ensure geometry type is correct
                        if (!feature.geometry || feature.geometry.type !== 'MultiPolygon') {
                            console.warn('Invalid geometry type in state data');
                            return feature;
                        }

                        // Validate coordinates structure
                        if (!Array.isArray(feature.geometry.coordinates) ||
                            !Array.isArray(feature.geometry.coordinates[0]) ||
                            !Array.isArray(feature.geometry.coordinates[0][0])) {
                            console.warn('Invalid coordinates structure in state data');
                            return feature;
                        }

                        return {
                            ...feature,
                            properties: {
                                ...feature.properties,
                                id: feature.properties.Name.toLowerCase().replace(/\s+/g, '-'),
                                name: feature.properties.Name
                            }
                        };
                    })
                };
                console.log('validatedStateData', validatedStateData)
                showBoundaries(validatedStateData, 'state');
                setCurrentLevel('state');
                setSelectedFeature(null);
            } else {
                console.warn('No state data available');
            }
        } catch (error) {
            console.error('Error loading state data:', error);
        }
    };

    const loadDivisionData = async (stateId) => {
        try {
            const response = await fetch('http://localhost:5000/api/division-polygons');
            if (!response.ok) {
                throw new Error('Failed to fetch division data');
            }
            const responseData = await response.json();
            if (responseData.polygons && responseData.polygons.length > 0) {
                const divisionData = responseData.polygons[0];
                // Transform data to match the required format if needed
                const transformedData = {
                    ...divisionData,
                    features: divisionData.features.map(feature => ({
                        ...feature,
                        properties: {
                            ...feature.properties,
                            id: feature.properties.Division.toLowerCase().replace(/\s+/g, '-'),
                            name: feature.properties.Name,
                            divisionCode: feature.properties.Division.substring(0, 3).toUpperCase(),
                            stateName: 'Madhya Pradesh',
                            parliamentarySeats: 1, // You might want to calculate this based on your data
                            districts: [feature.properties.District]
                        }
                    }))
                };
                showBoundaries(transformedData, 'division');
            } else {
                console.warn('No division data available');
                // Fallback to static data if API fails
                showBoundaries(mpDivisionsData, 'division');
            }
        } catch (error) {
            console.error('Error loading division data:', error);
            // Fallback to static data if API fails
            showBoundaries(mpDivisionsData, 'division');
        }
    };

    // Parliamentary data will be fetched from API

    const loadParliamentaryData = async (divisionName) => {
        try {
            // First get the Parliament name from division data
            const parliamentName = divisionName;
            console.log('Parliament name found:', parliamentName);

            // Now fetch the parliamentary data using the Parliament name
            const response = await fetch(`http://localhost:5000/api/parliament-polygons/name/${parliamentName}`);
            if (!response.ok) {
                throw new Error('Failed to fetch parliamentary data');
            }
            const data = await response.json();
            console.log('Parliamentary data:', data);
            console.log('Looking for Parliament name:', parliamentName);

            if (data && data.length > 0 && data[0].features) {
                // Get the first item since it's an array with one FeatureCollection
                const parliamentData = data[0];
                console.log('Processing parliament data features:', parliamentData.features);

                // Group features by Parliament constituency
                const parliamentFeatures = {};
                parliamentData.features.forEach(feature => {
                    console.log('Processing feature:', feature);
                    const pcName = feature.properties.Parliament;
                    if (pcName === parliamentName) {
                        if (!parliamentFeatures[pcName]) {
                            parliamentFeatures[pcName] = {
                                type: 'Feature',
                                properties: {
                                    id: pcName.toLowerCase().replace(/\s+/g, '-'),
                                    name: pcName,
                                    vsCode: feature.properties.VS_Code,
                                    divisionName: feature.properties.Division,
                                    district: feature.properties.District,
                                    assemblyName: feature.properties.Name,
                                    assemblySeats: 0,
                                    totalVoters: 0,
                                    lastElectionYear: '2023'
                                },
                                geometry: {
                                    type: 'MultiPolygon',
                                    coordinates: []
                                }
                            };
                        }
                        // Count assembly seats
                        parliamentFeatures[pcName].properties.assemblySeats++;

                        // Add geometry
                        if (feature.geometry.type === 'Polygon') {
                            // Create a proper MultiPolygon coordinate structure
                            parliamentFeatures[pcName].geometry.coordinates.push(feature.geometry.coordinates);
                        } else if (feature.geometry.type === 'MultiPolygon') {
                            parliamentFeatures[pcName].geometry.coordinates.push(...feature.geometry.coordinates);
                        }
                    }
                });

                const transformedData = {
                    type: 'FeatureCollection',
                    features: Object.values(parliamentFeatures)
                };

                console.log('Transformed parliamentary data:', transformedData);

                if (transformedData.features.length > 0) {
                    showBoundaries(transformedData, 'parliamentary');
                } else {
                    console.warn('No parliamentary constituencies found for division:', divisionName);
                }
            } else {
                console.warn('No parliamentary data available');
            }
        } catch (error) {
            console.error('Error loading parliamentary data:', error);
        }
    };

    // Static assembly constituency data
    const assemblyBoundariesData = {
        BPL01: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        id: 'AC001',
                        name: 'Berasia',
                        acNo: '157',
                        pcName: 'Bhopal Parliamentary',
                        totalVoters: '245678',
                        category: 'GEN',
                        lastElectionYear: '2023',
                        winner: 'BJP',
                        margin: '45678'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [77.35, 23.25],
                            [77.45, 23.22],
                            [77.52, 23.28],
                            [77.48, 23.35],
                            [77.42, 23.38],
                            [77.35, 23.32],
                            [77.35, 23.25]
                        ]]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        id: 'AC002',
                        name: 'Bhopal Uttar',
                        acNo: '158',
                        pcName: 'Bhopal Parliamentary',
                        totalVoters: '267890',
                        category: 'GEN',
                        lastElectionYear: '2023',
                        winner: 'BJP',
                        margin: '34567'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [77.38, 23.15],
                            [77.48, 23.12],
                            [77.55, 23.18],
                            [77.52, 23.25],
                            [77.45, 23.22],
                            [77.38, 23.15]
                        ]]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        id: 'AC003',
                        name: 'Narela',
                        acNo: '159',
                        pcName: 'Bhopal Parliamentary',
                        totalVoters: '234567',
                        category: 'GEN',
                        lastElectionYear: '2023',
                        winner: 'INC',
                        margin: '12345'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [77.32, 23.28],
                            [77.42, 23.25],
                            [77.48, 23.32],
                            [77.45, 23.38],
                            [77.38, 23.35],
                            [77.32, 23.28]
                        ]]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        id: 'AC004',
                        name: 'Bhopal Dakshin-Paschim',
                        acNo: '160',
                        pcName: 'Bhopal Parliamentary',
                        totalVoters: '289012',
                        category: 'GEN',
                        lastElectionYear: '2023',
                        winner: 'BJP',
                        margin: '23456'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [77.25, 23.18],
                            [77.35, 23.15],
                            [77.42, 23.22],
                            [77.38, 23.28],
                            [77.32, 23.25],
                            [77.25, 23.18]
                        ]]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        id: 'AC005',
                        name: 'Bhopal Madhya',
                        acNo: '161',
                        pcName: 'Bhopal Parliamentary',
                        totalVoters: '278901',
                        category: 'GEN',
                        lastElectionYear: '2023',
                        winner: 'BJP',
                        margin: '34567'
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [77.42, 23.32],
                            [77.52, 23.28],
                            [77.58, 23.35],
                            [77.55, 23.42],
                            [77.48, 23.38],
                            [77.42, 23.32]
                        ]]
                    }
                }
            ]
        }
    };

    const loadAssemblyData = async (vsCode) => {
        try {
            console.log('Loading assembly data for VS_Code:', vsCode);
            const response = await fetch(`http://localhost:5000/api/assembly-polygons/vs-code/${vsCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch assembly data');
            }

            const assemblies = await response.json();
            console.log('Received assembly data:', assemblies);

            if (assemblies && assemblies.type === 'FeatureCollection' && assemblies.features && assemblies.features.length > 0) {
                console.log('Processing assembly features:', assemblies.features);
                // Transform the data to match the expected format
                const transformedData = {
                    type: 'FeatureCollection',
                    features: assemblies.features.map(feature => ({
                        type: 'Feature',
                        properties: {
                            id: feature.properties.VS_Code.toString(),
                            name: feature.properties.Name,
                            acNo: feature.properties.VS_Code.toString(),
                            pcName: feature.properties.Parliament,
                            district: feature.properties.District,
                            division: feature.properties.Division,
                            category: 'GEN',
                            lastElectionYear: '2023'
                        },
                        geometry: feature.geometry
                    }))
                };

                console.log('Final transformed assembly data:', transformedData);

                console.log('Transformed Assembly Data:', transformedData);
                showBoundaries(transformedData, 'assembly');
            } else {
                console.warn('No assembly data available');
                // Fallback to static data if needed
                setCurrentLevel('assembly');
            }
        } catch (error) {
            console.error('Error loading assembly data:', error);
        }
    };

    // Block data will be fetched from API

    const loadBlockData = async (assemblyId) => {
        try {
            const response = await fetch('http://localhost:5000/api/block-polygons');
            if (!response.ok) {
                throw new Error('Failed to fetch block data');
            }
            const responseData = await response.json();
            if (responseData.success && responseData.data && responseData.data.length > 0) {
                // Transform the data into a FeatureCollection
                const transformedData = {
                    type: 'FeatureCollection',
                    features: responseData.data.map(feature => ({
                        type: 'Feature',
                        properties: {
                            ...feature.properties,
                            id: feature.properties.BlockName.toLowerCase().replace(/\s+/g, '-'),
                            name: feature.properties.BlockName,
                            blockCode: feature.properties.BlockName,
                            acName: feature.properties.AC_NAME,
                            mainTown: feature.properties.DIST_NAME,
                            population: null, // Add if available in your data
                            totalVoters: null, // Add if available in your data
                            totalBooths: 1, // This should be calculated based on your data
                            ruralBooths: feature.properties.BoothName ? 1 : 0,
                            urbanBooths: 0
                        },
                        geometry: feature.geometry
                    }))
                };
                showBoundaries(transformedData, 'block');
            } else {
                console.warn('No block data available for this assembly constituency');
            }
        } catch (error) {
            console.error('Error loading block data:', error);
        }
    };

    // Static booth data
    const boothBoundariesData = {
        BLK001: {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {
                        id: 'BTH001',
                        name: 'Booth 1 - Berasia City',
                        boothNo: '157/01',
                        blockName: 'Berasia Block',
                        location: 'Government School, Berasia',
                        totalVoters: '1245',
                        maleFemaleRatio: '1.1',
                        boothArea: 'Urban',
                        lastTurnout: '78.5%',
                        facilities: ['Ramp', 'Drinking Water', 'Toilet']
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [77.35, 23.25],
                            [77.37, 23.24],
                            [77.38, 23.25],
                            [77.37, 23.26],
                            [77.35, 23.25]
                        ]]
                    }
                },
                {
                    type: 'Feature',
                    properties: {
                        id: 'BTH002',
                        name: 'Booth 2 - Berasia Rural',
                        boothNo: '157/02',
                        blockName: 'Berasia Block',
                        location: 'Primary School, Berasia Rural',
                        totalVoters: '985',
                        maleFemaleRatio: '0.95',
                        boothArea: 'Rural',
                        lastTurnout: '82.3%',
                        facilities: ['Ramp', 'Drinking Water']
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[
                            [77.38, 23.24],
                            [77.40, 23.23],
                            [77.41, 23.24],
                            [77.40, 23.25],
                            [77.38, 23.24]
                        ]]
                    }
                }
            ]
        }
    };

    const loadBoothData = async (blockId) => {
        try {
            // Using static data instead of API call
            if (boothBoundariesData[blockId]) {
                showBoundaries(boothBoundariesData[blockId], 'booth');
            } else {
                console.warn('No booth data available for this block');
            }
        } catch (error) {
            console.error('Error loading booth data:', error);
        }
    };

    // Color palette for different divisions
    const getDivisionColor = (divisionCode) => {
        const colors = {
            'BPL': '#FF6B6B', // Bhopal - Red
            'CHM': '#4ECDC4', // Chambal - Turquoise
            'GWL': '#45B7D1', // Gwalior - Blue
            'IND': '#96CEB4', // Indore - Green
            'JBP': '#D4A5A5', // Jabalpur - Pink
            'NRM': '#9B59B6', // Narmadapuram - Purple
            'RWA': '#F1C40F', // Rewa - Yellow
            'SGR': '#E67E22', // Sagar - Orange
            'SDL': '#2ECC71', // Shahdol - Green
            'UJN': '#3498DB'  // Ujjain - Blue
        };
        return colors[divisionCode] || '#3388ff';
    };

    const showBoundaries = (data, level) => {
        resetLayer();

        const style = (feature) => {
            let color = '#3388ff';
            let weight = 2;
            let fillOpacity = 0.2;

            if (level === 'state') {
                color = '#2ecc71'; // Green color for state
                weight = 3;
                fillOpacity = 0.15;
                // Add specific styling for MP state
                if (feature.properties.Name === 'Madhya Pradesh') {
                    color = '#1a5f32'; // Darker green for MP
                    weight = 4;
                }
            } else if (level === 'division') {
                color = getDivisionColor(feature.properties.divisionCode);
            }

            return {
                color: color,
                weight: weight,
                fillOpacity: fillOpacity,
                fillColor: color
            };
        };

        currentLayerRef.current = L.geoJSON(data, {
            style: style,
            onEachFeature: (feature, layer) => {
                // Add tooltip
                layer.bindTooltip(feature.properties.name || '', {
                    permanent: false,
                    direction: 'center'
                });

                // Add popup with details
                const content = generatePopupContent(feature, level);
                layer.bindPopup(content);

                // Click handler for drill-down
                layer.on('click', () => handleLayerClick(feature, level));

                // Hover effects
                layer.on({
                    mouseover: (e) => {
                        const layer = e.target;
                        layer.setStyle({
                            weight: 3,
                            color: '#666',
                            fillOpacity: 0.3
                        });
                    },
                    mouseout: (e) => {
                        currentLayerRef.current.resetStyle(e.target);
                    }
                });
            }
        }).addTo(mapInstanceRef.current);

        // Fit bounds to show all features
        mapInstanceRef.current.fitBounds(currentLayerRef.current.getBounds());
    };

    const handleLayerClick = (feature, level) => {
        setSelectedFeature(feature);
        console.log('Clicked feature:', feature, 'at level:', level);
        switch (level) {
            case 'state':
                loadDivisionData(feature.properties.id);
                setCurrentLevel('division');
                break;
            case 'division':
                // Check if we have VS_Code in the properties
                const vsCode = feature.properties.VS_Code || feature.properties.vsCode;
                console.log('Division clicked, VS_Code:', vsCode);
                if (vsCode) {
                    loadParliamentaryData(feature.properties.Parliament);
                    setCurrentLevel('Parliament');
                } else {
                    console.warn('No VS_Code found for division:', feature.properties.name);
                }
                break;
            case 'parliamentary':
                loadAssemblyData(feature.properties.vsCode);
                setCurrentLevel('Assembly ');
                break;
            case 'assembly':
                loadBlockData(feature.properties.id);
                setCurrentLevel('block');
                break;
            case 'block':
                loadBoothData(feature.properties.id);
                setCurrentLevel('booth');
                break;
            default:
                break;
        }
    };

    const generatePopupContent = (feature, level) => {
        const properties = feature.properties;
        let content = `<div class="popup-content" style="min-width: 200px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">${properties.Name || properties.name || ''}</h4>`;

        switch (level) {
            case 'state':
                content += `
                    <p><strong>State Name:</strong> ${properties.Name || ''}</p>
                    <p><strong>Type:</strong> ${properties.Type || ''}</p>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                        <p style="font-size: 0.9em; color: #666;">Click to view Divisions</p>
                    </div>`;
                break;
            case 'division':
                const districts = properties.districts ? properties.districts.join(', ') : '';
                content += `
                    <p><strong>Division Code:</strong> ${properties.divisionCode || ''}</p>
                    <p><strong>State:</strong> ${properties.stateName || ''}</p>
                    <p><strong>Parliamentary Seats:</strong> ${properties.parliamentarySeats || ''}</p>
                    <p><strong>Districts:</strong> ${districts}</p>
                    ${properties.divisionCode && parliamentaryData[properties.id] ?
                        `<p><strong>Parliamentary Constituencies:</strong></p>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            ${parliamentaryData[properties.id].map(pc =>
                            `<li>${pc.name} (PC No: ${pc.pcNo})</li>`
                        ).join('')}
                        </ul>`
                        : ''}`;
                break;
            case 'parliamentary':
                content += `
                    <p><strong>Parliamentary Constituency:</strong> ${properties.name || ''}</p>
                    <p><strong>Division:</strong> ${properties.divisionName || ''}</p>
                    <p><strong>District:</strong> ${properties.district || ''}</p>
                    <p><strong>Assembly Name:</strong> ${properties.assemblyName || ''}</p>
                    <p><strong>Assembly Seats:</strong> ${properties.assemblySeats || ''}</p>
                    <p><strong>VS Code:</strong> ${properties.vsCode || ''}</p>
                    <p><strong>Last Election Year:</strong> ${properties.lastElectionYear || ''}</p>
                    <hr style="margin: 10px 0">
                    <p style="font-size: 0.9em; color: #666;">Click to view Assembly Constituencies</p>`;
                break;
            case 'assembly':
                content += `
                    <p><strong>AC No:</strong> ${properties.acNo || ''}</p>
                    <p><strong>Parliamentary:</strong> ${properties.pcName || ''}</p>
                    <p><strong>Category:</strong> ${properties.category || ''}</p>
                    <p><strong>Total Voters:</strong> ${properties.totalVoters ? Number(properties.totalVoters).toLocaleString() : ''}</p>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                        <p><strong>Last Election (${properties.lastElectionYear || ''}):</strong></p>
                        <p>Winner: ${properties.winner || ''}</p>
                        <p>Margin: ${properties.margin ? Number(properties.margin).toLocaleString() : ''} votes</p>
                    </div>
                    <hr style="margin: 10px 0">
                    <p style="font-size: 0.9em; color: #666;">Click to view Blocks</p>`;
                break;
            case 'block':
                content += `
                    <p><strong>Block Code:</strong> ${properties.blockCode || ''}</p>
                    <p><strong>Assembly:</strong> ${properties.acName || ''}</p>
                    <p><strong>Main Town:</strong> ${properties.mainTown || ''}</p>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                        <p><strong>Demographics:</strong></p>
                        <p>Population: ${properties.population ? Number(properties.population).toLocaleString() : ''}</p>
                        <p>Total Voters: ${properties.totalVoters ? Number(properties.totalVoters).toLocaleString() : ''}</p>
                    </div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                        <p><strong>Booth Information:</strong></p>
                        <p>Total Booths: ${properties.totalBooths || ''}</p>
                        <p>Rural Booths: ${properties.ruralBooths || ''}</p>
                        <p>Urban Booths: ${properties.urbanBooths || ''}</p>
                    </div>
                    <hr style="margin: 10px 0">
                    <p style="font-size: 0.9em; color: #666;">Click to view Booths</p>`;
                break;
            case 'booth':
                content += `
                    <p><strong>Booth No:</strong> ${properties.boothNo || ''}</p>
                    <p><strong>Block:</strong> ${properties.blockName || ''}</p>
                    <p><strong>Location:</strong> ${properties.location || ''}</p>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                        <p><strong>Voter Information:</strong></p>
                        <p>Total Voters: ${properties.totalVoters ? Number(properties.totalVoters).toLocaleString() : ''}</p>
                        <p>Male/Female Ratio: ${properties.maleFemaleRatio || ''}</p>
                        <p>Last Turnout: ${properties.lastTurnout || ''}</p>
                    </div>
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                        <p><strong>Area Type:</strong> ${properties.boothArea || ''}</p>
                        <p><strong>Available Facilities:</strong></p>
                        <ul style="margin: 5px 0; padding-left: 20px;">
                            ${properties.facilities ? properties.facilities.map(facility => `<li>${facility}</li>`).join('') : ''}
                        </ul>
                    </div>`;
                break;
        }

        content += '</div>';
        return content;
    };

    return (
        <div>
            <div style={{ height: '600px' }} ref={mapRef}></div>
            {/* Navigation breadcrumb */}
            <div style={{ padding: '10px', background: '#f5f5f5', marginTop: '10px' }}>
                <button
                    onClick={loadStateData}
                    disabled={currentLevel === 'state'}
                >
                    Back to State
                </button>
                {selectedFeature && (
                    <span style={{ marginLeft: '10px' }}>
                        {selectedFeature.properties.name} ({currentLevel})
                    </span>
                )}
            </div>
        </div>
    );
};

export default HierarchicalMap;
