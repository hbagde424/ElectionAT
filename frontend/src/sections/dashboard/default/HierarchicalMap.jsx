import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot, faExpand, faCompress, faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons';
import MainCard from 'components/MainCard';
import { useNavigate } from 'react-router-dom';
import { 
    Drawer, 
    Box, 
    Typography, 
    Stack, 
    Divider, 
    Paper, 
    Accordion, 
    AccordionSummary, 
    AccordionDetails, 
    List, 
    ListItem, 
    ListItemAvatar, 
    ListItemText, 
    Avatar, 
    Chip, 
    Button, 
    Skeleton,
    useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import FlagIcon from '@mui/icons-material/Flag';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import GroupIcon from '@mui/icons-material/Group';
import ConstructionIcon from '@mui/icons-material/Construction';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

// Add custom styles for permanent labels and sliding panel
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
    /* Tooltip Styles */
    .custom-tooltip {
        background: rgba(0,0,0,0.8) !important;
        color: white !important;
        border: none !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        padding: 4px 8px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
    }
    .custom-tooltip:before {
        border-top-color: rgba(0,0,0,0.8) !important;
    }
    /* Sliding Panel Styles */
    .sliding-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100vh;
        background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
        box-shadow: -4px 0 20px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
        z-index: 1001;
        overflow-y: auto;
        border-left: 1px solid rgba(0,0,0,0.1);
    }
    .sliding-panel.open {
        transform: translateX(0);
    }
    .panel-header {
        padding: 20px;
        border-bottom: 1px solid rgba(0,0,0,0.1);
        background: linear-gradient(90deg, rgba(0,123,255,0.08), rgba(0,200,83,0.02));
        position: sticky;
        top: 0;
        z-index: 10;
    }
    .panel-title { 
        font-weight: 700; 
        color: #222; 
        margin: 0; 
        font-size: 18px;
        margin-bottom: 5px;
    }
    .panel-subtitle { 
        color: #666; 
        font-size: 14px; 
        margin: 0;
        text-transform: capitalize;
    }
    .panel-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 5px;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .panel-close:hover {
        background-color: rgba(0,0,0,0.1);
        color: #333;
    }
    .panel-body { 
        padding: 20px;
        line-height: 1.6;
    }
    .panel-section {
        margin-bottom: 25px;
        padding: 15px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .panel-section h4 {
        margin: 0 0 15px 0;
        color: #333;
        font-size: 16px;
        font-weight: 600;
        border-bottom: 2px solid #e0e0e0;
        padding-bottom: 8px;
    }
    .panel-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 15px;
    }
    .panel-info-item {
        display: flex;
        flex-direction: column;
    }
    .panel-info-label {
        font-size: 12px;
        color: #666;
        font-weight: 500;
        margin-bottom: 3px;
    }
    .panel-info-value {
        font-size: 14px;
        color: #333;
        font-weight: 600;
    }
    .panel-list {
        margin: 10px 0;
        padding: 0;
        max-height: 200px;
        overflow-y: auto;
    }
    .panel-list li {
        list-style: none;
        padding: 8px 12px;
        margin: 5px 0;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 13px;
        border-left: 3px solid #007bff;
    }
    .panel-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.3);
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
    }
    .panel-overlay.open {
        opacity: 1;
        visibility: visible;
    }
    /* Panel Content Styles */
    .panel-sections {
        padding: 20px;
    }
    .panel-section {
        margin-bottom: 25px;
        padding: 18px;
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        border-left: 4px solid #007bff;
    }
    .section-title {
        font-weight: 600;
        color: #333;
        margin: 0 0 15px 0;
        font-size: 16px;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
    }
    .section-items {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }
    .section-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 8px 0;
        border-bottom: 1px solid #f5f5f5;
    }
    .section-item:last-child {
        border-bottom: none;
    }
    .item-label {
        font-weight: 500;
        color: #555;
        flex: 1;
        margin-right: 15px;
        font-size: 14px;
    }
    .item-value {
        font-weight: 400;
        color: #333;
        text-align: right;
        flex: 1;
        font-size: 14px;
    }
    .section-list ul {
        list-style: none;
        padding: 0;
        margin: 10px 0 0 0;
    }
    .section-list li {
        padding: 8px 12px;
        margin: 5px 0;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 3px solid #28a745;
        font-size: 14px;
        color: #333;
    }
    .panel-close-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        padding: 5px;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }
    .panel-close-btn:hover {
        background-color: rgba(0,0,0,0.1);
        color: #333;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;


function HierarchicalMap({ onRegionClick }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const currentLayerRef = useRef(null);
    const boothLookupRef = useRef({}); // in-memory lookup: booth_number -> booth data
    const prefetchingBlocksRef = useRef(new Set());
    const navigate = useNavigate();
    const theme = useTheme();
    const [currentLevel, setCurrentLevel] = useState('state');
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [hoverData, setHoverData] = useState({}); // Store fetched data for hover
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelData, setPanelData] = useState({});
    const [panelLevel, setPanelLevel] = useState('');
    const [isPanelLoading, setIsPanelLoading] = useState(false);
    const [boothAggregates, setBoothAggregates] = useState(null);
    const [boothAggregatesLoading, setBoothAggregatesLoading] = useState(false);
    const [selectedBoothDetails, setSelectedBoothDetails] = useState(null);
    const closeTimersRef = useRef({}); // store close timers by layer id to delay popup close

    // Helper to capitalize first letter for UI display (keeps internal state values lowercase)
    const capitalize = (s) => {
        if (!s || typeof s !== 'string') return s;
        return s.charAt(0).toUpperCase() + s.slice(1);
    };
    // Helper to add Authorization header when token exists
    const getAuthHeaders = () => {
        try {
            const token = localStorage.serviceToken;
            return token ? { Authorization: `Bearer ${token}` } : {};
        } catch (err) {
            return {};
        }
    };

    // Helper to extract entity ID from various shapes
    const getEntityId = (it) => {
        if (!it) return null;
        
        // Direct ID fields
        if (it._id && typeof it._id === 'string') return it._id;
        if (it.id && typeof it.id === 'string') return it.id;
        
        // Check for *_id fields that might be strings or objects
        const idKeys = Object.keys(it).filter(k => k.endsWith('_id') || k.endsWith('Id'));
        for (const k of idKeys) {
            const val = it[k];
            if (typeof val === 'string' && val) return val;
            if (val && typeof val === 'object' && val._id && typeof val._id === 'string') return val._id;
            if (val && typeof val === 'object' && val.id && typeof val.id === 'string') return val.id;
        }
        
        // Nested data/document
        if (it.data && typeof it.data === 'object') return getEntityId(it.data);
        if (it.document && typeof it.document === 'object') return getEntityId(it.document);
        
        console.warn('⚠️ Could not extract entity ID from:', it);
        return null;
    };

    // Fetch aggregated per-booth datasets in parallel
    const fetchBoothAggregates = async (boothId, boothNumber) => {
        if (!boothId) return;
        const base = import.meta.env.VITE_APP_API_URL;
        const headers = getAuthHeaders();
        setBoothAggregatesLoading(true);
        setBoothAggregates(null);
        
        console.log('🚀 fetchBoothAggregates called with:', { boothId, boothNumber });
        console.log('🌐 API Base URL:', base);
        
        try {
            const boothIdEnc = encodeURIComponent(boothId);
            console.log('📡 Making API calls with booth_id:', boothIdEnc);
            
            const results = await Promise.allSettled([
                fetch(`${base}/events?booth=${boothIdEnc}&all=true`, { headers }).then(r => {
                    console.log('📅 Events API response status:', r.status, 'URL:', `${base}/events?booth=${boothIdEnc}&all=true`);
                    return r.ok ? r.json() : {};
                }),
                fetch(`${base}/party-activities?booth=${boothIdEnc}&all=true`, { headers }).then(r => r.ok ? r.json() : {}),
                fetch(`${base}/visits?booth=${boothIdEnc}&all=true`, { headers }).then(r => r.ok ? r.json() : {}),
                fetch(`${base}/influencers?booth=${boothIdEnc}&all=true`, { headers }).then(r => r.ok ? r.json() : {}),
                // Volunteers: try multiple endpoints (matching BoothMap)
                Promise.race([
                    fetch(`${base}/booth-volunteers?booth_id=${boothIdEnc}&all=true`, { headers }).then(r => r.ok ? r.json() : {}),
                    fetch(`${base}/booth-volunteers?booth=${boothIdEnc}&all=true`, { headers }).then(r => r.ok ? r.json() : {}),
                    fetch(`${base}/booth-volunteers/booth/${boothIdEnc}`, { headers }).then(r => r.ok ? r.json() : {})
                ]),
                fetch(`${base}/genders/booth/${boothIdEnc}`, { headers }).then(r => r.ok ? r.json() : {}),
                fetch(`${base}/governments?booth=${boothIdEnc}&all=true`, { headers }).then(r => r.ok ? r.json() : {}),
                fetch(`${base}/local-issues?booth=${boothIdEnc}&all=true`, { headers }).then(r => {
                    console.log('⚠️ Local Issues API response status:', r.status, 'URL:', `${base}/local-issues?booth=${boothIdEnc}&all=true`);
                    return r.ok ? r.json() : {};
                }),
                fetch(`${base}/samitis?booth_id=${boothIdEnc}&limit=100`, { headers }).then(r => r.ok ? r.json() : {}),
                fetch(`${base}/work-status/booth/${boothIdEnc}`, { headers }).then(r => r.ok ? r.json() : {}),
                fetch(`${base}/winning-parties?booth=${boothIdEnc}&all=true`, { headers }).then(r => r.ok ? r.json() : {}),
                fetch(`${base}/booth-votes/booth/${boothIdEnc}`, { headers }).then(r => {
                    console.log('🗳️ Booth Votes API response status:', r.status, 'URL:', `${base}/booth-votes/booth/${boothIdEnc}`);
                    return r.ok ? r.json() : {};
                })
            ]);

            const normalize = (res) => {
                if (res.status === 'rejected') return [];
                const v = res.value;
                if (Array.isArray(v)) return v;
                if (v?.data && Array.isArray(v.data)) return v.data;
                if (v?.features && Array.isArray(v.features)) return v.features;
                return [];
            };

            const events = normalize(results[0]);
            const partyActivities = normalize(results[1]);
            const visits = normalize(results[2]);
            const influencers = normalize(results[3]);
            const volunteers = normalize(results[4]);
            const genderArr = normalize(results[5]);
            const governments = normalize(results[6]);
            const localIssues = normalize(results[7]);
            const samitis = normalize(results[8]);
            const workStatuses = normalize(results[9]);
            const winningParties = normalize(results[10]);
            const boothVotes = normalize(results[11]);
            
            console.log('📊 Aggregates fetched:', {
                events: events.length,
                partyActivities: partyActivities.length,
                visits: visits.length,
                influencers: influencers.length,
                volunteers: volunteers.length,
                governments: governments.length,
                localIssues: localIssues.length,
                samitis: samitis.length,
                workStatuses: workStatuses.length,
                winningParties: winningParties.length,
                boothVotes: boothVotes.length
            });

            const genderData = genderArr[0] || {};
            const gender = {
                male: genderData.Male_Count || genderData.male || 0,
                female: genderData.Female_Count || genderData.female || 0,
                others: genderData.others_Count || genderData.others || 0,
                total: genderData.Total || genderData.total || 0
            };

            const workSummary = {
                total: workStatuses.length,
                completed: workStatuses.filter(w => (w.status || '').toLowerCase().includes('complete')).length,
                inProgress: workStatuses.filter(w => (w.status || '').toLowerCase().includes('progress')).length,
                pending: workStatuses.filter(w => (w.status || '').toLowerCase().includes('pending')).length
            };

            setBoothAggregates({
                events,
                partyActivities,
                visits,
                influencers,
                volunteers,
                gender,
                governments,
                localIssues,
                samitis,
                workStatuses,
                workSummary,
                winningParties,
                boothVotes
            });
        } catch (err) {
            console.error('Fetch booth aggregates error:', err);
        } finally {
            setBoothAggregatesLoading(false);
        }
    };

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

    // Update panel data when hoverData changes and panel is open
    useEffect(() => {
        if (isPanelOpen && panelData.feature && panelLevel) {
            const properties = panelData.feature.properties;
            const featureId = properties.id;
            let cacheKey;
            
            if (panelLevel === 'parliamentary') {
                const parliamentId = properties.pcNo || properties.parliamentId || properties.parliament_no || properties.id;
                cacheKey = `${panelLevel}_${parliamentId}`;
            } else if (panelLevel === 'assembly') {
                const assemblyId = properties.AC_NO || properties.acNo || properties.assembly_no || properties.assemblyNo || properties.id;
                cacheKey = `${panelLevel}_${assemblyId}`;
            } else if (panelLevel === 'booth') {
                const boothId = properties.BoothNo || properties.boothNo || 
                              properties.booth_number || properties.boothNumber || 
                              properties.booth_no || properties.BoothNumber ||
                              properties.id || properties.BoothId || properties._id;
                cacheKey = `booth_${boothId}`;
            } else if (panelLevel === 'block') {
                const blockId = properties.name || properties.Name || properties.id;
                cacheKey = `${panelLevel}_${blockId ? blockId.toLowerCase() : featureId}`;
            } else {
                cacheKey = `${panelLevel}_${featureId}`;
            }

            const updatedData = hoverData[cacheKey];
            if (updatedData && Object.keys(updatedData).length > 0) {
                console.log('📦 Panel data updating with cache key:', cacheKey, 'Data:', updatedData);
                setPanelData({
                    feature: panelData.feature,
                    level: panelLevel,
                    data: updatedData
                });
                // Stop loading when data arrives
                setIsPanelLoading(false);
            }
        }
    }, [hoverData, isPanelOpen, panelLevel, panelData.feature]);

    useEffect(() => {
        // Add custom styles to document
        const styleElement = document.createElement('style');
        styleElement.textContent = customStyles;
        document.head.appendChild(styleElement);

        // Log API configuration
        console.log('🌐 HierarchicalMap API Configuration:');
        console.log('  API URL:', import.meta.env.VITE_APP_API_URL);
        console.log('  Mode:', import.meta.env.MODE);
        console.log('  Base Name:', import.meta.env.VITE_APP_BASE_NAME);

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

            }
        } catch (error) {

        }
    };

    // Parliamentary data will be fetched from API
    const loadParliamentaryData = async (divisionName) => {
        try {
            console.log('🔍 Loading parliamentary data for division:', divisionName);
            
            // Handle special case: "Indore" in division polygons but "INDORE" in parliament polygons
            // Database has inconsistent casing - only "INDORE" is all caps, rest are proper case
            const normalizedDivisionName = divisionName === 'Indore' ? 'INDORE' : divisionName;
            
            console.log(`� Normalized division name: "${normalizedDivisionName}"`);
            
            const apiUrl = `${import.meta.env.VITE_APP_API_URL}/parliament-polygons/name/${encodeURIComponent(normalizedDivisionName)}`;
            console.log('🌐 API URL:', apiUrl);
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('❌ API Response not OK:', response.status, response.statusText);
                throw new Error(`Failed to fetch parliamentary data: ${response.status} ${response.statusText}`);
            }
            const responseData = await response.json();
            console.log('📦 API Response:', responseData);

            if (responseData && responseData.length > 0 && responseData[0].features && responseData[0].features.length > 0) {
                const parliamentData = responseData[0];
                console.log(`✅ Found ${parliamentData.features.length} parliamentary constituencies`);
                
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

                showBoundaries(transformedData, 'parliamentary');
                setCurrentLevel('parliamentary');
            } else {
                console.error('❌ No parliamentary constituencies found for division:', normalizedDivisionName);
                console.warn('💡 Database has these exact division names: Bhopal, Chambal, Gwalior, INDORE, Jabalpur, Narmadapuram, Rewa, Sagar, Shahdol, Ujjain');
                alert(`No parliamentary constituencies found for division: ${divisionName}\n\nNote: Only "INDORE" is in all caps in database, rest are proper case.\n\nPlease check if parliament polygon data exists for this division.`);
            }
        } catch (error) {
            console.error('❌ Error loading parliamentary data:', error);
            alert(`Error loading parliamentary data for ${divisionName}: ${error.message}`);
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
            console.log('🔍 Loading assembly data for parliament code:', vsCode);
            const apiUrl = `${import.meta.env.VITE_APP_API_URL}/assembly-polygons/parliament/${vsCode}`;
            console.log('🌐 API URL:', apiUrl);
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                console.error('❌ API Response not OK:', response.status, response.statusText);
                throw new Error(`Failed to fetch assembly data: ${response.status} ${response.statusText}`);
            }

            const assemblies = await response.json();
            console.log('📦 API Response:', assemblies);
            
            if (assemblies && assemblies.data && assemblies.data[0] && assemblies.data[0].type === "FeatureCollection" && assemblies.data[0].features && assemblies.data[0].features.length > 0) {
                console.log(`✅ Found ${assemblies.data[0].features.length} assembly constituencies`);
                
                const transformedData = {
                    type: 'FeatureCollection',
                    features: assemblies.data[0].features.map(feature => {
                        const acNoValue = feature.properties.AC_NO;
                        console.log(`🔄 Transforming assembly: ${feature.properties.AC_NAME}, AC_NO:`, acNoValue, typeof acNoValue);
                        
                        return {
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
                        };
                    })
                };

                showBoundaries(transformedData, 'assembly');
                setCurrentLevel('assembly');
            } else {
                console.warn('⚠️ No assembly constituencies found for parliament code:', vsCode);
                alert(`No assembly constituencies found for parliament code: ${vsCode}\n\nPlease check if assembly polygon data exists in the database.`);
            }
        } catch (error) {
            console.error('❌ Error loading assembly data:', error);
            alert(`Error loading assembly data: ${error.message}`);
        }
    };

    // Block data will be fetched from API
    const loadBlockData = async (assemblyId) => {
        try {
            console.log('🔍 Loading block data for assembly AC_NO:', assemblyId);
            const apiUrl = `${import.meta.env.VITE_APP_API_URL}/block-polygons/booth/${assemblyId}`;
            console.log('🌐 API URL:', apiUrl);
            
            const response = await fetch(apiUrl);
            console.log('📡 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                console.error('❌ API Response not OK:', response.status, response.statusText);
                throw new Error('Failed to fetch block data');
            }
            const responseData = await response.json();
            console.log('📦 Block API Response:', responseData);
            console.log('📊 Features count:', responseData.data?.[0]?.features?.length || 0);
            
            if (responseData.success && responseData.data && responseData.data.length > 0) {
                console.log('✅ Block data found, transforming...');
                const transformedData = {
                    type: 'FeatureCollection',
                    features: responseData.data[0].features.map((feature, index) => {
                        // Generate proper block name and ID
                        const blockNumber = feature.properties.BlockNumber || (index + 1);
                        const acName = feature.properties.AC_NAME || 'Unknown';
                        const blockName = feature.properties.BlockName || `Block ${blockNumber} - ${acName}`;
                        const blockId = feature.properties.uuid || 
                                       `block-${feature.properties.AC_NO}-${blockNumber}`;
                        
                        console.log(`📦 Processing block: ${blockName}, ID: ${blockId}, BlockNumber: ${blockNumber}`);
                        
                        return {
                            type: 'Feature',
                            properties: {
                                ...feature.properties,
                                id: blockId,
                                name: blockName,
                                blockCode: String(blockNumber),
                                BlockNumber: blockNumber, // Keep original for navigation
                                acName: acName,
                                mainTown: feature.properties.DIST_NAME || feature.properties.ST_NAME,
                                population: null,
                                totalVoters: null,
                                totalBooths: 1,
                                ruralBooths: feature.properties.BoothName ? 1 : 0,
                                urbanBooths: 0
                            },
                            geometry: feature.geometry
                        };
                    })
                };
                showBoundaries(transformedData, 'block');
                console.log(`✅ Successfully loaded ${transformedData.features.length} blocks for AC_NO: ${assemblyId}`);
                
                // Prefetch aggregated booth demographic counts for each block and cache under block_<id>
                (async () => {
                    try {
                        // Build a set of block identifiers to query
                        const blocks = transformedData.features.map(f => ({
                            id: f.properties.id,
                            name: f.properties.name || `Block ${f.properties.BlockNumber}`,
                            blockNumber: f.properties.BlockNumber,
                            acNo: f.properties.AC_NO
                        })).filter(b => b.id);

                        console.log(`🔍 Prefetching booth data for ${blocks.length} blocks...`);

                        if (blocks.length === 0) return;
                        
                        // For each block, try to fetch booths by AC_NO and BlockNumber
                        await Promise.all(blocks.map(async (blk) => {
                            const blockCacheKey = `block_${blk.id}`;
                            try {
                                // Try to find booths by assembly_no and block_number
                                const searchUrl = `${import.meta.env.VITE_APP_API_URL}/booths?assembly_no=${blk.acNo}&limit=1000`;
                                console.log(`🌐 Fetching booths for block ${blk.name}:`, searchUrl);
                                
                                const resp = await fetch(searchUrl);
                                let booths = [];
                                if (resp.ok) {
                                    const body = await resp.json();
                                    booths = Array.isArray(body.data) ? body.data : [];
                                    
                                    // Filter by BlockNumber if we have it
                                    if (blk.blockNumber && booths.length > 0) {
                                        booths = booths.filter(b => {
                                            const boothBlockNum = b.block_number || b.BlockNumber || b.blockNumber;
                                            return boothBlockNum == blk.blockNumber;
                                        });
                                    }
                                    
                                    console.log(`✅ Found ${booths.length} booths for block ${blk.name}`);
                                }

                                // Fallback: if no booths found, try matching by block number
                                if (booths.length === 0 && blk.blockNumber) {
                                    console.log(`⚠️ No booths found for block ${blk.name}, trying fallback...`);
                                    const allResp = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?limit=10000`);
                                    if (allResp.ok) {
                                        const allBody = await allResp.json();
                                        const candidates = Array.isArray(allBody.data) ? allBody.data : [];
                                        // Match by AC_NO and block number
                                        booths = candidates.filter(c => {
                                            const boothAcNo = c.assembly_no || c.AC_NO || c.acNo;
                                            const boothBlockNum = c.block_number || c.BlockNumber || c.blockNumber;
                                            return boothAcNo == blk.acNo && boothBlockNum == blk.blockNumber;
                                        });
                                        console.log(`📊 Fallback found ${booths.length} booths`);
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

                            }
                        }));
                    } catch (err) {

                    }
                })();
            } else {
                console.warn('⚠️ No block data found for assembly:', assemblyId);
                console.log('Response data:', responseData);
                
                // Try to diagnose the issue
                const diagnosisMsg = [];
                diagnosisMsg.push(`Assembly AC_NO: ${assemblyId}`);
                diagnosisMsg.push(`API URL: ${import.meta.env.VITE_APP_API_URL}/block-polygons/booth/${assemblyId}`);
                diagnosisMsg.push(`\nResponse status: ${response.status}`);
                diagnosisMsg.push(`Success: ${responseData.success}`);
                diagnosisMsg.push(`Data count: ${responseData.data ? responseData.data.length : 0}`);
                
                if (responseData.data && responseData.data.length > 0) {
                    diagnosisMsg.push(`Features in first doc: ${responseData.data[0].features ? responseData.data[0].features.length : 0}`);
                }
                
                diagnosisMsg.push(`\n⚠️ Possible reasons:`);
                diagnosisMsg.push(`1. No block polygon data exists for AC_NO ${assemblyId} in the database`);
                diagnosisMsg.push(`2. API endpoint might be different in production`);
                diagnosisMsg.push(`3. Check if you're connected to the correct backend (local vs production)`);
                
                alert(`No block data available for assembly constituency\n\n${diagnosisMsg.join('\n')}`);
            }
        } catch (error) {
            console.error('❌ Error loading block data:', error);
            alert(`Error loading block data: ${error.message}`);
        }
    };

    const loadBoothData = async (BlockNumber, AC_NO = null) => {
        try {
            console.log('🔍 Loading booth data for BlockNumber:', BlockNumber, 'AC_NO:', AC_NO);
            const apiUrl = `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${BlockNumber}`;
            console.log('🌐 API URL:', apiUrl);
            
            const response = await fetch(apiUrl);
            console.log('📡 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseData = await response.json();
            console.log('📦 Booth API Response:', responseData);
            console.log('📊 Features count:', responseData.features?.length || 0);
            
            // Validate API response structure
            if (!responseData.success || !responseData.features || !Array.isArray(responseData.features)) {
                throw new Error('Invalid API response structure');
            }

            // Filter by AC_NO if provided (since API returns all BlockNumber=1 across all assemblies)
            let filteredFeatures = responseData.features;
            if (AC_NO !== null && AC_NO !== undefined) {
                const originalCount = filteredFeatures.length;
                filteredFeatures = filteredFeatures.filter(feature => {
                    const featureAcNo = feature.properties?.AC_NO || feature.properties?.acNo;
                    return featureAcNo == AC_NO;
                });
                console.log(`🔍 Filtered booths by AC_NO ${AC_NO}: ${originalCount} → ${filteredFeatures.length}`);
            }

            if (filteredFeatures.length === 0) {
                alert(`No booths found for BlockNumber: ${BlockNumber}${AC_NO ? `, AC_NO: ${AC_NO}` : ''}\n\nThis block may not have booth data in the database.`);
                return;
            }

            // Transform features with proper validation
            const transformedData = {
                type: 'FeatureCollection',
                features: filteredFeatures.map((feature, index) => {
                    // Validate geometry
                    if (!feature.geometry || !feature.geometry.coordinates) {

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

            console.log(`✅ Successfully loaded ${transformedData.features.length} booths for BlockNumber: ${BlockNumber}${AC_NO ? `, AC_NO: ${AC_NO}` : ''}`);
            
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
            console.error('❌ Error loading booth data:', error);
            alert(`Failed to load booth data for BlockNumber: ${BlockNumber}${AC_NO ? `, AC_NO: ${AC_NO}` : ''}\n\nError: ${error.message}\n\nPlease check:\n1. Booth polygon data exists in database\n2. Backend API is running\n3. Network connection`);
            // Fallback: Show the block boundaries again
            if (selectedFeature && selectedFeature.properties) {
                const fallbackAcNo = selectedFeature.properties.AC_NO || selectedFeature.properties.acNo;
                if (fallbackAcNo) {
                    loadBlockData(fallbackAcNo);
                }
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
                // Create permanent label with number-name format for all levels
                let labelText = '';
                
                if (level === 'state') {
                    labelText = feature.properties.Name || feature.properties.name || '';
                } else if (level === 'division') {
                    labelText = feature.properties.name || feature.properties.DIVISION_NAME || '';
                } else if (level === 'parliamentary') {
                    const pcNo = feature.properties.pcNo || feature.properties.PC_NO || '';
                    const pcName = feature.properties.name || feature.properties.PC_NAME || '';
                    labelText = pcNo && pcName ? `${pcNo}-${pcName}` : (pcName || '');
                } else if (level === 'assembly') {
                    const acNo = feature.properties.acNo || feature.properties.AC_NO || '';
                    const acName = feature.properties.name || feature.properties.AC_NAME || '';
                    labelText = acNo && acName ? `${acNo}-${acName}` : (acName || '');
                } else if (level === 'block') {
                    labelText = feature.properties.name || feature.properties.BlockName || '';
                } else if (level === 'booth') {
                    const boothNo = feature.properties.boothNo || feature.properties.BoothNo || feature.properties.booth_number || '';
                    const boothName = feature.properties.boothName || feature.properties.BoothName || feature.properties.name || '';
                    labelText = boothNo && boothName ? `${boothNo}-${boothName}` : (boothNo || boothName || '');
                }
                
                // Bind permanent label that never closes
                const permanentTooltip = layer.bindTooltip(labelText, {
                    permanent: true,
                    direction: 'center',
                    className: 'permanent-label',
                    offset: [0, 0],
                    opacity: 1,
                    interactive: false
                });
                
                // Open the tooltip immediately and keep it open
                permanentTooltip.openTooltip();

                // Single click handler for showing dynamic data in panel
                layer.on('click', (e) => {
                    handleSingleClick(feature, level);
                    // Ensure permanent label stays visible after click
                    L.DomEvent.stopPropagation(e);
                });

                // Double click handler for hierarchy navigation
                layer.on('dblclick', (e) => {
                    handleDoubleClick(feature, level);
                    // Ensure permanent label stays visible after double click
                    L.DomEvent.stopPropagation(e);
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

                        // Fetch data for hover popup using comprehensive functions
                        const featureId = feature.properties.id;
                        let cacheKey;
                        if (level === 'parliamentary') {
                            const parliamentId = feature.properties.pcNo || feature.properties.parliamentId || feature.properties.parliament_no || feature.properties.id;
                            cacheKey = `${level}_${parliamentId}`;
                        } else if (level === 'assembly') {
                            // For assembly, use AC_NO (Assembly Constituency Number) which should match database
                            const assemblyId = feature.properties.AC_NO || feature.properties.acNo || feature.properties.assembly_no || feature.properties.assemblyNo || feature.properties.id;
                            cacheKey = `${level}_${assemblyId}`;
                        } else {
                            cacheKey = `${level}_${featureId}`;
                        }

                        // Use comprehensive data fetching functions based on level
                        if (level === 'state') {
                            const stateId = feature.properties.id || feature.properties.Name || feature.properties._id;
                            if (stateId && !hoverData[cacheKey]?.stateData) {

                                fetchStateData(stateId);
                            }
                        } else if (level === 'division') {
                            const divisionId = feature.properties.id || feature.properties.DIVISION_CODE || feature.properties.name || feature.properties._id;
                            if (divisionId && !hoverData[cacheKey]?.divisionData) {

                                fetchDivisionData(divisionId);
                            }
                        } else if (level === 'parliamentary') {
                            const parliamentId = feature.properties.pcNo || feature.properties.parliamentId || feature.properties.id;
                            const parliamentName = feature.properties.name || feature.properties.PC_NAME || null;
                            if (parliamentId && !hoverData[cacheKey]?.parliamentData) {
                                console.log('🔍 Hover: Fetching parliament data - ID:', parliamentId, 'Name:', parliamentName);
                                fetchParliamentData(parliamentId, parliamentName);
                            }
                        } else if (level === 'assembly') {
                            const assemblyId = feature.properties.AC_NO || feature.properties.acNo || feature.properties.assembly_no || feature.properties.assemblyNo || feature.properties.id;
                            if (assemblyId && !hoverData[cacheKey]?.assemblyData) {

                                fetchAssemblyDataDetailed(assemblyId);
                            }
                        } else if (level === 'block') {
                            const blockId = feature.properties.id || feature.properties.blockName || feature.properties.BlockName || 
                                          feature.properties.name || feature.properties._id;
                            if (blockId && !hoverData[cacheKey]?.blockData) {

                                fetchBlockDataDetailed(blockId);
                            }
                            
                            // Also fetch gender data specifically for blocks using existing method
                            if (blockId && !hoverData[cacheKey]?.genderData) {

                                fetchBlockGenderData(blockId);
                            }
                        } else if (level === 'booth') {
                            const boothId = feature.properties.BoothNo || feature.properties.boothNo || 
                                          feature.properties.booth_number || feature.properties.boothNumber || 
                                          feature.properties.id || feature.properties._id;
                            const boothCacheKey = `booth_${boothId}`;
                            
                            if (boothId && !hoverData[boothCacheKey]?.boothData) {
                                fetchBoothDataDetailed(boothId);
                            }
                            
                            // Also fetch booth gender data specifically using existing method
                            if (boothId && !hoverData[boothCacheKey]?.genderData) {

                                fetchBoothGenderData(boothId);
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

    // Function to fetch comprehensive state data
    const fetchStateData = async (stateId) => {
        try {
            console.log('🔍 Attempting to fetch state data for:', stateId);
            
            // Try direct ID fetch first
            let stateResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/states/${stateId}`);
            let stateData = {};
            
            // If direct fetch fails or returns nothing, try search by name
            if (!stateResponse.ok || stateResponse.status === 404) {
                console.log('⚠️ Direct ID fetch failed, trying search by name...');
                // Convert slug to proper name (e.g., "madhya-pradesh" -> "Madhya Pradesh")
                const stateName = stateId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                stateResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/states?search=${encodeURIComponent(stateName)}`);
            }
            
            if (stateResponse.ok) {
                const result = await stateResponse.json();
                if (result.success) {
                    // Handle both single object and array response
                    stateData = Array.isArray(result.data) ? result.data[0] : result.data;
                    console.log('✅ State data fetched with description:', stateData?.description ? 'YES' : 'NO', stateData);
                } else {
                    console.log('⚠️ API returned success=false:', result);
                }
            } else {
                console.log('❌ State API call failed with status:', stateResponse.status);
            }

            // Fetch aggregated gender stats for state using existing API
            const genderResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/genders?state=${stateId}&limit=1000`);
            let genderData = {};
            if (genderResponse.ok) {
                const result = await genderResponse.json();
                if (result.success && result.data) {
                    // Aggregate the gender data
                    const totalMale = result.data.reduce((sum, item) => sum + (item.male || 0), 0);
                    const totalFemale = result.data.reduce((sum, item) => sum + (item.female || 0), 0);
                    const totalOthers = result.data.reduce((sum, item) => sum + (item.others || 0), 0);
                    genderData = {
                        male: totalMale,
                        female: totalFemale,
                        others: totalOthers,
                        total: totalMale + totalFemale + totalOthers
                    };

                }
            }

            // Fetch winning candidates for state to get last 3 years data
            const winningResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?state=${stateId}&limit=100`);
            let winningData = {};
            if (winningResponse.ok) {
                const result = await winningResponse.json();
                if (result.success && result.data) {
                    // Process to get winning parties by year
                    const partyByYear = {};
                    result.data.forEach(candidate => {
                        if (candidate.year_id?.year && candidate.party_id?.name) {
                            partyByYear[candidate.year_id.year] = candidate.party_id.name;
                        }
                    });
                    winningData = {
                        winner_2023: partyByYear['2023'] || 'BJP',
                        winner_2018: partyByYear['2018'] || 'INC', 
                        winner_2013: partyByYear['2013'] || 'BJP'
                    };

                }
            }

            setHoverData(prev => ({
                ...prev,
                [`state_${stateId}`]: {
                    ...prev[`state_${stateId}`],
                    stateData,
                    genderData,
                    winningData
                }
            }));
        } catch (error) {

        }
    };

    // Function to fetch comprehensive division data
    const fetchDivisionData = async (divisionId) => {
        try {

            
            // Try to find division by ID or name
            let divisionResponse;
            if (divisionId.length === 24) { // ObjectId format
                divisionResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions/${divisionId}`);
            } else {
                // Search by name
                divisionResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions?search=${encodeURIComponent(divisionId)}`);
            }
            
            let divisionData = {};
            if (divisionResponse.ok) {
                const result = await divisionResponse.json();
                if (result.success) {
                    divisionData = Array.isArray(result.data) ? result.data[0] : result.data;

                }
            }

            // Fetch parliaments in this division
            const divisionObjectId = divisionData._id || divisionId;
            const parliamentsResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments/division/${divisionObjectId}`);
            let parliamentsData = [];
            if (parliamentsResponse.ok) {
                const result = await parliamentsResponse.json();
                if (result.success) {
                    parliamentsData = result.data || [];

                }
            }

            setHoverData(prev => ({
                ...prev,
                [`division_${divisionId}`]: {
                    ...prev[`division_${divisionId}`],
                    divisionData,
                    parliamentsData
                }
            }));
        } catch (error) {

        }
    };

    // Function to fetch comprehensive parliament data
    const fetchParliamentData = async (parliamentId, parliamentName = null) => {
        try {
            console.log('🔍 fetchParliamentData called with:', { parliamentId, parliamentName });
            
            // Fetch parliament basic info
            let parliamentResponse;
            if (parliamentId.length === 24) { // ObjectId format
                parliamentResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments/${parliamentId}`);
            } else {
                // Search by parliament number
                parliamentResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?search=${encodeURIComponent(parliamentId)}`);
            }
            
            let parliamentData = {};
            if (parliamentResponse.ok) {
                const result = await parliamentResponse.json();
                if (result.success) {
                    // If API returns array, try to find exact match by parliament number and name
                    if (Array.isArray(result.data)) {
                        const needle = String(parliamentId).trim();
                        
                        // First try exact match by PC number and name (if name provided)
                        let exact = null;
                        if (parliamentName) {
                            exact = result.data.find(p => {
                                if (!p) return false;
                                const pcNo = String(p.parliament_no || p.PC_NO || p.pc_no || '').trim();
                                const pcName = String(p.name || p.PC_NAME || p.pc_name || '').trim().toLowerCase();
                                const searchName = String(parliamentName).trim().toLowerCase();
                                return pcNo === needle && pcName === searchName;
                            });
                        }
                        
                        // If not found by name, try exact match by PC number only
                        if (!exact) {
                            exact = result.data.find(p => {
                                if (!p) return false;
                                const pcNo = String(p.parliament_no || p.PC_NO || p.pc_no || '').trim();
                                return pcNo === needle;
                            });
                        }
                        
                        if (exact) {
                            parliamentData = exact;
                            console.log('✅ Found exact parliament match:', parliamentData.name || parliamentData.PC_NAME);
                        } else if (result.data.length === 1) {
                            parliamentData = result.data[0];
                            console.log('⚠️ Using single result:', parliamentData.name || parliamentData.PC_NAME);
                        } else {
                            console.warn('⚠️ Multiple results found, no exact match. Using first:', result.data[0]);
                            parliamentData = result.data[0];
                        }
                    } else {
                        parliamentData = result.data;
                    }

                }
            }

            // Fetch gender stats for parliament
            const parliamentObjectId = parliamentData._id || parliamentId;
            const genderResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/genders?parliament=${parliamentObjectId}&limit=1000`);
            let genderData = {};
            if (genderResponse.ok) {
                const result = await genderResponse.json();
                if (result.success && result.data) {
                    // Aggregate the gender data
                    const totalMale = result.data.reduce((sum, item) => sum + (item.male || 0), 0);
                    const totalFemale = result.data.reduce((sum, item) => sum + (item.female || 0), 0);
                    const totalOthers = result.data.reduce((sum, item) => sum + (item.others || 0), 0);
                    genderData = {
                        male: totalMale,
                        female: totalFemale,
                        others: totalOthers,
                        total: totalMale + totalFemale + totalOthers
                    };

                }
            }

            // Fetch winning candidates data
            const winningResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?parliament=${parliamentObjectId}&limit=100`);
            let winningData = {};
            if (winningResponse.ok) {
                const result = await winningResponse.json();
                if (result.success && result.data) {
                    // Process to get winning parties by year and current MP
                    const partyByYear = {};
                    let currentMP = '';
                    result.data.forEach(candidate => {
                        if (candidate.year_id?.year && candidate.party_id?.name) {
                            partyByYear[candidate.year_id.year] = candidate.party_id.name;
                            if (candidate.year_id.year === '2024' || candidate.year_id.year === '2019') {
                                currentMP = candidate.candidate_id?.name || '';
                            }
                        }
                    });
                    winningData = {
                        winner_2024: partyByYear['2024'] || partyByYear['2019'] || 'BJP',
                        winner_2019: partyByYear['2019'] || 'BJP',
                        winner_2014: partyByYear['2014'] || 'BJP',
                        current_mp: currentMP
                    };

                }
            }

            // Fetch assemblies in this parliament
            const assembliesResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/parliament/${parliamentObjectId}`);
            let assembliesData = [];
            if (assembliesResponse.ok) {
                const result = await assembliesResponse.json();
                if (result.success) {
                    assembliesData = result.data || [];

                }
            }

            // Fetch total booths count
            const boothsResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?parliament=${parliamentObjectId}&limit=1`);
            let totalBooths = 0;
            if (boothsResponse.ok) {
                const result = await boothsResponse.json();
                if (result.success) {
                    totalBooths = result.total || 0;

                }
            }

            setHoverData(prev => ({
                ...prev,
                [`parliamentary_${parliamentId}`]: {
                    ...prev[`parliamentary_${parliamentId}`],
                    parliamentData,
                    genderData,
                    winningData,
                    assembliesData,
                    totalBooths
                }
            }));
        } catch (error) {
            console.error('❌ Error fetching parliament data:', error);
            // Set empty data to prevent infinite loading
            setHoverData(prev => ({
                ...prev,
                [`parliamentary_${parliamentId}`]: {
                    parliamentData: {},
                    genderData: {},
                    winningData: {},
                    assembliesData: [],
                    totalBooths: 0,
                    error: true
                }
            }));
        }
    };

    // Function to fetch comprehensive assembly data
    const fetchAssemblyDataDetailed = async (assemblyId) => {
        try {

            
            // Fetch assembly basic info
            let assemblyResponse;
            if (assemblyId.length === 24) { // ObjectId format

                assemblyResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies/${assemblyId}`);
            } else {
                // Search by AC_NO

                assemblyResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?search=${encodeURIComponent(assemblyId)}`);
            }
            
            let assemblyData = {};
            if (assemblyResponse.ok) {
                const result = await assemblyResponse.json();
                if (result.success) {
                    // If API returns array, try to find exact match by AC_NO or _id first
                    if (Array.isArray(result.data)) {
                        const needle = String(assemblyId).trim();
                        const exact = result.data.find(a => {
                            if (!a) return false;
                            const ac = a.AC_NO || a.acNo || a.AC || a.ac_no || a.constituency_no || a.number;
                            if (ac && String(ac).trim() === needle) return true;
                            if (a._id && String(a._id) === needle) return true;
                            return false;
                        });

                        if (exact) {
                            assemblyData = exact;

                        } else if (result.data.length === 1) {
                            assemblyData = result.data[0];

                        } else {
                            // Unexpected: multiple results and none match exactly
                            // We'll try client-side matching later, so leave assemblyData empty for now
                        }
                    } else {
                        assemblyData = result.data;
                    }
                } else {
                    // Assembly API returned no success
                }
            } else {
                // Assembly API call failed
            }

            // Fallback: if API search didn't return usable assemblyData, fetch a larger set and try client-side matching
            if (!assemblyData || Object.keys(assemblyData).length === 0) {
                try {

                    const allUrl = `${import.meta.env.VITE_APP_API_URL}/assemblies?limit=10000`;
                    const allResp = await fetch(allUrl);
                    if (allResp.ok) {
                        const allResult = await allResp.json();
                        const candidates = Array.isArray(allResult.data) ? allResult.data : [];
                        // Normalize search values
                        const needleStr = String(assemblyId).trim().toLowerCase();
                        const needleNum = Number(assemblyId);

                        const found = candidates.find(a => {
                            if (!a) return false;
                            const ac = a.AC_NO || a.acNo || a.AC || a.ac_no || a.ac_no_str;
                            if (ac && String(ac).trim().toLowerCase() === needleStr) return true;
                            if (!isNaN(needleNum) && ac && Number(ac) === needleNum) return true;
                            // try matching by _id
                            if (a._id && String(a._id) === needleStr) return true;
                            // try matching by name containing the number or name equal
                            if (a.name && a.name.toLowerCase().includes(needleStr)) return true;
                            return false;
                        });

                        if (found) {
                            assemblyData = found;

                        } else {
                        }
                    } else {

                    }
                } catch (err) {

                }
            }

            // Fetch gender stats for assembly
            const assemblyObjectId = assemblyData._id || assemblyId;
            const genderResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/genders?assembly=${assemblyObjectId}&limit=1000`);
            let genderData = {};
            if (genderResponse.ok) {
                const result = await genderResponse.json();
                if (result.success && result.data) {
                    // Aggregate the gender data
                    const totalMale = result.data.reduce((sum, item) => sum + (item.male || 0), 0);
                    const totalFemale = result.data.reduce((sum, item) => sum + (item.female || 0), 0);
                    const totalOthers = result.data.reduce((sum, item) => sum + (item.others || 0), 0);
                    genderData = {
                        male: totalMale,
                        female: totalFemale,
                        others: totalOthers,
                        total: totalMale + totalFemale + totalOthers
                    };

                }
            }

            // Fetch winning candidates data (MLA info)
            const winningResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?assembly=${assemblyObjectId}&limit=100`);
            let winningData = {};
            if (winningResponse.ok) {
                const result = await winningResponse.json();
                if (result.success && result.data) {
                    // Get current MLA (latest winner)
                    let currentMLA = '';
                    if (result.data.length > 0) {
                        const latestCandidate = result.data[0]; // Assuming sorted by year desc
                        currentMLA = latestCandidate.candidate_id?.name || '';
                    }
                    winningData = {
                        current_mla: currentMLA
                    };

                }
            }

            // Fetch total booths count for assembly
            const boothsResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?assembly=${assemblyObjectId}&limit=1`);
            let totalBooths = 0;
            if (boothsResponse.ok) {
                const result = await boothsResponse.json();
                if (result.success) {
                    totalBooths = result.total || 0;

                }
            }

            // Ensure hover cache is writable under multiple useful keys so lookups succeed
            // regardless of whether the caller used AC_NO, objectId or some other polygon field.
            try {
                const keysToSet = new Set();
                // Original requested key (could be AC_NO or an ObjectId string)
                keysToSet.add(`assembly_${assemblyId}`);

                // If assemblyData has an ObjectId, include that key too
                if (assemblyData && assemblyData._id) {
                    keysToSet.add(`assembly_${assemblyData._id}`);
                }

                // Try to discover an AC/number field in the returned assembly record
                const acCandidate = assemblyData && (
                    assemblyData.AC_NO || assemblyData.acNo || assemblyData.AC || assemblyData.ac_no || assemblyData.ac_no_str || assemblyData.constituency_no || assemblyData.number || assemblyData.no
                );
                if (acCandidate) {
                    keysToSet.add(`assembly_${String(acCandidate)}`);
                }

                setHoverData(prev => {
                    const next = { ...prev };
                    keysToSet.forEach(k => {
                        next[k] = {
                            ...next[k],
                            assemblyData,
                            genderData,
                            winningData,
                            totalBooths
                        };
                    });
                    return next;
                });
            } catch (err) {

                // fallback single-key write
                setHoverData(prev => ({
                    ...prev,
                    [`assembly_${assemblyId}`]: {
                        ...prev[`assembly_${assemblyId}`],
                        assemblyData,
                        genderData,
                        winningData,
                        totalBooths
                    }
                }));
            }
        } catch (error) {

        }
    };

    // Function to fetch comprehensive block data
    const fetchBlockDataDetailed = async (blockId) => {
        try {

            
            // Fetch block basic info
            let blockResponse;
            if (blockId.length === 24) { // ObjectId format
                blockResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/blocks/${blockId}`);
            } else {
                // Search by name
                blockResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/blocks?search=${encodeURIComponent(blockId)}`);
            }
            
            let blockData = {};
            if (blockResponse.ok) {
                const result = await blockResponse.json();
                if (result.success) {
                    blockData = Array.isArray(result.data) ? result.data[0] : result.data;

                }
            }

            // Fetch total booths count for block
            const blockObjectId = blockData._id || blockId;
            const boothsResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?block=${blockObjectId}&limit=1`);
            let totalBooths = 0;
            if (boothsResponse.ok) {
                const result = await boothsResponse.json();
                if (result.success) {
                    totalBooths = result.total || 0;

                }
            }

            setHoverData(prev => ({
                ...prev,
                [`block_${blockId}`]: {
                    ...prev[`block_${blockId}`],
                    blockData,
                    totalBooths
                }
            }));
        } catch (error) {

        }
    };

    // Function to fetch comprehensive booth data
    const fetchBoothDataDetailed = async (boothId) => {
        try {

            
            // Fetch booth basic info by booth number
            const boothResponse = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?search=${encodeURIComponent(boothId)}`);
            let boothData = {};
            if (boothResponse.ok) {
                const result = await boothResponse.json();
                if (result.success && result.data && result.data.length > 0) {
                    // Find the exact booth by booth_number
                    boothData = result.data.find(booth => 
                        booth.booth_number == boothId || 
                        booth.booth_number === boothId.toString()
                    ) || result.data[0];

                }
            }

            // Extract gender stats directly from booth data (booth model has these fields)
            let genderData = {};
            if (boothData && (boothData.Male_Count || boothData.Female_Count || boothData.Total)) {
                genderData = {
                    male: boothData.Male_Count || 0,
                    female: boothData.Female_Count || 0,
                    others: boothData.others_Count || 0,
                    total: boothData.Total || 0
                };

            }
            setHoverData(prev => ({
                ...prev,
                [`booth_${boothId}`]: {
                    ...prev[`booth_${boothId}`],
                    boothData,
                    genderData
                }
            }));
            
            // Return booth data for immediate use
            return boothData;
        } catch (error) {
            return {};
        }
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

            }
        } catch (error) {

        }
    };

    // Function to fetch gender data for block hover
    const fetchBlockGenderData = async (blockId) => {
        try {
            const encodedId = encodeURIComponent(blockId);
            const url = `${import.meta.env.VITE_APP_API_URL}/genders/stats/block/${encodedId}`;

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    const cacheKey = `block_${blockId}`;

                    setHoverData(prev => ({
                        ...prev,
                        [cacheKey]: {
                            ...prev[cacheKey],
                            genderData: data.data
                        }
                    }));
                } else {

                }
            } else {
                let errorText;
                try {
                    const errorJson = await response.json();
                    errorText = JSON.stringify(errorJson);
                } catch (e) {
                    errorText = await response.text();
                }

                
                // If 404, likely means route not found or no matching block found
                if (response.status === 404) {

                }
            }
        } catch (error) {

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


            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();

                if (data.success && data.data && data.data.length > 0) {
                    
                    // Find the booth that matches our booth number
                    const matchingBooth = data.data.find(booth => 
                        booth.booth_number == boothId || 
                        booth.booth_number === boothId.toString()
                    );
                    

                    
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
                        // No matching booth found
                        // Try fetching all booths to see what's available
                        const allBoothsUrl = `${import.meta.env.VITE_APP_API_URL}/booths?limit=10`;
                        const allBoothsResponse = await fetch(allBoothsUrl);
                        if (allBoothsResponse.ok) {
                            const allBoothsData = await allBoothsResponse.json();
                        }
                    }
                } else if (data.success && data.total === 0) {

                    // Fetch a larger set (or all) booths and try client-side matching to handle mismatched search behavior
                    try {
                        const allUrl = `${import.meta.env.VITE_APP_API_URL}/booths?limit=10000`;

                        const allResp = await fetch(allUrl);
                        if (allResp.ok) {
                            const allData = await allResp.json();
                            const candidates = Array.isArray(allData.data) ? allData.data : [];


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

                            }
                        }
                    } catch (err) {

                    }
                } else {

                }
            } else {
                let errorText;
                try {
                    const errorJson = await response.json();
                    errorText = JSON.stringify(errorJson);

                } catch (e) {
                    errorText = await response.text();

                }
            }
        } catch (error) {


        }
    };

    // Handle single click - show dynamic data in panel only
    const handleSingleClick = async (feature, level) => {

        setSelectedFeature(feature);
        // Call the onRegionClick prop with region data
        if (onRegionClick) {
            onRegionClick({
                id: feature.properties.id,
                name: feature.properties.name,
                level: level
            });
        }

        // Create cache key same as hover data
        const properties = feature.properties;
        const featureId = properties.id;
        let cacheKey;
        if (level === 'parliamentary') {
            const parliamentId = properties.pcNo || properties.parliamentId || properties.parliament_no || properties.id;
            cacheKey = `${level}_${parliamentId}`;
        } else if (level === 'assembly') {
            // For assembly, use AC_NO (Assembly Constituency Number) which should match database
            const assemblyId = properties.AC_NO || properties.acNo || properties.assembly_no || properties.assemblyNo || properties.id;
            cacheKey = `${level}_${assemblyId}`;
        } else if (level === 'booth') {
            const boothId = properties.BoothNo || properties.boothNo || 
                          properties.booth_number || properties.boothNumber || 
                          properties.booth_no || properties.BoothNumber ||
                          properties.id || properties.BoothId || properties._id;
            cacheKey = `booth_${boothId}`;
        } else if (level === 'block') {
            const blockId = properties.name || properties.Name || properties.id;
            cacheKey = `${level}_${blockId ? blockId.toLowerCase() : featureId}`;
        } else {
            cacheKey = `${level}_${featureId}`;
        }

        // For assembly level, log the polygon properties to debug
        if (level === 'assembly') {
            
        }
        // For parliamentary level, log the polygon properties to debug
        if (level === 'parliamentary') {
            
        }
        // Open panel immediately with loading state
        setIsPanelLoading(true);
        setPanelData({
            feature,
            level,
            data: hoverData[cacheKey] || {}
        });
        setPanelLevel(level);
        setIsPanelOpen(true);

        // Set timeout to stop loading after 10 seconds
        const loadingTimeout = setTimeout(() => {
            console.warn('⏱️ Loading timeout reached for', level, cacheKey);
            setIsPanelLoading(false);
        }, 10000);

        // Check if we already have data in hoverData cache
        const existingData = hoverData[cacheKey];
        if (existingData && Object.keys(existingData).length > 0) {
            clearTimeout(loadingTimeout);
            setIsPanelLoading(false);
            return;
        }

        // If no cached data, fetch it using the same logic as hover
        try {
            if (level === 'state') {
                const stateId = feature.properties.id || feature.properties.Name || feature.properties._id;
                console.log('🔍 Fetching state data for panel. StateId:', stateId, 'CacheKey:', cacheKey);
                if (stateId) {

                    await fetchStateData(stateId);
                }
            } else if (level === 'division') {
                const divisionId = feature.properties.id || feature.properties.DIVISION_CODE || feature.properties.name || feature.properties._id;
                if (divisionId) {

                    await fetchDivisionData(divisionId);
                }
            } else if (level === 'parliamentary') {
                const parliamentId = feature.properties.pcNo || feature.properties.parliamentId || feature.properties.id;
                const parliamentName = feature.properties.name || feature.properties.PC_NAME || null;
                if (parliamentId) {
                    console.log('🔍 Fetching parliament data - ID:', parliamentId, 'Name:', parliamentName);
                    await fetchParliamentData(parliamentId, parliamentName);
                }
            } else if (level === 'assembly') {
                const assemblyId = feature.properties.AC_NO || feature.properties.acNo || feature.properties.assembly_no || feature.properties.assemblyNo || feature.properties.id;
                if (assemblyId) {

                    await fetchAssemblyDataDetailed(assemblyId);
                }
            } else if (level === 'block') {
                const blockId = feature.properties.BlockNumber || feature.properties.blockNumber || feature.properties.name || feature.properties.id;
                if (blockId) {

                    await fetchBlockDataDetailed(blockId);
                }
            } else if (level === 'booth') {
                const boothNo = feature.properties.BoothNo || feature.properties.boothNo || feature.properties.booth_number;
                const boothIdFromProps = feature.properties.BoothNumber || feature.properties.boothNumber || feature.properties.id || feature.properties._id;
                
                if (boothNo) {
                    // First fetch booth detailed info to get the actual MongoDB _id
                    const boothData = await fetchBoothDataDetailed(boothNo);
                    const actualBoothId = boothData._id || boothIdFromProps;
                    
                    console.log('🔍 Booth clicked - BoothNo:', boothNo, 'Actual _id:', actualBoothId, 'BoothData:', boothData);
                    
                    // Set selectedBoothDetails from fetched boothData or feature properties
                    setSelectedBoothDetails({
                        _id: actualBoothId,
                        booth_number: boothNo || boothData.booth_number || feature.properties.BoothNo,
                        booth_name: boothData.name || feature.properties.BoothName || feature.properties.boothName,
                        full_address: boothData.full_address || feature.properties.Location,
                        state_name: boothData.state_id?.name || 'Madhya Pradesh',
                        division_name: boothData.division_id?.name || feature.properties.divisionName || 'N/A',
                        district_name: boothData.district_id?.name || 'N/A',
                        block_name: boothData.block_id?.name || feature.properties.BlockName,
                        assembly_name: boothData.assembly_id?.name || feature.properties.AC_NAME,
                        parliament_name: boothData.parliament_id?.name || feature.properties.pcName,
                        election_year: boothData.election_year || '2023',
                        total_voters: boothData.Total || boothData.total_voters || feature.properties.totalVoters || 0,
                        male_voters: boothData.Male_Count || boothData.male_voters || 0,
                        female_voters: boothData.Female_Count || boothData.female_voters || 0,
                        other_voters: boothData.others_Count || boothData.other_voters || 0,
                        latitude: feature.properties.latitude,
                        longitude: feature.properties.longitude,
                        created_at: boothData.created_at,
                        updated_at: boothData.updated_at
                    });
                    
                    // Fetch aggregates using the actual MongoDB _id
                    if (actualBoothId) {
                        console.log('📊 Fetching aggregates for booth _id:', actualBoothId);
                        await fetchBoothAggregates(actualBoothId, boothNo);
                    } else {
                        console.warn('⚠️ No valid booth _id found, cannot fetch aggregates');
                    }
                }
            }

            // Data will be automatically updated via useEffect when hoverData changes
        } catch (error) {
            console.error('❌ Error in handleSingleClick:', error);
            clearTimeout(loadingTimeout);
            setIsPanelLoading(false);
        }
    };

    // Handle double click - navigate to next hierarchy level
    const handleDoubleClick = (feature, level) => {

        
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

                    alert('No parliamentary data available for this division. Staying at division level.');
                }
                break;
            case 'parliamentary':
                loadAssemblyData(feature.properties.pcNo);
                setCurrentLevel('assembly');
                break;
            case 'assembly':
                console.log('🖱️ Double-click on assembly:', feature.properties.name);
                console.log('📋 Assembly properties:', feature.properties);
                console.log('🔢 Using AC_NO:', feature.properties.acNo);
                loadBlockData(feature.properties.acNo);
                setCurrentLevel('block');
                break;
            case 'block':
                const BlockNumber = feature.properties.BlockNumber || feature.properties.blockNumber;
                const blockAcNo = feature.properties.AC_NO || feature.properties.acNo;
                console.log('🖱️ Double-click on block:', feature.properties.name);
                console.log('📋 Block properties:', feature.properties);
                console.log('🔢 Using BlockNumber:', BlockNumber, 'AC_NO:', blockAcNo);
                
                if (BlockNumber) {
                    loadBoothData(BlockNumber, blockAcNo);
                    setCurrentLevel('booth');
                } else {
                    console.warn('⚠️ No BlockNumber found in properties');
                    alert(`Block information incomplete.\n\nBlockNumber: ${BlockNumber}\n\nCannot navigate to booths without BlockNumber.`);
                }
                break;
            default:

                break;
        }

        // Close panel when navigating
        setIsPanelOpen(false);
    };

    const generatePanelContent = (feature, level, data) => {
        const properties = feature?.properties || {};
        
        // Ensure data is not null/undefined (data now comes from hoverData cache)
        const safeData = data || {};

        // Build panel sections based on level
        let sections = [];

        switch (level) {
            case 'state':
                const stateData = safeData.stateData || {};
                const stateGenderData = safeData.genderData || {};
                const stateWinningData = safeData.winningData || {};
                
                console.log('🏛️ Generating panel for state with data:', {
                    stateData,
                    hasDescription: !!stateData.description,
                    description: stateData.description
                });
                
                sections = [
                    {
                        title: 'Basic Information',
                        items: [
                            { label: 'State Name', value: stateData.name || properties.Name || 'Madhya Pradesh' }
                        ]
                    }
                ];

                // Add description section if available
                if (stateData.description) {
                    console.log('✅ Adding description section to panel');
                    sections.push({
                        title: 'Description',
                        html: stateData.description
                    });
                }

                sections.push(
                    {
                        title: 'Voter Statistics',
                        items: [
                            { label: 'Total Voters', value: stateGenderData.total ? Number(stateGenderData.total).toLocaleString() : '—' },
                            { label: 'Total Male Voters', value: stateGenderData.male ? Number(stateGenderData.male).toLocaleString() : '—' },
                            { label: 'Total Female Voters', value: stateGenderData.female ? Number(stateGenderData.female).toLocaleString() : '—' }
                        ]
                    },
                    {
                        title: 'Election History',
                        items: [
                            { label: 'Winning Party 2023', value: stateWinningData.winner_2023 || 'BJP' },
                            { label: 'Winning Party 2018', value: stateWinningData.winner_2018 || 'INC' },
                            { label: 'Winning Party 2013', value: stateWinningData.winner_2013 || 'BJP' }
                        ]
                    }
                );
                break;

            case 'division':
                const divisionData = safeData.divisionData || {};
                const parliamentsData = safeData.parliamentsData || [];
                
                sections = [
                    {
                        title: 'Basic Information',
                        items: [
                            { label: 'Division Name', value: divisionData.name || properties.name || properties.Name || '' },
                            { label: 'State Name', value: divisionData.state_id?.name || 'Madhya Pradesh' },
                            { label: 'Total Parliamentary Constituencies', value: parliamentsData.length || '—' }
                        ]
                    }
                ];

                if (parliamentsData.length > 0) {
                    sections.push({
                        title: 'Parliamentary Constituencies',
                        list: parliamentsData.slice(0, 10).map(pc => `${pc.name} – ${pc.parliament_no}`)
                    });
                }
                break;

            case 'parliamentary':
                const parliamentData = safeData.parliamentData || {};
                const parliamentGenderData = safeData.genderData || {};
                const parliamentWinningData = safeData.winningData || {};
                const assembliesData = safeData.assembliesData || [];
                const totalBooths = safeData.totalBooths || 0;

                sections = [
                    {
                        title: 'Basic Information',
                        items: [
                            { label: 'Parliament Name', value: parliamentData.name || properties.name || '' },
                            { label: 'Parliament No', value: parliamentData.parliament_no || properties.pcNo || '' },
                            { label: 'Division Name', value: parliamentData.division_id?.name || properties.divisionName || '' },
                            { label: 'State Name', value: parliamentData.state_id?.name || 'Madhya Pradesh' }
                        ]
                    },
                    {
                        title: 'Voter Statistics',
                        items: [
                            { label: 'Total Voters in PC', value: parliamentGenderData.total ? Number(parliamentGenderData.total).toLocaleString() : '—' },
                            { label: 'Total Male Voters', value: parliamentGenderData.male ? Number(parliamentGenderData.male).toLocaleString() : '—' },
                            { label: 'Total Female Voters', value: parliamentGenderData.female ? Number(parliamentGenderData.female).toLocaleString() : '—' }
                        ]
                    },
                    {
                        title: 'Election History',
                        items: [
                            { label: 'Winning Party 2024', value: parliamentWinningData.winner_2024 || 'BJP' },
                            { label: 'Winning Party 2019', value: parliamentWinningData.winner_2019 || 'BJP' },
                            { label: 'Winning Party 2014', value: parliamentWinningData.winner_2014 || 'BJP' },
                            { label: 'Current MP Name', value: parliamentWinningData.current_mp || '—' }
                        ]
                    },
                    {
                        title: 'Administrative Details',
                        items: [
                            { label: 'Total Booths', value: totalBooths || '—' },
                            { label: 'Total Assembly', value: assembliesData.length || '—' }
                        ]
                    }
                ];

                if (assembliesData.length > 0) {
                    sections.push({
                        title: 'Assembly Constituencies',
                        list: assembliesData.slice(0, 10).map((assembly, index) => `${index + 1}. ${assembly.name} – ${assembly.AC_NO || 'N/A'}`)
                    });
                }
                break;

            case 'assembly':
                const assemblyData = safeData.assemblyData || {};
                const assemblyGenderData = safeData.genderData || {};
                const assemblyWinningData = safeData.winningData || {};
                const assemblyTotalBooths = safeData.totalBooths || 0;
                
                sections = [
                    {
                        title: 'Basic Information',
                        items: [
                            { label: 'Assembly Name', value: assemblyData.name || properties.name || '' },
                            { label: 'Assembly No', value: assemblyData.AC_NO || properties.acNo || '' },
                            { label: 'Parliament Name', value: assemblyData.parliament_id?.name || properties.pcName || '' },
                            { label: 'Division Name', value: assemblyData.division_id?.name || properties.divisionName || '' },
                            { label: 'State Name', value: assemblyData.state_id?.name || 'Madhya Pradesh' }
                        ]
                    },
                    {
                        title: 'Voter Statistics',
                        items: [
                            { label: 'Total Voters', value: assemblyGenderData.total ? Number(assemblyGenderData.total).toLocaleString() : '—' },
                            { label: 'Total Male Voters', value: assemblyGenderData.male ? Number(assemblyGenderData.male).toLocaleString() : '—' },
                            { label: 'Total Female Voters', value: assemblyGenderData.female ? Number(assemblyGenderData.female).toLocaleString() : '—' }
                        ]
                    },
                    {
                        title: 'Additional Information',
                        items: [
                            { label: 'Current MLA Name', value: assemblyWinningData.current_mla || '—' },
                            { label: 'Total Booths', value: assemblyTotalBooths || '—' }
                        ]
                    }
                ];
                break;

            case 'block':
                const blockData = safeData.blockData || {};
                const blockGenderData = safeData.genderData || {};
                const blockTotalBooths = safeData.totalBooths || 0;
                
                sections = [
                    {
                        title: 'Basic Information',
                        items: [
                            { label: 'Block Name', value: blockData.name || properties.name || properties.BlockName || '' },
                            { label: 'Assembly Name', value: blockData.assembly_id?.name || properties.acName || properties.AC_NAME || '' },
                            { label: 'Parliament Name', value: blockData.parliament_id?.name || properties.pcName || '' },
                            { label: 'Division Name', value: blockData.division_id?.name || properties.divisionName || '' },
                            { label: 'State Name', value: blockData.state_id?.name || 'Madhya Pradesh' },
                            { label: 'Total Booths', value: blockTotalBooths || properties.totalBooths || '—' }
                        ]
                    }
                ];

                if (blockGenderData.total || blockGenderData.male || blockGenderData.female) {
                    sections.push({
                        title: 'Voter Statistics',
                        items: [
                            { label: 'Total Voters', value: blockGenderData.total ? Number(blockGenderData.total).toLocaleString() : '—' },
                            { label: 'Total Male Voters', value: blockGenderData.male ? Number(blockGenderData.male).toLocaleString() : '—' },
                            { label: 'Total Female Voters', value: blockGenderData.female ? Number(blockGenderData.female).toLocaleString() : '—' }
                        ]
                    });
                }
                break;

            case 'booth':
                const boothGenderData = safeData.genderData || {};
                const boothData = safeData.boothData || {};
                
                const boothName = boothData.name || properties.BoothName || properties.boothName || '—';
                const boothNumber = boothData.booth_number || properties.BoothNo || properties.boothNo || '—';
                const blockName = boothData.block_id?.name || properties.BlockName || properties.blockName || '—';
                const assemblyName = boothData.assembly_id?.name || properties.AC_NAME || '—';
                const parliamentName = boothData.parliament_id?.name || '—';
                const divisionName = boothData.division_id?.name || '—';
                
                sections = [
                    {
                        title: 'Basic Information',
                        items: [
                            { label: 'Booth Name', value: boothName },
                            { label: 'Booth Number', value: boothNumber },
                            { label: 'Block Name', value: blockName },
                            { label: 'Assembly Name', value: assemblyName },
                            { label: 'Parliament Name', value: parliamentName },
                            { label: 'Division Name', value: divisionName },
                            { label: 'State Name', value: 'Madhya Pradesh' }
                        ]
                    }
                ];

                if (boothGenderData.total || boothGenderData.male || boothGenderData.female) {
                    sections.push({
                        title: 'Voter Statistics',
                        items: [
                            { label: 'Total Voters', value: boothGenderData.total ? Number(boothGenderData.total).toLocaleString() : '—' },
                            { label: 'Total Male Voters', value: boothGenderData.male ? Number(boothGenderData.male).toLocaleString() : '—' },
                            { label: 'Total Female Voters', value: boothGenderData.female ? Number(boothGenderData.female).toLocaleString() : '—' }
                        ]
                    });
                }

                // Add booth aggregates sections with navigation
                if (boothAggregates) {
                    // Gender Distribution
                    if (boothAggregates.gender) {
                        sections.push({
                            title: '👥 Gender Distribution',
                            items: [
                                { label: 'Male', value: boothAggregates.gender.male },
                                { label: 'Female', value: boothAggregates.gender.female },
                                { label: 'Others', value: boothAggregates.gender.others },
                                { label: 'Total', value: boothAggregates.gender.total }
                            ]
                        });
                    }

                    // Events
                    if (boothAggregates.events && boothAggregates.events.length > 0) {
                        sections.push({
                            title: `📅 Events (${boothAggregates.events.length})`,
                            list: boothAggregates.events.slice(0, 5).map(ev => 
                                `${ev.title || ev.event_name || 'Event'} ${ev.date ? '- ' + new Date(ev.date).toLocaleDateString('en-IN') : ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.events.length,
                                items: boothAggregates.events,
                                listPath: '/Events',
                                detailPath: '/Events'
                            }
                        });
                    }

                    // Party Activities
                    if (boothAggregates.partyActivities && boothAggregates.partyActivities.length > 0) {
                        sections.push({
                            title: `🚩 Party Activities (${boothAggregates.partyActivities.length})`,
                            list: boothAggregates.partyActivities.slice(0, 5).map(a => 
                                `${a.activity_name || a.title || 'Activity'} ${a.date ? '- ' + new Date(a.date).toLocaleDateString('en-IN') : ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.partyActivities.length,
                                items: boothAggregates.partyActivities,
                                listPath: '/party-activities',
                                detailPath: '/party-activities'
                            }
                        });
                    }

                    // Visits
                    if (boothAggregates.visits && boothAggregates.visits.length > 0) {
                        sections.push({
                            title: `👁️ Visits (${boothAggregates.visits.length})`,
                            list: boothAggregates.visits.slice(0, 5).map(v => 
                                `${v.candidate_id?.name || v.person_name || 'Visit'} ${v.date ? '- ' + new Date(v.date).toLocaleDateString('en-IN') : ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.visits.length,
                                items: boothAggregates.visits,
                                listPath: '/visits',
                                detailPath: '/visits'
                            }
                        });
                    }

                    // Influencers
                    if (boothAggregates.influencers && boothAggregates.influencers.length > 0) {
                        sections.push({
                            title: `👤 Influencers (${boothAggregates.influencers.length})`,
                            list: boothAggregates.influencers.slice(0, 5).map(p => 
                                `${p.name || p.person_name || 'Influencer'} - ${p.designation || p.phone || ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.influencers.length,
                                items: boothAggregates.influencers,
                                listPath: '/Influancer',
                                detailPath: '/Influancer'
                            }
                        });
                    }

                    // Volunteers
                    if (boothAggregates.volunteers && boothAggregates.volunteers.length > 0) {
                        sections.push({
                            title: `🤝 Volunteers (${boothAggregates.volunteers.length})`,
                            list: boothAggregates.volunteers.slice(0, 5).map(p => 
                                `${p.name || p.username || p.phone || 'Volunteer'} - ${p.party?.name || p.role || ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.volunteers.length,
                                items: boothAggregates.volunteers,
                                listPath: '/booth-volunteer',
                                detailPath: '/booth-volunteer'
                            }
                        });
                    }

                    // Government Schemes
                    if (boothAggregates.governments && boothAggregates.governments.length > 0) {
                        sections.push({
                            title: `🏥 Government Schemes (${boothAggregates.governments.length})`,
                            list: boothAggregates.governments.slice(0, 5).map(s => 
                                `${s.name || 'Scheme'} ${s.amount ? '- ₹' + Number(s.amount).toLocaleString() : ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.governments.length,
                                items: boothAggregates.governments,
                                listPath: '/Government-Schema',
                                detailPath: '/Government-Schema'
                            }
                        });
                    }

                    // Local Issues
                    if (boothAggregates.localIssues && boothAggregates.localIssues.length > 0) {
                        sections.push({
                            title: `⚠️ Local Issues (${boothAggregates.localIssues.length})`,
                            list: boothAggregates.localIssues.slice(0, 5).map(it => 
                                `${it.issue_name || 'Issue'} - ${it.status || it.priority || ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.localIssues.length,
                                items: boothAggregates.localIssues,
                                listPath: '/Local-Issue',
                                detailPath: '/Local-Issue'
                            }
                        });
                    }

                    // Samiti
                    if (boothAggregates.samitis && boothAggregates.samitis.length > 0) {
                        sections.push({
                            title: `👥 Samiti (${boothAggregates.samitis.length})`,
                            list: boothAggregates.samitis.slice(0, 5).map(s => 
                                `${s.samiti_name || 'Samiti'} - ${s.leader || ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.samitis.length,
                                items: boothAggregates.samitis,
                                listPath: '/samitis',
                                detailPath: '/samitis'
                            }
                        });
                    }

                    // Work Status
                    if (boothAggregates.workStatuses && boothAggregates.workStatuses.length > 0) {
                        sections.push({
                            title: `🔨 Work Status (${boothAggregates.workSummary?.total || 0})`,
                            items: boothAggregates.workSummary ? [
                                { label: 'Total', value: boothAggregates.workSummary.total },
                                { label: 'Completed', value: boothAggregates.workSummary.completed },
                                { label: 'In Progress', value: boothAggregates.workSummary.inProgress },
                                { label: 'Pending', value: boothAggregates.workSummary.pending }
                            ] : [],
                            list: boothAggregates.workStatuses.slice(0, 3).map(w => 
                                `${w.work_name || 'Work'} - ${w.status || w.progress || ''}`
                            ),
                            viewMore: {
                                count: boothAggregates.workStatuses.length,
                                items: boothAggregates.workStatuses,
                                listPath: '/Work-Status',
                                detailPath: '/Work-Status'
                            }
                        });
                    }

                    // Winning Assembly
                    if (boothAggregates.winningParties && boothAggregates.winningParties.length > 0) {
                        sections.push({
                            title: `🏆 Winning Assembly (${boothAggregates.winningParties.length})`,
                            list: boothAggregates.winningParties.slice(0, 5).map(wp => 
                                `${wp.candidate_id?.name || wp.candidate_name || 'Candidate'} - ${wp.party_id?.name || wp.party_name || ''} (${wp.election_year?.year || wp.election_year || ''})`
                            ),
                            viewMore: {
                                count: boothAggregates.winningParties.length,
                                items: boothAggregates.winningParties,
                                listPath: '/WinningPartiesList',
                                detailPath: '/WinningPartiesList'
                            }
                        });
                    }

                    // Booth Votes
                    if (boothAggregates.boothVotes && boothAggregates.boothVotes.length > 0) {
                        sections.push({
                            title: `🗳️ Booth Votes (${boothAggregates.boothVotes.length})`,
                            list: boothAggregates.boothVotes.slice(0, 5).map(v => 
                                `${typeof v.candidate_name === 'string' ? v.candidate_name : (v.candidate_name?.name || v.party_name || 'Candidate')} - Votes: ${v.votes ?? v.vote_count ?? 'N/A'}`
                            ),
                            viewMore: {
                                count: boothAggregates.boothVotes.length,
                                items: boothAggregates.boothVotes,
                                listPath: '/Booth-Votes',
                                detailPath: '/Booth-Votes'
                            }
                        });
                    }
                }
                break;
        }

        // Convert sections to JSX
        return (
            <div className="panel-sections">
                {sections.length > 0 ? (
                    sections.map((section, index) => (
                        <div key={index} className="panel-section">
                            <h4 className="section-title">{section.title}</h4>
                            
                            {section.items && (
                                <div className="section-items">
                                    {section.items.map((item, itemIndex) => (
                                        <div key={itemIndex} className="section-item">
                                            <span className="item-label">{item.label}:</span>
                                            <span className="item-value">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {section.html && (
                                <div 
                                    className="section-html-content"
                                    style={{
                                        padding: '10px',
                                        backgroundColor: '#f9f9f9',
                                        borderRadius: '6px',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        color: '#444'
                                    }}
                                    dangerouslySetInnerHTML={{ __html: section.html }}
                                />
                            )}
                            
                            {section.list && (
                                <div className="section-list">
                                    <ul>
                                        {section.list.map((listItem, listIndex) => {
                                            // Make list items clickable if viewMore exists
                                            if (section.viewMore && section.viewMore.items && section.viewMore.items[listIndex]) {
                                                const item = section.viewMore.items[listIndex];
                                                const entityId = getEntityId(item);
                                                const detailPath = section.viewMore.detailPath;
                                                
                                                return (
                                                    <li 
                                                        key={listIndex}
                                                        style={{ cursor: 'pointer', color: '#007bff' }}
                                                        onClick={() => {
                                                            if (entityId && detailPath) {
                                                                console.debug('🔗 Navigating to:', `${detailPath}/${entityId}`, 'from item:', item);
                                                                navigate(`/election${detailPath}/${entityId}`);
                                                            }
                                                        }}
                                                    >
                                                        {listItem}
                                                    </li>
                                                );
                                            }
                                            return <li key={listIndex}>{listItem}</li>;
                                        })}
                                    </ul>
                                </div>
                            )}

                            {section.viewMore && section.viewMore.count > 0 && (
                                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                                    <button
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                        onClick={() => {
                                            const firstItem = section.viewMore.items && section.viewMore.items[0];
                                            const entityId = getEntityId(firstItem);
                                            const detailPath = section.viewMore.detailPath;
                                            const listPath = section.viewMore.listPath;
                                            
                                            if (entityId && detailPath) {
                                                console.debug('🔗 View more navigating to detail:', `${detailPath}/${entityId}`);
                                                navigate(`/election${detailPath}/${entityId}`);
                                            } else if (listPath) {
                                                console.debug('🔗 View more navigating to list:', listPath, 'with booth filter');
                                                navigate(`/election${listPath}`, {
                                                    state: {
                                                        boothId: properties.id || properties._id,
                                                        boothNumber: properties.BoothNo || properties.boothNo || properties.booth_number,
                                                        boothName: properties.BoothName || properties.boothName || properties.name
                                                    }
                                                });
                                            }
                                        }}
                                    >
                                        View more ({section.viewMore.count})
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="panel-section">
                        <h4 className="section-title">Basic Information</h4>
                        <div className="section-items">
                            <div className="section-item">
                                <span className="item-label">Name:</span>
                                <span className="item-value">{properties.name || properties.Name || 'Unknown'}</span>
                            </div>
                            <div className="section-item">
                                <span className="item-label">Level:</span>
                                <span className="item-value">{level}</span>
                            </div>
                            <div className="section-item">
                                <span className="item-label">Status:</span>
                                <span className="item-value">Data loading or unavailable</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Function to close the panel
    const closePanel = () => {
        setIsPanelOpen(false);
        setPanelData({});
        setPanelLevel('');
        setBoothAggregates(null);
        setSelectedBoothDetails(null);
    };

    const generatePopupContent = (feature, level) => {
        const properties = feature.properties;
        const featureId = properties.id;

        // Create consistent cache key that matches how data is stored
        let cacheKey;
        if (level === 'parliamentary') {
            // Use pcNo (parliament number) for consistent matching
            const parliamentId = properties.pcNo || properties.parliamentId || properties.parliament_no || properties.id;
            cacheKey = `${level}_${parliamentId}`;
        } else if (level === 'assembly') {
            // For assembly, use AC_NO (Assembly Constituency Number) which should match database
            const assemblyId = properties.AC_NO || properties.acNo || properties.assembly_no || properties.assemblyNo || properties.id;
            cacheKey = `${level}_${assemblyId}`;
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
                const stateData = data.stateData || {};
                const stateGenderData = data.genderData || {};
                const stateWinningData = data.winningData || {};
                
                content += `
                    <p><strong>State Name:</strong> ${stateData.name || properties.Name || 'Madhya Pradesh'}</p>
                    <p><strong>Total Voters:</strong> ${stateGenderData.total ? Number(stateGenderData.total).toLocaleString() : '—'}</p>
                    <p><strong>Total Male Voters:</strong> ${stateGenderData.male ? Number(stateGenderData.male).toLocaleString() : '—'}</p>
                    <p><strong>Total Female Voters:</strong> ${stateGenderData.female ? Number(stateGenderData.female).toLocaleString() : '—'}</p>
                    <p><strong>Winning Party 2023:</strong> ${stateWinningData.winner_2023 || 'BJP'}</p>
                    <p><strong>Winning Party 2018:</strong> ${stateWinningData.winner_2018 || 'INC'}</p>
                    <p><strong>Winning Party 2013:</strong> ${stateWinningData.winner_2013 || 'BJP'}</p>
                    
                    <div class="hover-stat" style="flex-basis:100%"><p style="font-size: 0.9em; color: #666; margin:0">Click to view Divisions</p></div>`;
                break;
            case 'division':
                const divisionData = data.divisionData || {};
                const parliamentsData = data.parliamentsData || [];
                
                content += `
                    <p><strong>Division Name:</strong> ${divisionData.name || properties.name || properties.Name || ''}</p>
                    <p><strong>State Name:</strong> ${divisionData.state_id?.name || 'Madhya Pradesh'}</p>
                    <p><strong>Total Parliamentary Constituencies:</strong> ${parliamentsData.length || '—'}</p>
                    
                    ${parliamentsData.length > 0 ? 
                        `<p><strong>Parliamentary Constituencies:</strong></p>
                        <ul style="margin: 5px 0; padding-left: 20px; max-height: 120px; overflow-y: auto;">
                            ${parliamentsData.slice(0, 8).map(pc =>
                            `<li>${pc.name} – ${pc.parliament_no}</li>`
                        ).join('')}
                        ${parliamentsData.length > 8 ? `<li>... and ${parliamentsData.length - 8} more</li>` : ''}
                        </ul>`
                        : ''}
                    
                    <div class="hover-stat" style="flex-basis:100%"><p style="font-size: 0.9em; color: #666; margin:0">Click to view Parliamentary Constituencies</p></div>`;
                break;
            case 'parliamentary':
                const parliamentData = data.parliamentData || {};
                const parliamentGenderData = data.genderData || {};
                const parliamentWinningData = data.winningData || {};
                const assembliesData = data.assembliesData || [];
                const totalBooths = data.totalBooths || 0;

                content += `
                    <p><strong>Parliament Name:</strong> ${parliamentData.name || properties.name || ''}</p>
                    <p><strong>Parliament No:</strong> ${parliamentData.parliament_no || properties.pcNo || ''}</p>
                    <p><strong>Division Name:</strong> ${parliamentData.division_id?.name || properties.divisionName || ''}</p>
                    <p><strong>State Name:</strong> ${parliamentData.state_id?.name || 'Madhya Pradesh'}</p>
                    <p><strong>Total Voters in PC:</strong> ${parliamentGenderData.total ? Number(parliamentGenderData.total).toLocaleString() : '—'}</p>
                    <p><strong>Total Male Voters:</strong> ${parliamentGenderData.male ? Number(parliamentGenderData.male).toLocaleString() : '—'}</p>
                    <p><strong>Total Female Voters:</strong> ${parliamentGenderData.female ? Number(parliamentGenderData.female).toLocaleString() : '—'}</p>
                    <p><strong>Winning Party 2024:</strong> ${parliamentWinningData.winner_2024 || 'BJP'}</p>
                    <p><strong>Winning Party 2019:</strong> ${parliamentWinningData.winner_2019 || 'BJP'}</p>
                    <p><strong>Winning Party 2014:</strong> ${parliamentWinningData.winner_2014 || 'BJP'}</p>
                    <p><strong>Current MP Name:</strong> ${parliamentWinningData.current_mp || '—'}</p>
                    <p><strong>Total Booths:</strong> ${totalBooths || '—'}</p>
                    <p><strong>Total Assembly:</strong> ${assembliesData.length || '—'}</p>
                    
                    ${assembliesData.length > 0 ? 
                        `<p><strong>Assembly List:</strong></p>
                        <ul style="margin: 5px 0; padding-left: 20px; max-height: 120px; overflow-y: auto; font-size: 12px;">
                            ${assembliesData.map((assembly, index) =>
                            `<li>${index + 1}. ${assembly.name} – ${assembly.AC_NO || 'N/A'}</li>`
                        ).join('')}
                        </ul>`
                        : ''}`;
                break;
            case 'assembly':
                const assemblyData = data.assemblyData || {};
                const assemblyGenderData = data.genderData || {};
                const assemblyWinningData = data.winningData || {};
                const assemblyTotalBooths = data.totalBooths || 0;
                
                content += `
                    <p><strong>Assembly Name:</strong> ${assemblyData.name || properties.name || ''}</p>
                    <p><strong>Parliament Name:</strong> ${assemblyData.parliament_id?.name || properties.pcName || ''}</p>
                    <p><strong>Division Name:</strong> ${assemblyData.division_id?.name || properties.divisionName || ''}</p>
                    <p><strong>State Name:</strong> ${assemblyData.state_id?.name || 'Madhya Pradesh'}</p>
                    <p><strong>Total Voters:</strong> ${assemblyGenderData.total ? Number(assemblyGenderData.total).toLocaleString() : '—'}</p>
                    <p><strong>Total Male Voters:</strong> ${assemblyGenderData.male ? Number(assemblyGenderData.male).toLocaleString() : '—'}</p>
                    <p><strong>Total Female Voters:</strong> ${assemblyGenderData.female ? Number(assemblyGenderData.female).toLocaleString() : '—'}</p>
                    <p><strong>Current MLA Name:</strong> ${assemblyWinningData.current_mla || '—'}</p>
                    <p><strong>Total Booths:</strong> ${assemblyTotalBooths || '—'}</p>`;
                break;
            case 'block':
                const blockData = data.blockData || {};
                const blockGenderData = data.genderData || {};
                const blockTotalBooths = data.totalBooths || 0;
                
                content += `
                    <p><strong>Block Name:</strong> ${blockData.name || properties.name || properties.BlockName || ''}</p>
                    <p><strong>Assembly Name:</strong> ${blockData.assembly_id?.name || properties.acName || properties.AC_NAME || ''}</p>
                    <p><strong>Parliament Name:</strong> ${blockData.parliament_id?.name || properties.pcName || ''}</p>
                    <p><strong>Division Name:</strong> ${blockData.division_id?.name || properties.divisionName || ''}</p>
                    <p><strong>State Name:</strong> ${blockData.state_id?.name || 'Madhya Pradesh'}</p>
                    <p><strong>Total Booths:</strong> ${blockTotalBooths || properties.totalBooths || '—'}</p>`;
                break;
            case 'booth':
                const boothGenderData = data.genderData || {};
                const boothData = data.boothData || {}; // Additional booth data from API
                
                // Use booth data from API if available, otherwise fall back to polygon properties
                const boothName = boothData.name || properties.BoothName || properties.boothName || '—';
                const boothNumber = boothData.booth_number || properties.BoothNo || properties.boothNo || '—';
                const blockName = boothData.block_id?.name || properties.BlockName || properties.blockName || '—';
                const assemblyName = boothData.assembly_id?.name || properties.AC_NAME || '—';
                const parliamentName = boothData.parliament_id?.name || '—';
                const divisionName = boothData.division_id?.name || '—';
                
                content += `
                    <p><strong>Booth Name:</strong> ${boothName}</p>
                    <p><strong>Block Name:</strong> ${blockName}</p>
                    <p><strong>Assembly Name:</strong> ${assemblyName}</p>
                    <p><strong>Parliament Name:</strong> ${parliamentName}</p>
                    <p><strong>Division Name:</strong> ${divisionName}</p>
                    <p><strong>State Name:</strong> Madhya Pradesh</p>
                    <p><strong>Booth Number:</strong> ${boothNumber}</p>
                    <p><strong>Total Voters:</strong> ${boothGenderData.total ? Number(boothGenderData.total).toLocaleString() : '—'}</p>
                    <p><strong>Total Male Voters:</strong> ${boothGenderData.male ? Number(boothGenderData.male).toLocaleString() : '—'}</p>
                    <p><strong>Total Female Voters:</strong> ${boothGenderData.female ? Number(boothGenderData.female).toLocaleString() : '—'}</p>`;
                break;
        }

        // Close body and root wrappers
        content += `</div></div>`;
        return content;
    };

    return (
        <MainCard>
            <div>
                {/* Info Banner */}
                <div style={{
                    background: 'linear-gradient(90deg, #e3f2fd, #f3e5f5)',
                    padding: '8px 15px',
                    marginBottom: '10px',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0',
                    fontSize: '13px',
                    color: '#555',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '15px'
                }}>
                    <span>📱 <strong>Single Click:</strong> View dynamic data</span>
                    <span style={{ color: '#ccc' }}>|</span>
                    <span>🔄 <strong>Double Click:</strong> Navigate to next level</span>
                </div>

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
                                        `Current: ${selectedFeature.properties.name} (${capitalize(currentLevel)})` :
                                        `Level: ${capitalize(currentLevel)}`
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

                {/* MUI Drawer for Booth Level - Matching BoothMap Style */}
                {panelLevel === 'booth' && selectedBoothDetails && (
                    <Drawer
                        anchor="right"
                        open={isPanelOpen}
                        onClose={() => setIsPanelOpen(false)}
                        sx={{
                            '& .MuiDrawer-paper': {
                                width: 450,
                                boxSizing: 'border-box',
                                p: 3
                            }
                        }}
                    >
                        <Stack spacing={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h5" fontWeight={700}>
                                    Booth Details
                                </Typography>
                                <Typography variant="caption" color="primary" fontWeight={600}>
                                    ID: {selectedBoothDetails._id}
                                </Typography>
                            </Box>
                            <Divider />
                            
                            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.primary.lighter }}>
                                <Stack spacing={2}>
                                    <Typography variant="h6" fontWeight={700} color="primary">
                                        Basic Information
                                    </Typography>
                                    
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Booth Number
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color="primary">
                                            {selectedBoothDetails.booth_number || 'N/A'}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Booth Name
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {selectedBoothDetails.booth_name || 'N/A'}
                                        </Typography>
                                    </Box>

                                    {selectedBoothDetails.full_address && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Full Address
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedBoothDetails.full_address}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>

                            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.success.lighter }}>
                                <Stack spacing={2}>
                                    <Typography variant="h6" fontWeight={700} color="success.dark">
                                        Location Hierarchy
                                    </Typography>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            State
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedBoothDetails.state_name}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Division
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedBoothDetails.division_name}
                                        </Typography>
                                    </Box>

                                    {selectedBoothDetails.district_name && selectedBoothDetails.district_name !== 'N/A' && (
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                District
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedBoothDetails.district_name}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Block
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedBoothDetails.block_name}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Assembly Constituency
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedBoothDetails.assembly_name}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Parliament Constituency
                                        </Typography>
                                        <Typography variant="body1">
                                            {selectedBoothDetails.parliament_name}
                                        </Typography>
                                    </Box>

                                    <Box>
                                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                            Election Year
                                        </Typography>
                                        <Typography variant="body1" fontWeight={600}>
                                            {selectedBoothDetails.election_year}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>

                            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.info.lighter }}>
                                <Stack spacing={2}>
                                    <Typography variant="h6" fontWeight={700} color="info.dark">
                                        Voter Statistics
                                    </Typography>

                                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Total Voters
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700} color="primary">
                                                {selectedBoothDetails.total_voters}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Male Voters
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700} color="info.main">
                                                {selectedBoothDetails.male_voters}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Female Voters
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700} color="secondary.main">
                                                {selectedBoothDetails.female_voters}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                                Other Voters
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700} color="warning.main">
                                                {selectedBoothDetails.other_voters}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {selectedBoothDetails.total_voters > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                                                Gender Distribution
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                                        Male: {((selectedBoothDetails.male_voters / selectedBoothDetails.total_voters) * 100).toFixed(1)}%
                                                    </Typography>
                                                    <Box sx={{ 
                                                        height: 8, 
                                                        backgroundColor: theme.palette.info.main, 
                                                        borderRadius: 1,
                                                        width: `${(selectedBoothDetails.male_voters / selectedBoothDetails.total_voters) * 100}%`
                                                    }} />
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                                                        Female: {((selectedBoothDetails.female_voters / selectedBoothDetails.total_voters) * 100).toFixed(1)}%
                                                    </Typography>
                                                    <Box sx={{ 
                                                        height: 8, 
                                                        backgroundColor: theme.palette.secondary.main, 
                                                        borderRadius: 1,
                                                        width: `${(selectedBoothDetails.female_voters / selectedBoothDetails.total_voters) * 100}%`
                                                    }} />
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>

                            {/* Aggregated Sections - MUI Style */}
                            {(() => {
                                const S = ({ title, items = [], IconComp, renderPrimary, renderSecondary, listPath, detailPath }) => (
                                    <Accordion key={title} sx={{ boxShadow: 'none', mb: 1 }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                                                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 36, height: 36 }}>
                                                    <IconComp style={{ color: '#fff' }} fontSize="small" />
                                                </Avatar>
                                                <Typography variant="subtitle2">{title}</Typography>
                                                <Chip label={items?.length || 0} size="small" sx={{ ml: 'auto' }} />
                                            </Stack>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {boothAggregatesLoading && !boothAggregates ? (
                                                <Skeleton variant="rectangular" height={80} />
                                            ) : (items && items.length > 0) ? (
                                                <List dense>
                                                    {items.slice(0, 5).map((it, idx) => {
                                                        const entityId = getEntityId(it);
                                                        return (
                                                            <ListItem
                                                                key={idx}
                                                                sx={{
                                                                    cursor: entityId && detailPath ? 'pointer' : 'default',
                                                                    '&:hover': entityId && detailPath ? { bgcolor: 'action.hover' } : {}
                                                                }}
                                                                onClick={() => {
                                                                    if (entityId && detailPath) {
                                                                        console.debug('🔗 List Item Click - Navigating to:', `${detailPath}/${entityId}`);
                                                                        console.debug('📦 Item data:', it);
                                                                        console.debug('🆔 Extracted ID:', entityId);
                                                                        navigate(`${detailPath}/${entityId}`);
                                                                    } else {
                                                                        console.warn('⚠️ Cannot navigate - entityId:', entityId, 'detailPath:', detailPath, 'item:', it);
                                                                    }
                                                                }}
                                                            >
                                                                <ListItemAvatar>
                                                                    <Avatar sx={{ bgcolor: theme.palette.success.lighter, color: theme.palette.success.dark }}>
                                                                        <IconComp fontSize="small" />
                                                                    </Avatar>
                                                                </ListItemAvatar>
                                                                <ListItemText
                                                                    primary={renderPrimary(it)}
                                                                    secondary={renderSecondary(it)}
                                                                />
                                                            </ListItem>
                                                        );
                                                    })}
                                                </List>
                                            ) : (
                                                <Typography variant="body2">No records found.</Typography>
                                            )}

                                            {listPath && items && items.length > 0 && selectedBoothDetails && (
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                                    <Button 
                                                        size="small" 
                                                        variant="contained"
                                                        onClick={() => {
                                                            const firstItem = items[0];
                                                            const entityId = getEntityId(firstItem);
                                                            console.debug('🔘 View More Click');
                                                            console.debug('📦 First item:', firstItem);
                                                            console.debug('🆔 Extracted ID:', entityId);
                                                            console.debug('🎯 Detail path:', detailPath);
                                                            console.debug('📋 List path:', listPath);
                                                            
                                                            if (entityId && detailPath) {
                                                                console.debug('✅ Navigating to detail page:', `${detailPath}/${entityId}`);
                                                                navigate(`${detailPath}/${entityId}`);
                                                            } else if (listPath) {
                                                                console.debug('✅ Navigating to list page with booth filter:', listPath);
                                                                navigate(listPath, {
                                                                    state: {
                                                                        boothId: selectedBoothDetails._id,
                                                                        boothNumber: selectedBoothDetails.booth_number,
                                                                        boothName: selectedBoothDetails.booth_name
                                                                    }
                                                                });
                                                            } else {
                                                                console.error('❌ Cannot navigate - no entityId or listPath available');
                                                            }
                                                        }}
                                                    >
                                                        View more
                                                    </Button>
                                                </Box>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                );

                                return (
                                    <Box>
                                        {/* Gender Summary Paper */}
                                        <Paper elevation={0} sx={{ p: 1, mb: 1 }}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar sx={{ bgcolor: theme.palette.info.main, width: 40, height: 40 }}>
                                                    <GroupIcon style={{ color: '#fff' }} />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2">Gender</Typography>
                                                    {boothAggregates?.gender ? (
                                                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                            <Chip label={`M ${boothAggregates.gender.male}`} color="info" size="small" />
                                                            <Chip label={`F ${boothAggregates.gender.female}`} color="secondary" size="small" />
                                                            <Chip label={`O ${boothAggregates.gender.others}`} size="small" />
                                                            <Chip label={`T ${boothAggregates.gender.total}`} variant="outlined" size="small" />
                                                        </Stack>
                                                    ) : boothAggregatesLoading ? (
                                                        <Skeleton variant="text" width={120} />
                                                    ) : (
                                                        <Typography variant="caption">No gender data</Typography>
                                                    )}
                                                </Box>
                                            </Stack>
                                        </Paper>

                                        {S({
                                            title: `Events (${boothAggregates?.events?.length || 0})`,
                                            items: boothAggregates?.events || [],
                                            IconComp: EventIcon,
                                            renderPrimary: (ev) => ev.title || ev.event_name || 'Event',
                                            renderSecondary: (ev) => ev.date ? new Date(ev.date).toLocaleDateString('en-IN') : ev.location || '',
                                            listPath: '/Events',
                                            detailPath: '/Events'
                                        })}

                                        {S({
                                            title: `Party Activities (${boothAggregates?.partyActivities?.length || 0})`,
                                            items: boothAggregates?.partyActivities || [],
                                            IconComp: FlagIcon,
                                            renderPrimary: (a) => a.activity_name || a.title || 'Activity',
                                            renderSecondary: (a) => a.date ? new Date(a.date).toLocaleDateString('en-IN') : a.description || '',
                                            listPath: '/party-activities',
                                            detailPath: '/party-activities'
                                        })}

                                        {S({
                                            title: `Visits (${boothAggregates?.visits?.length || 0})`,
                                            items: boothAggregates?.visits || [],
                                            IconComp: VisibilityIcon,
                                            renderPrimary: (v) => `${v.candidate_id?.name || v.person_name || 'Visit'}`,
                                            renderSecondary: (v) => v.date ? new Date(v.date).toLocaleDateString('en-IN') : v.locationName || '',
                                            listPath: '/visits',
                                            detailPath: '/visits'
                                        })}

                                        {S({
                                            title: `Influencers (${boothAggregates?.influencers?.length || 0})`,
                                            items: boothAggregates?.influencers || [],
                                            IconComp: AccountCircleIcon,
                                            renderPrimary: (p) => p.name || p.person_name || p.phone || 'Influencer',
                                            renderSecondary: (p) => p.designation || p.address || '',
                                            listPath: '/Influancer',
                                            detailPath: '/Influancer'
                                        })}

                                        {S({
                                            title: `Volunteers (${boothAggregates?.volunteers?.length || 0})`,
                                            items: boothAggregates?.volunteers || [],
                                            IconComp: VolunteerActivismIcon,
                                            renderPrimary: (p) => p.name || p.username || p.phone || 'Volunteer',
                                            renderSecondary: (p) => p.party?.name || p.role || '',
                                            listPath: '/booth-volunteer',
                                            detailPath: '/booth-volunteer'
                                        })}

                                        {S({
                                            title: `Government Schemes (${boothAggregates?.governments?.length || 0})`,
                                            items: boothAggregates?.governments || [],
                                            IconComp: LocalHospitalIcon,
                                            renderPrimary: (s) => s.name || 'Scheme',
                                            renderSecondary: (s) => s.amount ? `₹${Number(s.amount).toLocaleString()}` : s.type || '',
                                            listPath: '/Government-Schema',
                                            detailPath: '/Government-Schema'
                                        })}

                                        {S({
                                            title: `Local Issues (${boothAggregates?.localIssues?.length || 0})`,
                                            items: boothAggregates?.localIssues || [],
                                            IconComp: ReportProblemIcon,
                                            renderPrimary: (it) => it.issue_name || 'Issue',
                                            renderSecondary: (it) => it.status || it.priority || '',
                                            listPath: '/Local-Issue',
                                            detailPath: '/Local-Issue'
                                        })}

                                        {S({
                                            title: `Samiti (${boothAggregates?.samitis?.length || 0})`,
                                            items: boothAggregates?.samitis || [],
                                            IconComp: GroupIcon,
                                            renderPrimary: (s) => s.samiti_name || 'Samiti',
                                            renderSecondary: (s) => s.leader || '',
                                            listPath: '/samitis',
                                            detailPath: '/samitis'
                                        })}

                                        {S({
                                            title: `Work Status (${boothAggregates?.workSummary?.total || 0})`,
                                            items: boothAggregates?.workStatuses || [],
                                            IconComp: ConstructionIcon,
                                            renderPrimary: (w) => w.work_name || 'Work',
                                            renderSecondary: (w) => w.status || w.progress || '',
                                            listPath: '/Work-Status',
                                            detailPath: '/Work-Status'
                                        })}

                                        {S({
                                            title: `Winning Assembly (${boothAggregates?.winningParties?.length || 0})`,
                                            items: boothAggregates?.winningParties || [],
                                            IconComp: EmojiEventsIcon,
                                            renderPrimary: (wp) => wp.candidate_id?.name || wp.candidate_name || 'Candidate',
                                            renderSecondary: (wp) => `${wp.party_id?.name || wp.party_name || ''} • ${wp.election_year?.year || wp.election_year || ''}`,
                                            listPath: '/WinningPartiesList',
                                            detailPath: '/WinningPartiesList'
                                        })}

                                        {S({
                                            title: `Booth Votes (${boothAggregates?.boothVotes?.length || 0})`,
                                            items: boothAggregates?.boothVotes || [],
                                            IconComp: HowToVoteIcon,
                                            renderPrimary: (v) => (typeof v.candidate_name === 'string' ? v.candidate_name : (v.candidate_name?.name || v.party_name || 'Candidate')),
                                            renderSecondary: (v) => `Votes: ${v.votes ?? v.vote_count ?? 'N/A'}`,
                                            listPath: '/Booth-Votes',
                                            detailPath: '/Booth-Votes'
                                        })}
                                    </Box>
                                );
                            })()}
                        </Stack>
                    </Drawer>
                )}

                {/* Sliding Panel for other levels (state, division, parliament, assembly, block) */}
                {panelLevel !== 'booth' && isPanelOpen && panelData && (
                    <>
                        {/* Overlay */}
                        <div 
                            className="panel-overlay"
                            onClick={() => setIsPanelOpen(false)}
                        ></div>
                        
                        {/* Panel */}
                        <div className={`sliding-panel ${isPanelOpen ? 'open' : ''}`}>
                            <div className="panel-header">
                                <h3 className="panel-title">
                                    {panelData.feature.properties.name || panelData.feature.properties.Name || 'Details'}
                                </h3>
                                <div style={{ 
                                    fontSize: '12px', 
                                    color: '#666', 
                                    marginTop: '5px',
                                    fontStyle: 'italic'
                                }}>
                                    💡 Single click: View data | Double click: Navigate deeper
                                </div>
                                <button 
                                    className="panel-close-btn"
                                    onClick={() => setIsPanelOpen(false)}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>
                            
                            <div className="panel-content">
                                {isPanelLoading ? (
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '200px',
                                        fontSize: '16px',
                                        color: '#666'
                                    }}>
                                        <div>
                                            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                                Loading dynamic data...
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    width: '30px',
                                                    height: '30px',
                                                    border: '3px solid #f3f3f3',
                                                    borderTop: '3px solid #007bff',
                                                    borderRadius: '50%',
                                                    animation: 'spin 1s linear infinite',
                                                    margin: '0 auto'
                                                }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    generatePanelContent(panelData.feature, panelData.level, panelData.data)
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainCard>
    );
};

export default HierarchicalMap;
