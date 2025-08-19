import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faExpand, faCompress } from '@fortawesome/free-solid-svg-icons';
import MainCard from 'components/MainCard';

// Add custom styles for permanent labels
const customStyles = `
    .permanent-label {
        background-color: transparent !important;
        border: none !important;
        box-shadow: none !important;
        font-weight: bold;
        color: #333;
        text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff;
        font-size: 14px;
    }
`;


function HierarchicalMap({ onRegionClick }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const currentLayerRef = useRef(null);
    const [currentLevel, setCurrentLevel] = useState('state');
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);

    // Function to handle fullscreen toggle
    const toggleFullscreen = () => {
        const element = document.documentElement;
        if (!isFullscreen) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        setIsFullscreen(!isFullscreen);
    };

    // Function to handle finding user location
    const handleFindLocation = () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.locate({ setView: true, maxZoom: 16 });
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);



    useEffect(() => {
        // Add custom styles to document
        const styleElement = document.createElement('style');
        styleElement.textContent = customStyles;
        document.head.appendChild(styleElement);

        // Initialize map
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([23.4707, 77.9455], 6); // Centered on MP

            // --- Add India GeoJSON as a non-interactive background layer ---
            fetch('/india.geojson')
                .then(res => res.json())
                .then(indiaData => {
                    L.geoJSON(indiaData, {
                        style: {
                            color: '#003366', // dark blue outline
                            weight: 1,
                            fillOpacity: 0.07,
                            fillColor: '#e0e0e0'
                        },
                        interactive: false
                    }).addTo(mapInstanceRef.current);
                })
                .catch(err => {
                    console.error('Could not load India GeoJSON:', err);
                });
            // --- End India GeoJSON block ---

            // Add location found event handler
            mapInstanceRef.current.on('locationfound', (e) => {
                setUserLocation(e.latlng);
                if (!currentLayerRef.current) {
                    const marker = L.marker(e.latlng).addTo(mapInstanceRef.current);
                    marker.bindPopup('You are here!').openPopup();
                }
            });

            // Add location error handler
            mapInstanceRef.current.on('locationerror', (e) => {
                alert('Could not access your location. Please check your location permissions.');
            });

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
            // Clean up custom styles
            const styleElement = document.querySelector('style');
            if (styleElement && styleElement.textContent === customStyles) {
                document.head.removeChild(styleElement);
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
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/state-polygons`);
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
                            return feature;
                        }

                        // Validate coordinates structure
                        if (!Array.isArray(feature.geometry.coordinates) ||
                            !Array.isArray(feature.geometry.coordinates[0]) ||
                            !Array.isArray(feature.geometry.coordinates[0][0])) {
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
                showBoundaries(validatedStateData, 'state');
                setCurrentLevel('state');
                setSelectedFeature(null);
            } else {
                alert('No state data available');
            }
        } catch (error) {
            console.error('Error loading state data:', error);
        }
    };

    const loadDivisionData = async (stateId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/division-polygons`);
            if (!response.ok) {
                throw new Error('Failed to fetch division data');
            }
            const responseData = await response.json();

            if (responseData.features && responseData.features.length > 0) {
                const divisionGroups = responseData.features.reduce((groups, feature) => {
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
            const parliamentName = divisionName;
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-polygons/name/${parliamentName}`);
            if (!response.ok) {
                throw new Error('Failed to fetch parliamentary data');
            }
            const responseData = await response.json();

            if (responseData && responseData.length > 0 && responseData[0].features) {
                const parliamentData = responseData[0];
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

                if (transformedData.features.length > 0) {
                    showBoundaries(transformedData, 'parliamentary');
                } else {
                    alert('No parliamentary constituencies found for division: ' + divisionName);
                }
            } else {
                alert('No parliamentary data available');
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
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/assembly-polygons/parliament/${vsCode}`);
            if (!response.ok) {
                throw new Error('Failed to fetch assembly data');
            }

            const assemblies = await response.json();
            if (assemblies && assemblies.data[0].type === "FeatureCollection" && assemblies.data[0].features && assemblies.data[0].features.length > 0) {
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

                showBoundaries(transformedData, 'assembly');
            } else {
                alert('No assembly data available');
                setCurrentLevel('assembly');
            }
        } catch (error) {
            console.error('Error loading assembly data:', error);
        }
    };

    // Block data will be fetched from API

    const loadBlockData = async (assemblyId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/block-polygons/booth/${assemblyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch block data');
            }
            const responseData = await response.json();
            if (responseData.success && responseData.data && responseData.data.length > 0) {
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
                            population: null,
                            totalVoters: null,
                            totalBooths: 1,
                            ruralBooths: feature.properties.BoothName ? 1 : 0,
                            urbanBooths: 0
                        },
                        geometry: feature.geometry
                    }))
                };
                showBoundaries(transformedData, 'block');
            } else {
                alert('No block data available for this assembly constituency');
            }
        } catch (error) {
            console.error('Error loading block data:', error);
        }
    };

    const loadBoothData = async (BlockNumber) => {
        try {

            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${BlockNumber}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();

            // Validate API response structure
            if (!responseData.success || !responseData.features || !Array.isArray(responseData.features)) {
                throw new Error('Invalid API response structure');
            }

            if (responseData.features.length === 0) {
                alert(`No booths found for block ${BlockNumber}`);
                return;
            }

            // Transform features with proper validation
            const transformedData = {
                type: 'FeatureCollection',
                features: responseData.features.map((feature, index) => {
                    // Validate geometry
                    if (!feature.geometry || !feature.geometry.coordinates) {
                        console.warn(`Feature ${index} missing geometry`, feature);
                        return null;
                    }

                    return {
                        type: 'Feature',
                        properties: {
                            id: feature.properties?.BoothId ||
                                feature.properties?.id ||
                                `booth-${BlockNumber}-${index}`,
                            name: feature.properties?.BoothName ||
                                feature.properties?.name ||
                                `Booth ${feature.properties?.BoothNo || index}`,
                            boothNo: feature.properties?.BoothNo || feature.properties?.boothNo || '',
                            blockName: feature.properties?.BlockName || feature.properties?.blockName || '',
                            blockNumber: feature.properties?.BlockNumber || BlockNumber, // Ensure blockNumber is included
                            location: feature.properties?.Location || feature.properties?.location || '',
                            totalVoters: parseInt(feature.properties?.TotalVoters || feature.properties?.totalVoters || 0),
                            maleFemaleRatio: feature.properties?.Gender_Ratio || feature.properties?.maleFemaleRatio || '',
                            boothArea: feature.properties?.Area_Type || feature.properties?.boothArea || '',
                            lastTurnout: feature.properties?.Last_Turnout || feature.properties?.lastTurnout || '',
                            facilities: Array.isArray(feature.properties?.Facilities) ?
                                feature.properties.Facilities : []
                        },
                        geometry: feature.geometry
                    };
                }).filter(feature => feature !== null)
            };

            // Clear existing booth markers if any
            mapInstanceRef.current.eachLayer(layer => {
                if (layer instanceof L.Marker && layer._popup && layer._popup._content.includes('Booth')) {
                    mapInstanceRef.current.removeLayer(layer);
                }
            });

            // Show only the selected block's booths
            showBoundaries(transformedData, 'booth');
            setCurrentLevel('booth');

            // Fit bounds to show only these booths
            if (currentLayerRef.current) {
                mapInstanceRef.current.fitBounds(currentLayerRef.current.getBounds(), {
                    padding: [50, 50], // Add some padding
                    maxZoom: 16 // Don't zoom in too close
                });
            }

        } catch (error) {
            console.error('Error in loadBoothData:', error);
            alert(`Failed to load booth data: ${error.message}`);

            // Fallback: Show the block boundaries again
            if (selectedFeature && selectedFeature.properties) {
                loadBlockData(selectedFeature.properties.blockCode || selectedFeature.properties.id);
            }
        }
    };



    const showBoundaries = (data, level) => {
        resetLayer();

        const style = (feature) => {
            let color = '#477fcdff';
            let weight = 2;
            let fillOpacity = 0.2;

            if (level === 'state') {

                weight = 3;
                fillOpacity = 0.15;
                // Add specific styling for MP state
                if (feature.properties.Name === 'Madhya Pradesh') {

                    weight = 4;
                }
            } else if (level === 'division') {


                weight = 4;

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
                // Add permanent label
                layer.bindTooltip(feature.properties.name || '', {
                    permanent: true,
                    direction: 'center',
                    className: 'permanent-label',
                    offset: [0, 0],
                    opacity: 0.9
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
        // Store current state in history before changing
        setNavigationHistory(prev => [...prev, {
            level: currentLevel,
            feature: selectedFeature,
            id: feature.properties.id,
            name: feature.properties.name
        }]);

        setSelectedFeature(feature);

        // Call the onRegionClick prop with region data
        if (onRegionClick) {
            onRegionClick({
                id: feature.properties.id,
                name: feature.properties.name,
                level: level
            });
        }

        switch (level) {
            case 'state':
                loadDivisionData(feature.properties.id);
                setCurrentLevel('division');
                break;
            case 'division':
                // Get the first parliament name from the parliament array
                const parliament = feature.properties.name
                    ? feature.properties.name
                    : null;

                if (parliament) {
                    loadParliamentaryData(parliament);
                    setCurrentLevel('parliamentary');
                } else {
                    console.warn('No Parliament found for division:', feature.properties.name);
                }
                break;
            case 'parliamentary':
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
        <MainCard>
            <div>
                <div style={{ position: 'relative' }}>
                    <div
                        style={{
                            height: '600px',
                            position: 'relative'
                        }}
                        className="map-container"
                        ref={mapRef}
                    ></div>
                    {/* Map Controls */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        zIndex: 1000
                    }}>
                        <button
                            onClick={handleFindLocation}
                            style={{
                                padding: '8px',
                                backgroundColor: 'white',
                                border: '2px solid rgba(0,0,0,0.2)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '34px',
                                height: '34px'
                            }}
                            title="Find my location"
                        >
                            <FontAwesomeIcon icon={faLocationDot} />
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            style={{
                                padding: '8px',
                                backgroundColor: 'white',
                                border: '2px solid rgba(0,0,0,0.2)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '34px',
                                height: '34px'
                            }}
                            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                        </button>
                    </div>
                </div>
                {/* Navigation breadcrumb */}
                <div style={{ padding: '10px', background: '#f5f5f5', marginTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Current Location Display */}
                        {selectedFeature && (
                            <div style={{
                                padding: '8px',
                                backgroundColor: '#fff',
                                borderRadius: '4px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}>
                                <span style={{ fontWeight: '500' }}>
                                    Current Location: {selectedFeature.properties.name} ({currentLevel})
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainCard>
    );
};

export default HierarchicalMap;
