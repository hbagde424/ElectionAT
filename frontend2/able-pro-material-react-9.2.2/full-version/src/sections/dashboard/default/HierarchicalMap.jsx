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

            if (responseData.features && responseData.features.length > 0) {
                const divisionGroups = responseData.features.reduce((groups, feature) => {
                    console.log('Processing feature properties:', feature.properties);
                    const division = (feature.properties.DIVISION_NAME || feature.properties.DIVISION_NAME)?.toUpperCase();

                    if (!groups[division]) {
                        groups[division] = {
                            type: 'Feature',
                            properties: {
                                id: division.toLowerCase().replace(/\s+/g, '-'),
                                name: division,
                                DIVISION_CODE: feature.properties.DIVISION_CODE,
                                ST_NAME: feature.properties.ST_NAME,
                                districts: new Set([feature.properties.District]),
                                parliaments: new Set([feature.properties.Parliament]),
                                vsCodes: new Set([feature.properties.VS_Code])
                            },
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: []
                            }
                        };
                    } else {
                        groups[division].properties.districts.add(feature.properties.District);
                        groups[division].properties.parliaments.add(feature.properties.Parliament);
                        groups[division].properties.vsCodes.add(feature.properties.VS_Code);
                    }

                    if (feature.geometry?.coordinates) {
                        if (feature.geometry.type === 'MultiPolygon') {
                            groups[division].geometry.coordinates.push(...feature.geometry.coordinates);
                        } else if (feature.geometry.type === 'Polygon') {
                            groups[division].geometry.coordinates.push([feature.geometry.coordinates]);
                        }
                    }
                    return groups;
                }, {});

                const transformedData = {
                    type: 'FeatureCollection',
                    features: Object.values(divisionGroups).map(division => ({
                        ...division,
                        properties: {
                            ...division.properties,
                            districts: Array.from(division.properties.districts),
                            parliaments: Array.from(division.properties.parliaments),
                            vsCodes: Array.from(division.properties.vsCodes),
                            parliamentarySeats: division.properties.parliaments.size
                        }
                    }))
                };

                showBoundaries(transformedData, 'division');
            } else {
                console.warn('No division data available');
            }
        } catch (error) {
            console.error('Error loading division data:', error);
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
            const responseData = await response.json();
            console.log('Parliamentary data:', responseData);

            if (responseData && responseData.length > 0 && responseData[0].features) {
                // Get the first item since it's an array with one FeatureCollection
                const parliamentData = responseData[0];

                // Transform the data to match the expected format
                const transformedData = {
                    type: 'FeatureCollection',
                    features: parliamentData.features.map(feature => ({
                        type: 'Feature',
                        properties: {
                            id: feature.properties.PC_NAME.toLowerCase().replace(/\s+/g, '-'),
                            name: feature.properties.PC_NAME,
                            pcNo: feature.properties.PC_NO,
                            stateCode: feature.properties.ST_CODE,
                            stateName: feature.properties.ST_NAME,
                            parliamentId: feature.properties.PC_ID,
                            divisionName: divisionName
                        },
                        geometry: feature.geometry
                    }))
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
            const response = await fetch(`http://localhost:5000/api/assembly-polygons/parliament/${vsCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch assembly data');
            }

            const assemblies = await response.json();
            console.log('Received assembly data1:', assemblies.data[0].type);
            console.log('Received assembly data:', assemblies.data[0].features);

            if (assemblies && assemblies.data[0].type === "FeatureCollection" && assemblies.data[0].features && assemblies.data[0].features.length > 0) {
                console.log('Processing assembly features:', assemblies.data[0].features);
                // Transform the data to match the expected format
                const transformedData = {
                    type: 'FeatureCollection',
                    features: assemblies.data[0].features.map(feature => ({
                        type: 'Feature',
                        properties: {
                            id: feature.properties.PC_ID.toString(),
                            name: feature.properties.AC_NAME,
                            acNo: feature.properties.AC_NO.toString(),
                            pcName: feature.properties.PC_NAME,
                            district: feature.properties.ST_NAME,
                            division: feature.properties.DIVISION_NAME,
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
        console.log('Loading block data for Assembly ID:', assemblyId);
        try {
            const response = await fetch(`http://localhost:5000/api/block-polygons/booth/${assemblyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch block data');
            }
            const responseData = await response.json();
            if (responseData.success && responseData.data && responseData.data.length > 0) {
                console.log('Received block data:', responseData.data[0].features);
                // Transform the data into a FeatureCollection
                const transformedData = {
                    type: 'FeatureCollection',
                    features: responseData.data[0].features.map(feature => ({
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

    const loadBoothData = async (BlockNumber) => {
        try {
            console.log('Loading booth data for booth number:', BlockNumber);
            const response = await fetch(`http://localhost:5000/api/booths/block-number/${BlockNumber}`);
            if (!response.ok) {
                throw new Error('Failed to fetch booth data');
            }
            const responseData = await response.json();

            if (responseData && responseData.data && responseData.data.length > 0) {
                // Transform the data into a FeatureCollection
                const transformedData = {
                    type: 'FeatureCollection',
                    features: responseData.data[0].features.map(feature => ({
                        type: 'Feature',
                        properties: {
                            id: feature.properties.BoothId || feature.properties.id,
                            name: feature.properties.BoothName || feature.properties.name,
                            boothNo: feature.properties.BoothNo || feature.properties.boothNo,
                            blockName: feature.properties.BlockName || feature.properties.blockName,
                            location: feature.properties.Location || feature.properties.location,
                            totalVoters: feature.properties.TotalVoters || feature.properties.totalVoters,
                            maleFemaleRatio: feature.properties.Gender_Ratio || feature.properties.maleFemaleRatio,
                            boothArea: feature.properties.Area_Type || feature.properties.boothArea,
                            lastTurnout: feature.properties.Last_Turnout || feature.properties.lastTurnout,
                            facilities: feature.properties.Facilities || []
                        },
                        geometry: feature.geometry
                    }))
                };

                console.log('Transformed booth data:', transformedData);
                showBoundaries(transformedData, 'booth');
            } else {
                console.warn('No booth data available for this booth number');
            }
        } catch (error) {
            console.error('Error loading booth data:', error);
        }
    };

    // Color palette for different divisions
    const getDivisionColor = (divisionCode) => {
        console.log('Getting color for division code:', divisionCode);
        const colors = {
            'BHOPAL': '#ff0000ff', // Bhopal - Red
            'CHAMBAL': '#00ffeeff', // Chambal - Turquoise
            'GWALIOR': '#00d0ffff', // Gwalior - Blue
            'INDORE': '#00fc86ff', // Indore - Green
            'JABALPUR': '#ff0000ff', // Jabalpur - Pink
            'NARMADAPURAM': '#b200f8ff', // Narmadapuram - Purple
            'REWA': '#ffcc00ff', // Rewa - Yellow
            'SAGAR': '#ff7700ff', // Sagar - Orange
            'SHAHDOL': '#00ff6aff', // Shahdol - Green
            'UJJAIN': '#0086dfff'  // Ujjain - Blue
        };
        return colors[divisionCode] || '#3388ff';
    };

    const showBoundaries = (data, level) => {
        resetLayer();

        const style = (feature) => {
            let color = '#000000';
            let weight = 2;
            let fillOpacity = 0.2;

            if (level === 'state') {
                color = '#cc2e2eff'; // Green color for state
                weight = 3;
                fillOpacity = 0.15;
                // Add specific styling for MP state
                if (feature.properties.Name === 'Madhya Pradesh') {
                    color = '#000000'; // Darker green for MP
                    weight = 4;
                }
            } else if (level === 'division') {

                color = getDivisionColor(feature.properties.name);
                console.log('return colour code:', color);

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
                console.log('Division clicked:', feature.properties);
                // Get the first parliament name from the parliament array
                const parliament = feature.properties.name
                    ? feature.properties.name
                    : null;

                if (parliament) {
                    console.log('Loading parliamentary data for:', parliament);
                    loadParliamentaryData(parliament);
                    setCurrentLevel('parliamentary');
                } else {
                    console.warn('No Parliament found for division:', feature.properties.name);
                }
                break;
            case 'parliamentary':
                console.log('Parliamentary constituency clicked:', feature.properties);
                loadAssemblyData(feature.properties.pcNo);
                setCurrentLevel('assembly');
                break;
            case 'assembly':
                loadBlockData(feature.properties.acNo);
                setCurrentLevel('block');
                break;
            case 'block':
                const BlockNumber = feature.properties.BlockNumber || feature.properties.BlockNumber;
                if (BlockNumber) {
                    loadBoothData(BlockNumber);
                    setCurrentLevel('booth');
                } else {
                    console.warn('No Block number found in feature properties:', feature.properties);
                }
                break;
            default:
                break;
        }
    };

    const generatePopupContent = (feature, level) => {
        const properties = feature.properties;
        let content = `<div>
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
                    <p><strong>Division Code:</strong> ${properties.DIVISION_CODE || ''}</p>
                    <p><strong>State:</strong> ${properties.ST_NAME || ''}</p>
                    <p><strong>Districts:</strong> ${districts}</p>
                    ${properties.DIVISION_CODE && parliamentaryData[properties.id] ?
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
