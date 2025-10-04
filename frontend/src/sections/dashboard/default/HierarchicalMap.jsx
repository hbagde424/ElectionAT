import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faExpand, faCompress, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import MainCard from 'components/MainCard';

// Add custom styles for permanent labels and hover popups
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
    .custom-popup .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 300px;
        max-height: 400px;
        overflow-y: auto;
    }
    .custom-popup .leaflet-popup-content {
        margin: 0;
        font-family: Arial, sans-serif;
        font-size: 13px;
        line-height: 1.4;
    }
    .custom-popup .leaflet-popup-tip {
        background-color: white;
    }
    /* New hover popup styles */
    .custom-hover-popup .leaflet-popup-content-wrapper {
        background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        padding: 0;
        border: 1px solid rgba(0,0,0,0.06);
    }
    .custom-hover-popup .hover-header {
        padding: 10px 12px;
        border-bottom: 1px solid rgba(0,0,0,0.04);
        background: linear-gradient(90deg, rgba(0,123,255,0.08), rgba(0,200,83,0.02));
    }
    .custom-hover-popup .hover-title { font-weight: 700; color: #222; margin:0; font-size:14px }
    .custom-hover-popup .hover-sub { color: #666; font-size:12px; margin-top:4px }
    .custom-hover-popup .hover-body { padding: 10px 12px; display:flex; gap:10px; flex-wrap:wrap }
    .custom-hover-popup .hover-stat { flex: 1 1 45%; min-width: 110px; background: #fff; border-radius:6px; padding:8px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
    .custom-hover-popup .hover-stat b { display:block; font-size:13px; color:#111 }
    .custom-hover-popup .hover-stat span { font-size:12px; color:#555 }
    /* Smooth highlight style for hovered layer */
    .hover-highlight {
        transition: all 200ms ease;
        filter: drop-shadow(0 4px 12px rgba(0,0,0,0.12));
    }
`;


function HierarchicalMap({ onRegionClick }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const currentLayerRef = useRef(null);
    const boothLookupRef = useRef({}); // in-memory lookup: booth_number -> booth data
    const prefetchingBlocksRef = useRef(new Set());
    const [currentLevel, setCurrentLevel] = useState('state');
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [hoverData, setHoverData] = useState({}); // Store fetched data for hover
    const closeTimersRef = useRef({}); // store close timers by layer id to delay popup close

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

    // Update popup content when hover data changes
    useEffect(() => {
        // console.log('🔄 Hover data updated:', hoverData); // Commented out to reduce noise
        if (currentLayerRef.current) {
            currentLayerRef.current.eachLayer((layer) => {
                if (layer._popup && layer.feature) {
                    const feature = layer.feature;
                    const level = currentLevel;

                    // Create consistent cache key for this feature
                    let cacheKey;
                    if (level === 'parliamentary') {
                        cacheKey = `${level}_${feature.properties.pcNo}`;
                    } else {
                        cacheKey = `${level}_${feature.properties.id}`;
                    }

                    const newContent = generatePopupContent(feature, level);
                    layer.setPopupContent(newContent);
                }
            });
        }
    }, [hoverData, currentLevel]);



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

    // Function to handle back navigation
    const handleBackNavigation = () => {
        // Simple one-step back navigation with better property handling
        switch (currentLevel) {
            case 'booth':
                const blockAcNo = selectedFeature?.properties?.acNo ||
                    selectedFeature?.properties?.AC_NO ||
                    'AC001';
                loadBlockData(blockAcNo);
                setCurrentLevel('block');
                break;
            case 'block':
                const assemblyPcNo = selectedFeature?.properties?.pcNo ||
                    selectedFeature?.properties?.PC_NO ||
                    selectedFeature?.properties?.acNo ||
                    selectedFeature?.properties?.AC_NO ||
                    'PC001';
                loadAssemblyData(assemblyPcNo);
                setCurrentLevel('assembly');
                break;
            case 'assembly':
                const parliamentName = selectedFeature?.properties?.pcName ||
                    selectedFeature?.properties?.PC_NAME ||
                    selectedFeature?.properties?.divisionName ||
                    selectedFeature?.properties?.DIVISION_NAME ||
                    'Default';
                loadParliamentaryData(parliamentName);
                setCurrentLevel('parliamentary');
                break;
            case 'parliamentary':
                const divisionName = selectedFeature?.properties?.divisionName ||
                    selectedFeature?.properties?.DIVISION_NAME ||
                    selectedFeature?.properties?.ST_NAME ||
                    'madhya-pradesh';
                loadDivisionData(divisionName);
                setCurrentLevel('division');
                break;
            case 'division':
                loadStateData();
                break;
            default:
                loadStateData();
                break;
        }
    };

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
                // Reset navigation history when going back to state level
                setNavigationHistory([]);
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
                            displayName: `${feature.properties.PC_NO}-${feature.properties.PC_NAME}`,
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
                            id: feature.properties.AC_NO.toString(), // Use AC_NO instead of PC_ID for assembly ID
                            name: feature.properties.AC_NAME,
                            displayName: `${feature.properties.AC_NO}-${feature.properties.AC_NAME} `,
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
                // Prefetch aggregated booth demographic counts for each block and cache under block_<id>
                (async () => {
                    try {
                        // Build a set of block names / identifiers to query
                        const blocks = transformedData.features.map(f => ({
                            id: f.properties.id,
                            name: f.properties.BlockName || f.properties.blockName || f.properties.name || f.properties.name || ''
                        })).filter(b => b.id && b.name);

                        if (blocks.length === 0) return;

                        // For each block, try to fetch booths by searching with block name (API supports search)
                        await Promise.all(blocks.map(async (blk) => {
                            const blockCacheKey = `block_${blk.id}`;
                            try {
                                const searchUrl = `${import.meta.env.VITE_APP_API_URL}/booths?search=${encodeURIComponent(blk.name)}`;
                                const resp = await fetch(searchUrl);
                                let booths = [];
                                if (resp.ok) {
                                    const body = await resp.json();
                                    booths = Array.isArray(body.data) ? body.data : [];
                                }

                                // Fallback: if search returned nothing, fetch all and match by blockName/BlockName/BlockNumber
                                if (booths.length === 0) {
                                    const allResp = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?limit=10000`);
                                    if (allResp.ok) {
                                        const allBody = await allResp.json();
                                        const candidates = Array.isArray(allBody.data) ? allBody.data : [];
                                        // match by block fields present in booth records
                                        booths = candidates.filter(c => {
                                            const bn = (c.blockName || c.BlockName || c.block || c.Block || '').toString().toLowerCase();
                                            return bn && blk.name.toLowerCase().includes(bn) || bn.includes(blk.name.toLowerCase());
                                        });
                                    }
                                }

                                // Aggregate counts
                                const agg = booths.reduce((acc, b) => {
                                    acc.male += Number(b.Male_Count || 0);
                                    acc.female += Number(b.Female_Count || 0);
                                    acc.others += Number(b.others_Count || 0);
                                    acc.total += Number(b.Total || 0);
                                    return acc;
                                }, { male: 0, female: 0, others: 0, total: 0 });

                                // If we found any booths, update hoverData; otherwise still set zeroed data to avoid repeated fetches
                                setHoverData(prev => {
                                    const newEntries = {};
                                    // primary key (raw id)
                                    newEntries[blockCacheKey] = {
                                        ...(prev[blockCacheKey] || {}),
                                        genderData: agg,
                                        boothCount: booths.length,
                                        blockName: blk.name,
                                        blockId: blk.id
                                    };
                                    try {
                                        // also set lowercased id key (some code lowercases ids)
                                        const lcId = String(blk.id).toLowerCase();
                                        newEntries[`block_${lcId}`] = {
                                            ...(prev[`block_${lcId}`] || {}),
                                            genderData: agg,
                                            boothCount: booths.length,
                                            blockName: blk.name,
                                            blockId: blk.id
                                        };
                                    } catch (e) {}
                                    try {
                                        // also set lowercased name key (popup sometimes uses name)
                                        const lcName = String(blk.name).toLowerCase();
                                        newEntries[`block_${lcName}`] = {
                                            ...(prev[`block_${lcName}`] || {}),
                                            genderData: agg,
                                            boothCount: booths.length,
                                            blockName: blk.name,
                                            blockId: blk.id
                                        };
                                    } catch (e) {}

                                    return {
                                        ...prev,
                                        ...newEntries
                                    };
                                });
                            } catch (err) {
                                console.warn('Block prefetch failed for', blk, err);
                            }
                        }));
                    } catch (err) {
                        console.warn('Block-level prefetch failed:', err);
                    }
                })();
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
                            name:
                                (feature.properties?.BoothName
                                    ? `${feature.properties.BoothName} - ${feature.properties.BoothNo || ''}`
                                    : feature.properties?.name
                                        ? `${feature.properties.name} (Booth No: ${feature.properties.BoothNo || ''})`
                                        : `Booth ${feature.properties?.BoothNo || index}`),
                            boothName: feature.properties?.BoothName || feature.properties?.name || '',
                            boothNo: feature.properties?.BoothNo || feature.properties?.boothNo || '',
                            blockName: feature.properties?.BlockName || feature.properties?.blockName || '',
                            blockNumber: feature.properties?.BlockNumber || BlockNumber,
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

            // Populate booth lookup cache for faster hover responses
            try {
                transformedData.features.forEach(f => {
                    const p = f.properties;
                    const boothNo = p.BoothNo || p.boothNo || p.booth_number || p.BoothNumber || p.id || p.BoothId;
                    if (boothNo !== undefined && boothNo !== null) {
                        boothLookupRef.current[String(boothNo)] = p;
                    }
                });
            } catch (err) {
                console.warn('Could not populate booth lookup cache:', err);
            }

            // Prefetch booth counts from backend for this block to avoid hover latency
            (async () => {
                try {
                    // Try to derive block name from polygon properties
                    const sampleProp = transformedData.features && transformedData.features[0] && transformedData.features[0].properties;
                    const blockName = sampleProp && (sampleProp.BlockName || sampleProp.blockName || sampleProp.Block || sampleProp.block) || '';
                    if (!blockName) return;

                    const searchUrl = `${import.meta.env.VITE_APP_API_URL}/booths?search=${encodeURIComponent(blockName)}`;
                    const resp = await fetch(searchUrl);
                    if (resp.ok) {
                        const body = await resp.json();
                        const booths = Array.isArray(body.data) ? body.data : [];
                        // Update lookup and hover cache for booths in this block
                        booths.forEach(b => {
                            const key = String(b.booth_number);
                            try { boothLookupRef.current[key] = b; } catch (e) {}
                            const cacheKey = `booth_${key}`;
                            const genderData = {
                                male: b.Male_Count || 0,
                                female: b.Female_Count || 0,
                                others: b.others_Count || 0,
                                total: b.Total || 0
                            };
                            setHoverData(prev => ({
                                ...prev,
                                [cacheKey]: {
                                    ...prev[cacheKey],
                                    genderData,
                                    boothData: b
                                }
                            }));
                        });
                    } else {
                        // fallback: fetch all booths and match by booth number present in transformedData
                        const allResp = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?limit=10000`);
                        if (!allResp.ok) return;
                        const allBody = await allResp.json();
                        const candidates = Array.isArray(allBody.data) ? allBody.data : [];
                        // build set of boothNos from transformedData
                        const boothNos = new Set(transformedData.features.map(f => String(f.properties.BoothNo || f.properties.boothNo || f.properties.booth_number || f.properties.BoothNumber || '')));
                        candidates.forEach(b => {
                            const bno = String(b.booth_number);
                            if (boothNos.has(bno)) {
                                try { boothLookupRef.current[bno] = b; } catch (e) {}
                                const cacheKey = `booth_${bno}`;
                                const genderData = {
                                    male: b.Male_Count || 0,
                                    female: b.Female_Count || 0,
                                    others: b.others_Count || 0,
                                    total: b.Total || 0
                                };
                                setHoverData(prev => ({
                                    ...prev,
                                    [cacheKey]: {
                                        ...prev[cacheKey],
                                        genderData,
                                        boothData: b
                                    }
                                }));
                            }
                        });
                    }
                } catch (err) {
                    console.warn('Prefetch booth counts failed:', err);
                }
            })();

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
                // Add permanent label - use displayName if available, otherwise name
                const labelText = feature.properties.displayName || feature.properties.name || '';
                layer.bindTooltip(labelText, {
                    permanent: true,
                    direction: 'center',
                    className: 'permanent-label',
                    offset: [0, 0],
                    opacity: 0.9
                });

                // Add popup with details — include hover class so hover styles apply
                const content = generatePopupContent(feature, level);
                layer.bindPopup(content, {
                    autoPan: false,
                    closeButton: false,
                    className: 'custom-popup custom-hover-popup'
                });

                // Click handler for drill-down — close any open popups first so only the clicked feature shows details
                layer.on('click', () => {
                    try { if (mapInstanceRef.current) mapInstanceRef.current.closePopup(); } catch (err) {}
                    handleLayerClick(feature, level);
                });

                // Hover-like behavior on mouseover with delayed close on mouseout so popup remains reachable
                layer.on({
                    mouseover: (e) => {
                        const target = e.target;

                        // Clear any pending close timer for this layer
                        try {
                            const id = target._leaflet_id;
                            if (closeTimersRef.current[id]) {
                                clearTimeout(closeTimersRef.current[id]);
                                delete closeTimersRef.current[id];
                            }
                        } catch (err) {}

                        // Highlight
                        target.setStyle({ weight: 3, color: '#666', fillOpacity: 0.3 });

                        // Fetch data for hover popup (same logic as before)
                        const featureId = feature.properties.id;
                        let cacheKey;
                        if (level === 'parliamentary') {
                            cacheKey = `${level}_${feature.properties.pcNo}`;
                        } else {
                            cacheKey = `${level}_${featureId}`;
                        }

                        if (level === 'assembly' || level === 'parliament' || level === 'booth' || level === 'block' || level === 'division' || level === 'state') {
                            const genderType = level === 'booth' ? 'booth' : (level === 'block' ? 'block' : (level === 'parliamentary' ? 'parliament' : level));
                            const genderId = level === 'assembly' ? feature.properties.id :
                                           (level === 'block' ? feature.properties.id :
                                           (level === 'parliamentary' ? feature.properties.pcNo : (feature.properties.id || feature.properties.Name || feature.properties.DIVISION_CODE)));

                            if (genderId && !hoverData[cacheKey]?.gender) {
                                fetchGenderData(genderType, genderId);
                            }
                        }

                        // Fetch block-specific gender data
                        if (level === 'block') {
                            // Try multiple possible ID fields for block, prefer name
                            const blockId = feature.properties.blockName || feature.properties.BlockName ||
                                          feature.properties.name || feature.properties.Name ||
                                          feature.properties.id || feature.properties.BlockId || feature.properties._id;
                            console.log('🏢 Block hover detected:', {
                                level,
                                blockId,
                                cacheKey,
                                hasExistingData: !!hoverData[cacheKey]?.genderData,
                                properties: feature.properties,
                                allPossibleIds: {
                                    blockName: feature.properties.blockName,
                                    BlockName: feature.properties.BlockName,
                                    name: feature.properties.name,
                                    Name: feature.properties.Name,
                                    id: feature.properties.id,
                                    BlockId: feature.properties.BlockId,
                                    _id: feature.properties._id
                                }
                            });
                            if (blockId && !hoverData[cacheKey]?.genderData) {
                                console.log('🚀 Triggering block gender fetch for:', blockId);
                                fetchBlockGenderData(blockId);
                            } else if (!blockId) {
                                console.warn('⚠️ No block ID found in properties:', feature.properties);
                            }
                        }

                        // Fetch booth-specific data from booth API
                        if (level === 'booth') {
                            // Use BoothNo from polygon data to match with booth_number in database
                            const boothId = feature.properties.BoothNo || feature.properties.boothNo || 
                                          feature.properties.booth_number || feature.properties.boothNumber || 
                                          feature.properties.booth_no || feature.properties.BoothNumber ||
                                          feature.properties.id || feature.properties.BoothId || feature.properties._id;
                            
                            // Create consistent cache key
                            const boothCacheKey = `booth_${boothId}`;
                            
                            console.log('🗳️ DEBUG: Booth hover detected:', {
                                level,
                                extractedBoothId: boothId,
                                originalCacheKey: cacheKey,
                                correctedCacheKey: boothCacheKey,
                                hasExistingData: !!hoverData[boothCacheKey]?.genderData,
                                hasExistingBoothData: !!hoverData[boothCacheKey]?.boothData,
                                primaryField_BoothNo: feature.properties.BoothNo,
                                allAvailableProperties: Object.keys(feature.properties),
                                fullProperties: feature.properties
                            });
                            
                            if (boothId && !hoverData[boothCacheKey]?.genderData) {
                                console.log('🚀 DEBUG: Triggering booth data fetch for booth number:', boothId, 'Cache key:', boothCacheKey);
                                fetchBoothGenderData(boothId);
                            } else if (!boothId) {
                                console.warn('⚠️ DEBUG: No booth ID found in properties. Available properties:', Object.keys(feature.properties));
                                console.warn('⚠️ DEBUG: Full properties object:', feature.properties);
                            } else {
                                console.log('✅ DEBUG: Booth data already exists for:', boothId, 'Data:', hoverData[boothCacheKey]);
                            }
                        }

                        if (level === 'assembly' || level === 'parliament' || level === 'division' || level === 'state') {
                            const winnerType = level === 'parliamentary' ? 'parliament' : level;
                            const winnerId = (winnerType === 'parliament') ? feature.properties.pcNo : (feature.properties.id || feature.properties.Name || feature.properties.DIVISION_CODE);
                            if (winnerId && !hoverData[cacheKey]?.winner) {
                                fetchWinningCandidateData(winnerType, winnerId);
                            }
                        }

                        // Fetch specific assembly data for electors and last 3 years winning party
                        if (level === 'assembly') {
                            const assemblyId = feature.properties.id;
                            
                            if (assemblyId && !hoverData[cacheKey]?.assemblyData) {
                                fetchAssemblyHoverData(assemblyId);
                            }
                        }

                        // Fetch parliament candidate data for parliamentary level
                        if (level === 'parliamentary') {
                            // Use pcNo (parliament number) for consistent matching
                            const parliamentId = feature.properties.pcNo || feature.properties.parliamentId || feature.properties.id;

                            if (parliamentId && !hoverData[cacheKey]?.parliamentCandidate) {
                                fetchParliamentCandidateData(parliamentId);
                            }
                        }

                        // Open popup (if not already open) — close other popups first so only this popup is visible
                        try {
                            if (mapInstanceRef.current) mapInstanceRef.current.closePopup();
                            target.openPopup();
                        } catch (err) {}
                    },
                    mouseout: (e) => {
                        const target = e.target;
                        // Delay closing to allow pointer to move into popup container
                        try {
                            const id = target._leaflet_id;
                            if (closeTimersRef.current[id]) {
                                clearTimeout(closeTimersRef.current[id]);
                            }
                            closeTimersRef.current[id] = setTimeout(() => {
                                try {
                                    if (target.closePopup) target.closePopup();
                                    if (currentLayerRef.current) currentLayerRef.current.resetStyle(target);
                                } catch (err) {}
                                delete closeTimersRef.current[id];
                            }, 300); // 300ms grace period
                        } catch (err) {}
                    }
                });

                // Manage popup DOM interactions so the popup remains when cursor enters it and supports scrolling
                layer.on('popupopen', (ev) => {
                    const popupEl = ev.popup && ev.popup._container;
                    const sourceLayer = ev.popup && ev.popup._source;
                    if (!popupEl) return;

                    // wheel handler to prevent map from intercepting scroll and allow popup scroll
                    const wheelHandler = (event) => {
                        event.stopPropagation();
                    };
                    popupEl.addEventListener('wheel', wheelHandler, { passive: false });

                    // When mouse enters popup, cancel any close timer for source layer
                    const enterHandler = () => {
                        try {
                            const id = sourceLayer && sourceLayer._leaflet_id;
                            if (id && closeTimersRef.current[id]) {
                                clearTimeout(closeTimersRef.current[id]);
                                delete closeTimersRef.current[id];
                            }
                            if (sourceLayer && sourceLayer.setStyle) sourceLayer.setStyle({ weight: 4, color: '#444', fillOpacity: 0.35 });
                        } catch (err) {}
                    };

                    // When mouse leaves popup, start close timer
                    const leaveHandler = () => {
                        try {
                            const id = sourceLayer && sourceLayer._leaflet_id;
                            if (id) {
                                if (closeTimersRef.current[id]) clearTimeout(closeTimersRef.current[id]);
                                closeTimersRef.current[id] = setTimeout(() => {
                                    try { ev.popup._close(); } catch (err) {}
                                    if (sourceLayer && currentLayerRef.current) currentLayerRef.current.resetStyle(sourceLayer);
                                    delete closeTimersRef.current[id];
                                }, 300);
                            }
                        } catch (err) {}
                    };

                    popupEl.addEventListener('mouseenter', enterHandler);
                    popupEl.addEventListener('mouseleave', leaveHandler);

                    // store handlers for removal
                    popupEl.__wheelHandler = wheelHandler;
                    popupEl.__enterHandler = enterHandler;
                    popupEl.__leaveHandler = leaveHandler;
                });

                layer.on('popupclose', (ev) => {
                    const popupEl = ev.popup && ev.popup._container;
                    const sourceLayer = ev.popup && ev.popup._source;
                    if (popupEl) {
                        if (popupEl.__wheelHandler) popupEl.removeEventListener('wheel', popupEl.__wheelHandler);
                        if (popupEl.__enterHandler) popupEl.removeEventListener('mouseenter', popupEl.__enterHandler);
                        if (popupEl.__leaveHandler) popupEl.removeEventListener('mouseleave', popupEl.__leaveHandler);
                        delete popupEl.__wheelHandler;
                        delete popupEl.__enterHandler;
                        delete popupEl.__leaveHandler;
                    }
                    // clear any pending timer for source layer
                    try {
                        const id = sourceLayer && sourceLayer._leaflet_id;
                        if (id && closeTimersRef.current[id]) {
                            clearTimeout(closeTimersRef.current[id]);
                            delete closeTimersRef.current[id];
                        }
                    } catch (err) {}
                });
            }
        }).addTo(mapInstanceRef.current);

        // Fit bounds to show all features
        mapInstanceRef.current.fitBounds(currentLayerRef.current.getBounds());
    };

    // Function to fetch gender data for hover
    const fetchGenderData = async (type, id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/genders/stats/${type}/${id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setHoverData(prev => ({
                        ...prev,
                        [`${type}_${id}`]: {
                            ...prev[`${type}_${id}`],
                            gender: data.data
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching gender data:', error);
        }
    };

    // Function to fetch winning candidate data for hover
    const fetchWinningCandidateData = async (type, id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates/stats/${type}/${id}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setHoverData(prev => ({
                        ...prev,
                        [`${type}_${id}`]: {
                            ...prev[`${type}_${id}`],
                            winner: data.data
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching winning candidate data:', error);
        }
    };

    // Function to fetch assembly specific data for hover (electors, male/female electors, last 3 years winning party)
    const fetchAssemblyHoverData = async (assemblyId) => {
        try {
            const apiUrl = `${import.meta.env.VITE_APP_API_URL}/winning-candidates/stats/assembly/${assemblyId}`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    setHoverData(prev => ({
                        ...prev,
                        [`assembly_${assemblyId}`]: {
                            ...prev[`assembly_${assemblyId}`],
                            assemblyData: {
                                electors: data.data.electors || 'N/A',
                                male_electors: data.data.male_electors || 'N/A',
                                female_electors: data.data.female_electors || 'N/A',
                                last3YearWinners: data.data.last3YearWinners || 'N/A',
                                totalVotes: data.data.totalVotes || 'N/A'
                            }
                        }
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching assembly hover data:', error);
        }
    };

    // Function to fetch parliament candidate data for hover
    const fetchParliamentCandidateData = async (parliamentId) => {
        try {
            const encodedId = encodeURIComponent(parliamentId);
            const url = `${import.meta.env.VITE_APP_API_URL}/parliament-candidates/stats/parliament/${encodedId}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const cacheKey = `parliamentary_${parliamentId}`;
                    setHoverData(prev => ({
                        ...prev,
                        [cacheKey]: {
                            ...prev[cacheKey],
                            parliamentCandidate: data.data
                        }
                    }));
                }
            } else {
                console.error('Failed to fetch parliament candidate data. Status:', response.status);
            }
        } catch (error) {
            console.error('Error fetching parliament candidate data:', error);
        }
    };

    // Function to fetch gender data for block hover
    const fetchBlockGenderData = async (blockId) => {
        try {
            const encodedId = encodeURIComponent(blockId);
            const url = `${import.meta.env.VITE_APP_API_URL}/genders/stats/block/${encodedId}`;
            console.log('🔍 Fetching block gender data for:', blockId, 'URL:', url);
            const response = await fetch(url);
            
            console.log('📡 Block gender response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 Block gender data received:', data);
                if (data.success) {
                    const cacheKey = `block_${blockId}`;
                    console.log('💾 Storing block gender data with key:', cacheKey, 'Data:', data.data);
                    setHoverData(prev => ({
                        ...prev,
                        [cacheKey]: {
                            ...prev[cacheKey],
                            genderData: data.data
                        }
                    }));
                } else {
                    console.warn('⚠️ Block gender API returned success: false', data);
                }
            } else {
                let errorText;
                try {
                    const errorJson = await response.json();
                    errorText = JSON.stringify(errorJson);
                } catch (e) {
                    errorText = await response.text();
                }
                console.error('❌ Failed to fetch block gender data. Status:', response.status, 'Error:', errorText);
                
                // If 404, likely means route not found or no matching block found
                if (response.status === 404) {
                    console.warn('🔍 Block API returned 404. Check if route exists and backend logs for details.');
                }
            }
        } catch (error) {
            console.error('💥 Error fetching block gender data:', error);
        }
    };

    // Function to fetch booth data directly from booth API
    const fetchBoothGenderData = async (boothId) => {
        try {
            // If we have polygon-derived properties cached for this booth, use them immediately
            try {
                const cachedPolygon = boothLookupRef.current[String(boothId)];
                if (cachedPolygon) {
                    const cacheKey = `booth_${boothId}`;
                    // populate hoverData quickly so popup can show immediate info while we fetch counts
                    setHoverData(prev => ({
                        ...prev,
                        [cacheKey]: {
                            ...prev[cacheKey],
                            boothData: cachedPolygon,
                            // no genderData yet; will be filled below
                        }
                    }));
                }
            } catch (err) {
                // non-fatal
            }
            // First try to get booth data by booth number
            const encodedId = encodeURIComponent(boothId);
            const url = `${import.meta.env.VITE_APP_API_URL}/booths?search=${encodedId}`;
            console.log('🔍 DEBUG: Fetching booth data for booth number:', boothId);
            console.log('🔍 DEBUG: API URL:', url);
            
            const response = await fetch(url);
            
            console.log('📡 DEBUG: Booth API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('📊 DEBUG: Booth API returned', data.total, 'total booths, showing', data.count, 'results');
                
                if (data.success && data.data && data.data.length > 0) {
                    console.log('🔍 DEBUG: Searching for booth with number:', boothId, 'Type:', typeof boothId);
                    console.log('🔍 DEBUG: Available booth numbers:', data.data.map(b => ({
                        booth_number: b.booth_number,
                        type: typeof b.booth_number,
                        matches_exact: b.booth_number === boothId,
                        matches_string: b.booth_number == boothId,
                        matches_toString: b.booth_number === boothId.toString(),
                        name: b.name
                    })));
                    
                    // Find the booth that matches our booth number
                    const matchingBooth = data.data.find(booth => 
                        booth.booth_number == boothId || 
                        booth.booth_number === boothId.toString()
                    );
                    
                    console.log('🎯 DEBUG: Matching booth found:', matchingBooth);
                    
                    if (matchingBooth) {
                        const cacheKey = `booth_${boothId}`;
                        // Transform booth API data to match expected gender data structure
                        const genderData = {
                            male: matchingBooth.Male_Count || 0,
                            female: matchingBooth.Female_Count || 0,
                            others: matchingBooth.others_Count || 0,
                            total: matchingBooth.Total || 0
                        };

                        // Update lookup cache too
                        try { boothLookupRef.current[String(matchingBooth.booth_number)] = matchingBooth; } catch (e) {}

                        // Update hoverData (this will overwrite any quick polygon-only entry)
                        setHoverData(prev => ({
                            ...prev,
                            [cacheKey]: {
                                ...prev[cacheKey],
                                genderData,
                                boothData: matchingBooth
                            }
                        }));
                    } else {
                        console.warn('⚠️ DEBUG: No booth found with booth number:', boothId);
                        console.log('📋 DEBUG: Available booths in result:', data.data.map(b => ({
                            booth_number: b.booth_number,
                            name: b.name
                        })));
                        
                        // Try fetching all booths to see what's available
                        console.log('🔍 DEBUG: Trying to fetch all booths to check database...');
                        const allBoothsUrl = `${import.meta.env.VITE_APP_API_URL}/booths?limit=10`;
                        const allBoothsResponse = await fetch(allBoothsUrl);
                        if (allBoothsResponse.ok) {
                            const allBoothsData = await allBoothsResponse.json();
                            console.log('📋 DEBUG: Sample booths from database:', allBoothsData.data?.slice(0, 5).map(b => ({
                                booth_number: b.booth_number,
                                name: b.name,
                                type_of_booth_number: typeof b.booth_number
                            })));
                        }
                    }
                } else if (data.success && data.total === 0) {
                    console.warn('⚠️ DEBUG: Search returned 0 results for booth number:', boothId);
                    // Fetch a larger set (or all) booths and try client-side matching to handle mismatched search behavior
                    try {
                        const allUrl = `${import.meta.env.VITE_APP_API_URL}/booths?limit=10000`;
                        console.log('🔍 DEBUG: Fetching all booths for client-side matching:', allUrl);
                        const allResp = await fetch(allUrl);
                        if (allResp.ok) {
                            const allData = await allResp.json();
                            const candidates = Array.isArray(allData.data) ? allData.data : [];
                            console.log('📋 DEBUG: Retrieved', candidates.length, 'booths for matching');

                            // Normalize boothId for matching
                            const boothIdStr = String(boothId).trim();
                            const boothIdNum = Number(boothIdStr);

                            const matchingBooth = candidates.find(b => {
                                // try numeric match
                                if (!isNaN(boothIdNum) && (Number(b.booth_number) === boothIdNum)) return true;
                                // string exact
                                if (String(b.booth_number) === boothIdStr) return true;
                                // substring in name or booth_number
                                if (b.name && String(b.name).toLowerCase().includes(boothIdStr.toLowerCase())) return true;
                                if (String(b.booth_number).toLowerCase().includes(boothIdStr.toLowerCase())) return true;
                                return false;
                            });

                            if (matchingBooth) {
                                const cacheKey = `booth_${boothId}`;
                                console.log('🎯 DEBUG: Client-side matched booth:', matchingBooth.booth_number, matchingBooth.name);
                                const genderData = {
                                    male: matchingBooth.Male_Count || 0,
                                    female: matchingBooth.Female_Count || 0,
                                    others: matchingBooth.others_Count || 0,
                                    total: matchingBooth.Total || 0
                                };
                                setHoverData(prev => ({
                                    ...prev,
                                    [cacheKey]: {
                                        ...prev[cacheKey],
                                        genderData,
                                        boothData: matchingBooth
                                    }
                                }));
                            } else {
                                console.warn('⚠️ DEBUG: No client-side match found for boothId:', boothId);
                            }
                        }
                    } catch (err) {
                        console.error('💥 DEBUG: Error fetching all booths for client-side matching:', err);
                    }
                } else {
                    console.warn('⚠️ DEBUG: Booth API returned unexpected structure:', data);
                }
            } else {
                let errorText;
                try {
                    const errorJson = await response.json();
                    errorText = JSON.stringify(errorJson);
                    console.log('❌ DEBUG: Error response JSON:', errorJson);
                } catch (e) {
                    errorText = await response.text();
                    console.log('❌ DEBUG: Error response text:', errorText);
                }
                console.error('❌ DEBUG: Failed to fetch booth data. Status:', response.status, 'Error:', errorText);
            }
        } catch (error) {
            console.error('� DEBUG: Error fetching booth data:', error);
            console.error('💥 DEBUG: Error stack:', error.stack);
        }
    };

    const handleLayerClick = (feature, level) => {
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
                const parliament = feature.properties.name
                    ? feature.properties.name
                    : null;

                if (parliament) {
                    loadParliamentaryData(parliament);
                    setCurrentLevel('parliamentary');
                } else {
                    console.warn('No Parliament found for division:', feature.properties.name);
                    alert('No parliamentary data available for this division. Staying at division level.');
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
                const BlockNumber = feature.properties.BlockNumber || feature.properties.blockNumber;
                if (BlockNumber) {
                    loadBoothData(BlockNumber);
                    setCurrentLevel('booth');
                } else {
                    console.warn('No Block number found in feature properties:', feature.properties);
                    alert('No booth data available for this block. Staying at block level.');
                }
                break;
            default:
                break;
        }
    };

    const generatePopupContent = (feature, level) => {
        const properties = feature.properties;
        const featureId = properties.id;

        // Create consistent cache key that matches how data is stored
        let cacheKey;
        if (level === 'parliamentary') {
            // Use pcNo (parliament number) for consistent matching
            const parliamentId = properties.pcNo || properties.parliamentId || properties.id;
            cacheKey = `${level}_${parliamentId}`;
        } else if (level === 'booth') {
            // For booth, use BoothNo from polygon data to match with booth_number in database
            const boothId = properties.BoothNo || properties.boothNo || 
                          properties.booth_number || properties.boothNumber || 
                          properties.booth_no || properties.BoothNumber ||
                          properties.id || properties.BoothId || properties._id;
            cacheKey = `booth_${boothId}`;
        } else if (level === 'block') {
            // For block, use name-based key like 'block_gandhwani'
            const blockId = properties.name || properties.Name || properties.id;
            cacheKey = `${level}_${blockId ? blockId.toLowerCase() : featureId}`;
        } else {
            cacheKey = `${level}_${featureId}`;
        }


        const data = hoverData[cacheKey] || {};
        
        // Debug logging to check cache key matching
        if (level === 'booth' || level === 'block') {
            console.log(`🔍 Popup cache lookup: ${level}`, {
                cacheKey,
                hasData: !!data.genderData,
                availableKeys: Object.keys(hoverData),
                dataFound: data
            });
        }

        // Build structured popup content using hover classes
        let content = `<div class="hover-popup-root">`;
        // Header
        let titleText;
        if (level === 'booth') {
            const boothData = data.boothData || {};
            const boothName = boothData.name || properties.BoothName || properties.name || properties.Name || '';
            const boothNumber = boothData.booth_number || properties.BoothNo || properties.boothNo || '';
            titleText = `${boothName}${boothNumber ? ` (Booth No: ${boothNumber})` : ''}`;
        } else {
            titleText = `${properties.Name || properties.name || ''}`;
        }
        content += `<div class="hover-header"><div class="hover-title">${titleText}</div><div class="hover-sub">${level.charAt(0).toUpperCase() + level.slice(1)}</div></div>`;
        content += `<div class="hover-body">`;

        switch (level) {
            case 'state':
                content += `
                    <p><strong>State Name:</strong> ${properties.Name || ''}</p>
                    <p><strong>Total Population:</strong> 5,61,36,229</p>
                    <p><strong>Male Count:</strong> 2,89,00,000</p>
                    <p><strong>Female count:</strong> 2,72,36,000</p>
                    <p><strong>Last 3 Year:</strong> 2023-BJP<br />2018-INC<br />2013-BJP</p>
                    
                    <div class="hover-stat" style="flex-basis:100%"><p style="font-size: 0.9em; color: #666; margin:0">Click to view Divisions</p></div>`;
                break;
            case 'division':
                const districts = properties.districts ? properties.districts.join(', ') : '';
                content += `
                    <p><strong>Division Code:</strong> ${properties.DIVISION_CODE || ''}</p>
                    <p><strong>State:</strong> ${properties.ST_NAME || ''}</p>
                    <p><strong>Total Electors</strong> 5,65,95.333</p>
                    <p><strong>Male Count:</strong> 2,82,97,673</p>
                    <p><strong>Male Count:</strong> ${properties.ST_NAME || ''}</p>
                    <p><strong>last 3 year winning party</strong> ${properties.ST_NAME || ''}</p>
                    
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
                // Use parliament candidate data if available, otherwise fallback to existing data
                const pcData = data.parliamentCandidate || {};

                content += `
                    <p><strong>Parliamentary Constituency:</strong> ${properties.name || ''}</p>
                    <p><strong>PC Number:</strong> ${properties.pcNo || ''}</p>
                    <p><strong>Division:</strong> ${properties.divisionName || ''}</p>
                    <p><strong>Last Election Year:</strong> ${pcData.electionYear || properties.lastElectionYear || ''}</p>
                    <div class="hover-stat"><b>Electors</b><span>${pcData.electors ? Number(pcData.electors).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Male Electors</b><span>${pcData.male_electors ? Number(pcData.male_electors).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Female Electors</b><span>${pcData.female_electors ? Number(pcData.female_electors).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Total Votes</b><span>${pcData.totalVotes ? Number(pcData.totalVotes).toLocaleString() : (data.winner?.totalVotes ? Number(data.winner.totalVotes).toLocaleString() : 'N/A')}</span></div>
                    <div class="hover-stat"><b>Seat Reservation</b><span>${properties.seatReservation || properties.category || 'N/A'}</span></div>
                    <div class="hover-stat" style="flex-basis:100%"><b>Last 3 Year Winner Party</b><span>${pcData.last3YearWinner || data.winner?.last3YearWinner || properties.winner || 'N/A'}</span></div>`;
                break;
            case 'assembly':
                const assemblyData = data.assemblyData || {};
                // console.log('🏛️ Generating assembly popup for:', properties.name);
                // console.log('🏛️ Available assembly data:', assemblyData);
                // console.log('🏛️ Available data object:', data);
                
                content += `
                    <p><strong>Assembly Constituency:</strong> ${properties.name || ''}</p>
                    <p><strong>AC No:</strong> ${properties.acNo || ''}</p>
                    <p><strong>Parliamentary:</strong> ${properties.pcName || ''}</p>
                    <p><strong>Category:</strong> ${properties.category || ''}</p>
                    <div class="hover-stat"><b>Electors</b><span>${assemblyData.electors && assemblyData.electors !== 'N/A' ? Number(assemblyData.electors).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Male Electors</b><span>${assemblyData.male_electors && assemblyData.male_electors !== 'N/A' ? Number(assemblyData.male_electors).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Female Electors</b><span>${assemblyData.female_electors && assemblyData.female_electors !== 'N/A' ? Number(assemblyData.female_electors).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Total Votes</b><span>${data.winner?.totalVotes ? Number(data.winner.totalVotes).toLocaleString() : properties.totalVotes ? Number(properties.totalVotes).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Seat Reservation</b><span>${properties.seatReservation || properties.category || 'N/A'}</span></div>
                    <div class="hover-stat" style="flex-basis:100%"><b>Last 3 Years Winning Party</b><span>${assemblyData.last3YearWinners || 'N/A'}</span></div>`;
                break;
            case 'block':
                const blockGenderData = data.genderData || {};
                if (blockGenderData.male || blockGenderData.female) {
                    console.log('✅ Block gender data found:', blockGenderData);
                }
                content += `
                    <p><strong>Block Code:</strong> ${properties.blockCode || ''}</p>
                    <p><strong>Assembly:</strong> ${properties.acName || ''}</p>
                    <p><strong>Main Town:</strong> ${properties.mainTown || ''}</p>
                    <div class="hover-stat"><b>Male</b><span>${blockGenderData.male ? Number(blockGenderData.male).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Female</b><span>${blockGenderData.female ? Number(blockGenderData.female).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Total</b><span>${blockGenderData.total ? Number(blockGenderData.total).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat" style="flex-basis:100%"><b>Booths</b><span>Total: ${properties.totalBooths || ''} — Rural: ${properties.ruralBooths || ''} — Urban: ${properties.urbanBooths || ''}</span></div>`;
                break;
            case 'booth':
                const boothGenderData = data.genderData || {};
                const boothData = data.boothData || {}; // Additional booth data from API
                
                console.log('🎨 DEBUG: Generating booth popup content:', {
                    cacheKey,
                    hasGenderData: !!boothGenderData.male || !!boothGenderData.female,
                    genderData: boothGenderData,
                    hasBoothData: Object.keys(boothData).length > 0,
                    boothData: boothData,
                    properties: properties,
                    fullDataObject: data
                });
                
                // Use booth data from API if available, otherwise fall back to polygon properties
                const boothName = boothData.name || properties.BoothName || properties.boothName || '';
                const boothNumber = boothData.booth_number || properties.BoothNo || properties.boothNo || '';
                const blockName = boothData.block_id?.name || properties.BlockName || properties.blockName || '';
                const assemblyName = boothData.assembly_id?.name || properties.AC_NAME || '';
                const fullAddress = boothData.full_address || properties.location || '';
                
                console.log('🏗️ DEBUG: Booth popup display values:', {
                    boothName,
                    boothNumber,
                    blockName,
                    assemblyName,
                    fullAddress,
                    maleCount: boothGenderData.male,
                    femaleCount: boothGenderData.female,
                    othersCount: boothGenderData.others,
                    totalCount: boothGenderData.total
                });
                
                content += `
                    <p><strong>Booth Name:</strong> ${boothName}</p>
                    <p><strong>Booth No:</strong> ${boothNumber}</p>
                    <p><strong>Block:</strong> ${blockName}</p>
                    <p><strong>Assembly:</strong> ${assemblyName}</p>
                    <p><strong>Address:</strong> ${fullAddress}</p>
                    <div class="hover-stat"><b>Male Count</b><span>${boothGenderData.male ? Number(boothGenderData.male).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Female Count</b><span>${boothGenderData.female ? Number(boothGenderData.female).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Others Count</b><span>${boothGenderData.others ? Number(boothGenderData.others).toLocaleString() : 'N/A'}</span></div>
                    <div class="hover-stat"><b>Total Count</b><span>${boothGenderData.total ? Number(boothGenderData.total).toLocaleString() : 'N/A'}</span></div>`;
                break;
        }

        // Close body and root wrappers
        content += `</div></div>`;
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
                        {/* Back Button - Only show if not at state level */}
                        {currentLevel !== 'state' && (
                            <button
                                onClick={handleBackNavigation}
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
                                title="Go back to previous level"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </button>
                        )}
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
                        <div style={{
                            padding: '8px',
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontWeight: '500' }}>
                                    {selectedFeature ?
                                        `Current: ${selectedFeature.properties.name} (${currentLevel})` :
                                        `Level: ${currentLevel}`
                                    }
                                </span>
                            </div>

                            {/* Level Navigation Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '12px', color: '#666' }}>Navigate to:</span>

                                {/* State Button */}
                                {currentLevel !== 'state' && (
                                    <button
                                        onClick={() => {
                                            loadStateData();
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: currentLevel === 'state' ? '#007bff' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        State
                                    </button>
                                )}

                                {/* Division Button */}
                                {currentLevel !== 'state' && currentLevel !== 'division' && selectedFeature && (
                                    <button
                                        onClick={() => {
                                            if (selectedFeature.properties.divisionName || selectedFeature.properties.ST_NAME) {
                                                loadDivisionData(selectedFeature.properties.divisionName || selectedFeature.properties.ST_NAME || 'madhya-pradesh');
                                                setCurrentLevel('division');
                                            } else {
                                                loadStateData();
                                            }
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: currentLevel === 'division' ? '#007bff' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Division
                                    </button>
                                )}

                                {/* Parliamentary Button */}
                                {(currentLevel === 'assembly' || currentLevel === 'block' || currentLevel === 'booth') && selectedFeature && (
                                    <button
                                        onClick={() => {
                                            // Try multiple property combinations for parliamentary navigation
                                            const parliamentName = selectedFeature.properties.pcName ||
                                                selectedFeature.properties.PC_NAME ||
                                                selectedFeature.properties.divisionName ||
                                                selectedFeature.properties.DIVISION_NAME ||
                                                'Default';
                                            loadParliamentaryData(parliamentName);
                                            setCurrentLevel('parliamentary');
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: currentLevel === 'parliamentary' ? '#007bff' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Parliamentary
                                    </button>
                                )}

                                {/* Assembly Button */}
                                {(currentLevel === 'block' || currentLevel === 'booth') && selectedFeature && (
                                    <button
                                        onClick={() => {
                                            // Try multiple property combinations for assembly navigation
                                            const assemblyCode = selectedFeature.properties.pcNo ||
                                                selectedFeature.properties.PC_NO ||
                                                selectedFeature.properties.acNo ||
                                                selectedFeature.properties.AC_NO ||
                                                'PC001';
                                            loadAssemblyData(assemblyCode);
                                            setCurrentLevel('assembly');
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: currentLevel === 'assembly' ? '#007bff' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Assembly
                                    </button>
                                )}

                                {/* Block Button */}
                                {currentLevel === 'booth' && selectedFeature && (
                                    <button
                                        onClick={() => {
                                            // Try multiple property combinations for block navigation
                                            const blockCode = selectedFeature.properties.acNo ||
                                                selectedFeature.properties.AC_NO ||
                                                selectedFeature.properties.blockNumber ||
                                                selectedFeature.properties.BlockNumber ||
                                                'AC001';
                                            loadBlockData(blockCode);
                                            setCurrentLevel('block');
                                        }}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: currentLevel === 'block' ? '#007bff' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        Block
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainCard>
    );
};

export default HierarchicalMap;
