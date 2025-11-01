import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Tabs, Tab, Typography, Alert, Stack, FormControl, InputLabel, Select, MenuItem, Button, Paper, Drawer
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';
import CloseIcon from '@mui/icons-material/Close';

const mapConfiguration = {
    mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN,
    minZoom: 1
};

const MAPBOX_THEMES = {
    light: 'mapbox://styles/mapbox/light-v10',
    dark: 'mapbox://styles/mapbox/dark-v10',
    streets: 'mapbox://styles/mapbox/streets-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};

const VisitMapTabs = () => {
    const theme = useTheme();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    const [activeTab, setActiveTab] = useState(0);

    // Visit Map States
    const [mapVisits, setMapVisits] = useState([]);
    const [popupInfo, setPopupInfo] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState('streets');
    const [routeData, setRouteData] = useState(null);
    const [yearFilter, setYearFilter] = useState('');
    const [electionYears, setElectionYears] = useState([]);
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [drawerType, setDrawerType] = useState(null);
    const [boothsWithVisits, setBoothsWithVisits] = useState(new Set());
    const visitMapRef = useRef(null);

    // Visit Booth Map States
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [boothsWithWorkStatus, setBoothsWithWorkStatus] = useState(new Set());
    const [blocks, setBlocks] = useState([]);
    const workStatusMapRef = useRef(null);

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all data' };
        }

        const levelNames = {
            state: 'State',
            division: 'Division',
            parliament: 'Parliament',
            assembly: 'Assembly',
            block: 'Block',
            booth: 'Booth'
        };

        const levelName = levelNames[highestLevel] || highestLevel;
        const entityName = userHierarchy[highestLevel]?.name || 'Unknown';

        return {
            level: levelName,
            entity: entityName,
            description: `You have access to data for ${entityName} ${levelName} and all areas within it`
        };
    };

    const accessScope = getUserAccessScope();

    // Fetch visit data for map
    const fetchMapVisits = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Add hierarchy-based filtering
            let query = 'all=true&limit=50000';
            if (userHierarchy) {
                const highestLevel = getUserHighestLevel();
                if (highestLevel) {
                    switch (highestLevel.level) {
                        case 'state':
                            query += `&state_id=${highestLevel.value}`;
                            break;
                        case 'division':
                            query += `&division_id=${highestLevel.value}`;
                            break;
                        case 'parliament':
                            query += `&parliament_id=${highestLevel.value}`;
                            break;
                        case 'assembly':
                            query += `&assembly_id=${highestLevel.value}`;
                            break;
                        case 'block':
                            query += `&block_id=${highestLevel.value}`;
                            break;
                        case 'booth':
                            query += `&booth_id=${highestLevel.value}`;
                            break;
                    }
                }
            }

            // Add year filter if selected
            if (yearFilter) {
                query += `&year=${yearFilter}`;
            }

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/visits?${query}`, { headers });
            const json = await res.json();

            if (json && json.success) {
                const rawVisits = Array.isArray(json.data) ? json.data : [];
                if (rawVisits.length === 0) {
                    setMapVisits([]);
                    setRouteData(null);
                    return;
                }

                const visitsWithCoords = rawVisits
                    .map(v => ({
                        ...v,
                        latitude: v.latitude !== undefined && v.latitude !== null && v.latitude !== '' ? Number(v.latitude) : NaN,
                        longitude: v.longitude !== undefined && v.longitude !== null && v.longitude !== '' ? Number(v.longitude) : NaN
                    }))
                    .filter(v => !isNaN(v.latitude) && !isNaN(v.longitude));

                setMapVisits(visitsWithCoords);

                // Track booths (by booth number) that have visits
                const boothNumbersWithVisits = new Set();
                rawVisits.forEach(visit => {
                    const boothNumber = visit?.booth_id?.booth_number;
                    if (boothNumber !== undefined && boothNumber !== null) {
                        boothNumbersWithVisits.add(String(boothNumber));
                    }
                });
                setBoothsWithVisits(boothNumbersWithVisits);

                if (visitsWithCoords.length > 1) {
                    const coordinates = visitsWithCoords.map(v => [v.longitude, v.latitude]);
                    setRouteData({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: coordinates
                        }
                    });
                } else {
                    setRouteData(null);
                }
            } else {
                console.error('Failed to fetch visits:', json);
                setMapVisits([]);
                setRouteData(null);
            }
        } catch (error) {
            console.error('Error loading visit data:', error);
            setMapVisits([]);
            setRouteData(null);
        }
    };

    // Load booth polygons for visit map
    const loadBoothPolygonsForVisits = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const apiUrl = import.meta.env.VITE_APP_API_URL || 'https://myhostmanager.co.in/backend/api';
            const url = `${apiUrl}/booth-polygons?limit=50000&page=1`;
            const resp = await fetch(url, { headers });

            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const j = await resp.json();

            let features = j.features || j.data || [];
            if (features.length === 1 && features[0] && features[0].features && Array.isArray(features[0].features)) {
                features = features[0].features;
            }
            if (!features || !Array.isArray(features) || features.length === 0) {
                setMapError('No booth polygons found');
                setBoothGeoJSON(null);
                return;
            }
            const fc = { type: 'FeatureCollection', features };
            setBoothGeoJSON(fc);
        } catch (e) {
            console.error('Failed to load booth polygons:', e);
            setMapError(`Failed to load booth polygons: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    // Fetch booths with Visit Booth
    const fetchBoothsWithWorkStatus = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const workStatusRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/work-status?all=true&limit=50000`, { headers });
            const workStatusJson = await workStatusRes.json();
            if (workStatusJson.success && Array.isArray(workStatusJson.data)) {
                const boothIds = new Set();
                workStatusJson.data.forEach(workStatus => {
                    if (workStatus.booth_id) {
                        const boothId = workStatus.booth_id._id || workStatus.booth_id;
                        boothIds.add(String(boothId));
                    }
                });
                setBoothsWithWorkStatus(boothIds);
                console.log('✅ Booths with Visit Booth updated:', boothIds.size);
            }
        } catch (err) {
            console.warn('Failed to fetch booths with Visit Booth:', err);
        }
    };

    // Fetch Visit Booth data and booth polygons
    const loadBoothPolygonsByBlockNumber = async (blockNumberVal) => {
        if (!blockNumberVal) {
            setMapError('Please enter Block Number');
            return;
        }
        setMapError('');
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            fetchBoothsWithWorkStatus();

            if (blockNumberVal === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || 'https://myhostmanager.co.in/backend/api';
                const url = `${apiUrl}/booth-polygons?limit=50000&page=1`;
                const resp = await fetch(url, { headers });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const j = await resp.json();
                let features = j.features || j.data || [];
                if (features.length === 1 && features[0] && features[0].features && Array.isArray(features[0].features)) {
                    features = features[0].features;
                }
                if (!features || !Array.isArray(features) || features.length === 0) {
                    setMapError('No booth polygons found');
                    setBoothGeoJSON(null);
                    return;
                }
                const fc = { type: 'FeatureCollection', features };
                setBoothGeoJSON(fc);
                return;
            }

            const candidates = [
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block/${encodeURIComponent(blockNumberVal)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${encodeURIComponent(blockNumberVal)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons?block=${encodeURIComponent(blockNumberVal)}`
            ];

            let json = null;
            for (const url of candidates) {
                try {
                    const resp = await fetch(url, { headers });
                    if (!resp.ok) continue;
                    const j = await resp.json();
                    const features = j.features || (Array.isArray(j) ? j : (j.data || null));
                    if (features && Array.isArray(features) && features.length > 0) {
                        json = { type: 'FeatureCollection', features };
                        break;
                    }
                } catch (innerErr) {
                    console.warn('Error fetching booth polygons:', innerErr);
                }
            }

            if (!json) {
                setMapError(`No booth polygons found for block '${blockNumberVal}'`);
                setBoothGeoJSON(null);
                return;
            }

            const fc = { type: 'FeatureCollection', features: json.features };
            setBoothGeoJSON(fc);
        } catch (e) {
            console.error('Failed to load booth polygons:', e);
            setMapError(`Failed to load booth polygons: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    // Fetch reference data
    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [electionYearsRes, blocksRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers })
            ]);

            const [electionYearsData, blocksData] = await Promise.all([
                electionYearsRes.json(),
                blocksRes.json()
            ]);

            if (electionYearsData.success) setElectionYears(electionYearsData.data);
            if (blocksData.success) setBlocks(blocksData.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Fetch booth details and visits when a polygon is clicked
    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;

            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo).trim();
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr);
                if (!booth) {
                    booth = json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase());
                }
                if (!booth) {
                    booth = json.data.find(b => String(b.booth_number).trim().includes(boothNoStr) || boothNoStr.includes(String(b.booth_number).trim()));
                }
                if (!booth) {
                    console.warn(`No booth found for BoothNo: "${boothNoStr}"`);
                }
            } else {
                console.error('Failed to fetch booths:', json);
            }

            // Get visits for this booth
            let visits = [];
            if (booth && booth._id) {
                try {
                    const visitsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/visits?booth=${encodeURIComponent(booth._id)}&all=true`, { headers });
                    const visitsJson = await visitsRes.json();
                    if (visitsJson.success && Array.isArray(visitsJson.data)) {
                        visits = visitsJson.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch visits for booth:', e);
                }
            }

            setDrawerType('booth');
            setDrawerData({
                loading: false,
                boothNo,
                details: {
                    booth,
                    visits
                }
            });
            setDrawerOpen(true);
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            setDrawerType('booth');
            setDrawerData({ loading: false, boothNo, details: { booth: null, visits: [] }, error: e.message });
            setDrawerOpen(true);
        }
    };

    useEffect(() => {
        fetchMapVisits();
        fetchReferenceData();
    }, []);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleMarkerClick = (visit) => {
        // Group all visits at the same location as the clicked marker
        const normalize = (v) => {
            if (v && typeof v === 'string') return v.trim().toLowerCase();
            return '';
        };

        const locationKey = normalize(visit.locationName);
        const rounded = (n) => (typeof n === 'number' && !isNaN(n) ? Number(n.toFixed(4)) : null);
        const latKey = rounded(visit.latitude);
        const lngKey = rounded(visit.longitude);

        const visitsAtLocation = (Array.isArray(mapVisits) ? mapVisits : []).filter((v) => {
            const sameName = locationKey && normalize(v.locationName) === locationKey;
            const sameCoords = latKey !== null && lngKey !== null && rounded(v.latitude) === latKey && rounded(v.longitude) === lngKey;
            return sameName || sameCoords;
        });

        setDrawerType('location');
        setDrawerData({
            locationName: visit.locationName,
            latitude: visit.latitude,
            longitude: visit.longitude,
            visits: visitsAtLocation.length ? visitsAtLocation : [visit]
        });
        setDrawerOpen(true);
    };

    const handleThemeChange = (theme) => {
        setSelectedTheme(theme);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const workStatusColor = {
        'announced': 'default',
        'approved': 'info',
        'in progress': 'warning',
        'complete': 'success',
        'other': 'default',
        'speech subject': 'primary'
    };

    const TabPanel = ({ children, value, index, ...other }) => {
        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`map-tabpanel-${index}`}
                aria-labelledby={`map-tab-${index}`}
                {...other}
            >
                {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
            </div>
        );
    };

    return (
        <MainCard>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="map tabs">
                    <Tab label="Visit Locations Map" />
                    <Tab label="Visit Booth Map" />
                </Tabs>
            </Box>

            {/* Access Scope Information */}
            <Alert severity="info" sx={{ m: 2 }}>
                <Typography variant="body2">
                    <strong>Data Access:</strong> {accessScope.description}
                </Typography>
            </Alert>

            {/* Visit Locations Map Tab */}
            <TabPanel value={activeTab} index={0}>
                <Box sx={{ height: '600px' }}>
                    {/* Map Container */}
                    <Box sx={{ position: 'relative' }}>
                        <MapContainerStyled>
                            <Map
                                ref={visitMapRef}
                                initialViewState={{
                                    latitude: 23.4707,
                                    longitude: 77.9455,
                                    zoom: 6
                                }}
                                mapStyle={MAPBOX_THEMES[selectedTheme]}
                                mapboxAccessToken={mapConfiguration.mapboxAccessToken}
                                interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
                                onClick={(e) => {
                                    if (!boothGeoJSON) return;
                                    try {
                                        const map = visitMapRef.current && (typeof visitMapRef.current.getMap === 'function' ? visitMapRef.current.getMap() : visitMapRef.current);
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                            const point = e.point || { x: e.x, y: e.y };
                                            if (point) {
                                                features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                            }
                                        }

                                        const boothFeature = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                        if (boothFeature && boothFeature.properties) {
                                            const props = boothFeature.properties;
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                            if (boothNo) {
                                                setDrawerType('booth');
                                                setDrawerData({ loading: true, boothNo, details: { booth: null, visits: [] } });
                                                setDrawerOpen(true);
                                                fetchBoothDetailsByPolygon(boothNo);
                                            }
                                        }
                                    } catch (err) {
                                        console.warn('Error handling map click:', err);
                                    }
                                }}
                            >
                                <MapControl />

                                {/* India background layer */}
                                <Source id="india-source" type="geojson" data="/india.geojson">
                                    <Layer
                                        id="india-fill"
                                        type="fill"
                                        paint={{
                                            'fill-color': '#e0e0e0',
                                            'fill-opacity': 0.07
                                        }}
                                    />
                                    <Layer
                                        id="india-outline"
                                        type="line"
                                        paint={{
                                            'line-color': '#003366',
                                            'line-width': 1
                                        }}
                                    />
                                </Source>

                                {/* Booth Polygons */}
                                {boothGeoJSON && (
                                    <Source id="booth-polygons" type="geojson" data={boothGeoJSON}>
                                        <Layer
                                            id="booth-fill"
                                            type="fill"
                                            paint={{ 'fill-color': '#1E90FF', 'fill-opacity': 0.25 }}
                                        />
                                        <Layer id="booth-outline" type="line" paint={{ 'line-color': '#1E90FF', 'line-width': 2 }} />
                                        <Layer
                                            id="booth-label"
                                            type="symbol"
                                            layout={{
                                                'text-field': ['format', ['coalesce', ['get', 'BoothNo'], ['get', 'BoothNumber'], ['get', 'boothNo'], ['get', 'booth_number'], ['get', 'Booth_Name'], ['get', 'BoothName'], ['get', 'name'], ['literal', '']], { 'font-scale': 1 }, '\n', { 'font-scale': 0.85 }, ['coalesce', ['get', 'BoothName'], ['get', 'Booth_Name'], ['get', 'name'], ['literal', '']]],
                                                'text-size': 12,
                                                'text-offset': [0, 0.6],
                                                'text-anchor': 'top',
                                                'text-allow-overlap': true,
                                                'text-ignore-placement': true
                                            }}
                                            paint={{
                                                'text-color': '#000000',
                                                'text-halo-color': '#ffffff',
                                                'text-halo-width': 1
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* Visit Markers Layer */}
                                {boothGeoJSON && (
                                    <Source
                                        id="booth-markers"
                                        type="geojson"
                                        data={{
                                            type: 'FeatureCollection',
                                            features: boothGeoJSON.features.map(feature => {
                                                const props = feature.properties || {};
                                                const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;

                                                let coordinates = [0, 0];
                                                if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
                                                    const coords = feature.geometry.coordinates[0];
                                                    const lngs = coords.map(c => c[0]);
                                                    const lats = coords.map(c => c[1]);
                                                    coordinates = [
                                                        lngs.reduce((a, b) => a + b, 0) / lngs.length,
                                                        lats.reduce((a, b) => a + b, 0) / lats.length
                                                    ];
                                                } else if (feature.geometry?.type === 'MultiPolygon' && feature.geometry.coordinates?.[0]?.[0]) {
                                                    const coords = feature.geometry.coordinates[0][0];
                                                    const lngs = coords.map(c => c[0]);
                                                    const lats = coords.map(c => c[1]);
                                                    coordinates = [
                                                        lngs.reduce((a, b) => a + b, 0) / lngs.length,
                                                        lats.reduce((a, b) => a + b, 0) / lats.length
                                                    ];
                                                }

                                                const hasVisits = boothsWithVisits.has(String(boothNo));

                                                return {
                                                    type: 'Feature',
                                                    geometry: {
                                                        type: 'Point',
                                                        coordinates: coordinates
                                                    },
                                                    properties: {
                                                        ...props,
                                                        hasVisits: hasVisits
                                                    }
                                                };
                                            })
                                        }}
                                    >
                                        <Layer
                                            id="booth-visit-markers"
                                            type="circle"
                                            paint={{
                                                'circle-radius': 6,
                                                'circle-color': [
                                                    'case',
                                                    ['get', 'hasVisits'],
                                                    '#22c55e', // Green for booths with visits
                                                    '#ef4444'  // Red for booths without visits
                                                ],
                                                'circle-stroke-width': 2,
                                                'circle-stroke-color': '#ffffff',
                                                'circle-opacity': 0.9
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* Route line */}
                                {routeData && (
                                    <Source id="route" type="geojson" data={routeData}>
                                        <Layer
                                            id="route-line"
                                            type="line"
                                            paint={{
                                                'line-color': theme.palette.primary.main,
                                                'line-width': 2
                                            }}
                                        />
                                    </Source>
                                )}

                                {/* Markers for each visit */}
                                {mapVisits.map((visit, idx) => (
                                    <Marker
                                        key={idx}
                                        longitude={visit.longitude}
                                        latitude={visit.latitude}
                                        anchor="bottom"
                                    >
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                border: `2px solid ${theme.palette.primary.main}`,
                                                cursor: 'pointer',
                                                overflow: 'hidden'
                                            }}
                                            onClick={(e) => {
                                                if (e && e.stopPropagation) e.stopPropagation();
                                                handleMarkerClick(visit);
                                            }}
                                        >
                                            <img
                                                src={visit.candidate_id?.photo}
                                                alt={visit.candidate_id?.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                            />
                                        </Box>
                                    </Marker>
                                ))}

                            </Map>

                            {/* Map Controls */}
                            <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                                <select
                                    value={selectedTheme}
                                    onChange={(e) => handleThemeChange(e.target.value)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        backgroundColor: theme.palette.background.paper,
                                        color: theme.palette.text.primary
                                    }}
                                >
                                    {Object.keys(MAPBOX_THEMES).map((theme) => (
                                        <option key={theme} value={theme}>
                                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={yearFilter}
                                    onChange={(e) => {
                                        setYearFilter(e.target.value);
                                        setTimeout(() => fetchMapVisits(), 0);
                                    }}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: `1px solid ${theme.palette.divider}`,
                                        backgroundColor: theme.palette.background.paper,
                                        color: theme.palette.text.primary
                                    }}
                                >
                                    <option value="">All Years</option>
                                    {Array.isArray(electionYears) && electionYears.map((ey) => (
                                        <option key={ey._id || ey.year} value={ey.year}>{ey.year}{ey.election_type ? ` (${ey.election_type})` : ''}</option>
                                    ))}
                                </select>
                            </Box>

                            <Box sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1 }}>
                                <Button
                                    variant="contained"
                                    onClick={() => fetchMapVisits()}
                                    size="small"
                                >
                                    Refresh Map Data
                                </Button>
                            </Box>
                        </MapContainerStyled>

                        {/* Map Legend */}
                        <Box sx={{ mt: 1, p: 1.5, backgroundColor: theme.palette.background.paper, borderRadius: 1, boxShadow: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Map Legend</Typography>
                            <Stack direction="row" spacing={3}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Box sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        backgroundColor: '#22c55e',
                                        border: '2px solid #ffffff',
                                        boxShadow: 1
                                    }} />
                                    <Typography variant="caption">Has Visits</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Box sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        backgroundColor: '#ef4444',
                                        border: '2px solid #ffffff',
                                        boxShadow: 1
                                    }} />
                                    <Typography variant="caption">No Visits</Typography>
                                </Stack>
                            </Stack>
                        </Box>
                    </Box>
                </Box>

                {/* Drawer moved outside TabPanel to be available across tabs */}
            </TabPanel>

            {/* Visit Booth Map Tab */}
            <TabPanel value={activeTab} index={1}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 260 }}>
                        <InputLabel id="workstatus-block-select">Block</InputLabel>
                        <Select
                            labelId="workstatus-block-select"
                            value={blockNumberInput}
                            label="Block"
                            onChange={(e) => setBlockNumberInput(e.target.value)}
                        >
                            <MenuItem value="">Select Block</MenuItem>
                            <MenuItem value="ALL">All Blocks</MenuItem>
                            {blocks.map((b) => (
                                <MenuItem key={b._id} value={b.name || b.block_number || b._id}>
                                    {b.block_number ? `#${b.block_number} — ${b.name}` : b.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" size="small" onClick={() => loadBoothPolygonsByBlockNumber(blockNumberInput)}>
                        Load Polygons
                    </Button>
                    {mapError && <Alert severity="warning" sx={{ ml: 2 }}>{mapError}</Alert>}
                </Stack>

                <MapContainerStyled>
                    <Map
                        ref={workStatusMapRef}
                        mapboxAccessToken={mapConfiguration.mapboxAccessToken}
                        initialViewState={{ longitude: 75.8577, latitude: 22.7196, zoom: 8 }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
                        onClick={(e) => {
                            if (!boothGeoJSON) return;
                            try {
                                const map = workStatusMapRef.current && (typeof workStatusMapRef.current.getMap === 'function' ? workStatusMapRef.current.getMap() : workStatusMapRef.current);
                                let features = e.features || [];
                                if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                    const point = e.point || { x: e.x, y: e.y };
                                    if (point) {
                                        features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                    }
                                }
                                const boothFeature = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                if (boothFeature && boothFeature.properties) {
                                    const props = boothFeature.properties;
                                    const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                    if (boothNo) {
                                        setDrawerType('booth');
                                        setDrawerData({ loading: true, boothNo, details: { booth: null, visits: [] } });
                                        setDrawerOpen(true);
                                        fetchBoothDetailsByPolygon(boothNo);
                                    }
                                }
                            } catch (err) {
                                console.warn('Error handling map click (visit booth tab):', err);
                            }
                        }}
                    >
                        <MapControl />
                        {boothGeoJSON && (
                            <Source id="booth-polygons" type="geojson" data={boothGeoJSON}>
                                <Layer
                                    id="booth-fill"
                                    type="fill"
                                    paint={{ 'fill-color': '#1E90FF', 'fill-opacity': 0.25 }}
                                />
                                <Layer id="booth-outline" type="line" paint={{ 'line-color': '#1E90FF', 'line-width': 2 }} />
                                <Layer
                                    id="booth-label"
                                    type="symbol"
                                    layout={{
                                        'text-field': ['format', ['coalesce', ['get', 'BoothNo'], ['get', 'BoothNumber'], ['get', 'boothNo'], ['get', 'booth_number'], ['get', 'Booth_Name'], ['get', 'BoothName'], ['get', 'name'], ['literal', '']], { 'font-scale': 1 }, '\n', { 'font-scale': 0.85 }, ['coalesce', ['get', 'BoothName'], ['get', 'Booth_Name'], ['get', 'name'], ['literal', '']]],
                                        'text-size': 12,
                                        'text-offset': [0, 0.6],
                                        'text-anchor': 'top',
                                        'text-allow-overlap': true,
                                        'text-ignore-placement': true
                                    }}
                                    paint={{
                                        'text-color': '#000000',
                                        'text-halo-color': '#ffffff',
                                        'text-halo-width': 1
                                    }}
                                />
                            </Source>
                        )}
                        {/* Visit Booth Markers Layer */}
                        {boothGeoJSON && (
                            <Source
                                id="booth-markers"
                                type="geojson"
                                data={{
                                    type: 'FeatureCollection',
                                    features: boothGeoJSON.features.map(feature => {
                                        const props = feature.properties || {};
                                        const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;

                                        let coordinates = [0, 0];
                                        if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
                                            const coords = feature.geometry.coordinates[0];
                                            const lngs = coords.map(c => c[0]);
                                            const lats = coords.map(c => c[1]);
                                            coordinates = [
                                                lngs.reduce((a, b) => a + b, 0) / lngs.length,
                                                lats.reduce((a, b) => a + b, 0) / lats.length
                                            ];
                                        } else if (feature.geometry?.type === 'MultiPolygon' && feature.geometry.coordinates?.[0]?.[0]) {
                                            const coords = feature.geometry.coordinates[0][0];
                                            const lngs = coords.map(c => c[0]);
                                            const lats = coords.map(c => c[1]);
                                            coordinates = [
                                                lngs.reduce((a, b) => a + b, 0) / lngs.length,
                                                lats.reduce((a, b) => a + b, 0) / lats.length
                                            ];
                                        }

                                        const hasWorkStatus = Array.from(boothsWithWorkStatus).some(workStatusBoothId => {
                                            const booth = blocks.find(b => String(b._id) === workStatusBoothId);
                                            if (booth) {
                                                return String(booth.booth_number) === String(boothNo);
                                            }
                                            return false;
                                        });

                                        return {
                                            type: 'Feature',
                                            geometry: {
                                                type: 'Point',
                                                coordinates: coordinates
                                            },
                                            properties: {
                                                ...props,
                                                hasWorkStatus: hasWorkStatus
                                            }
                                        };
                                    })
                                }}
                            >
                                <Layer
                                    id="booth-work-status-markers"
                                    type="circle"
                                    paint={{
                                        'circle-radius': 6,
                                        'circle-color': [
                                            'case',
                                            ['get', 'hasWorkStatus'],
                                            '#22c55e', // Green for booths with Visit Booth
                                            '#ef4444'  // Red for booths without Visit Booth
                                        ],
                                        'circle-stroke-width': 2,
                                        'circle-stroke-color': '#ffffff',
                                        'circle-opacity': 0.9
                                    }}
                                />
                            </Source>
                        )}
                    </Map>
                </MapContainerStyled>

                {/* Map Legend */}
                <Paper elevation={2} sx={{ mt: 1, p: 1.5, display: 'inline-block' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Map Legend</Typography>
                    <Stack direction="row" spacing={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: '#22c55e',
                                border: '2px solid #ffffff',
                                boxShadow: 1
                            }} />
                            <Typography variant="caption">Has Visit Booth</Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: '2px solid #ffffff',
                                boxShadow: 1
                            }} />
                            <Typography variant="caption">No Visit Booth</Typography>
                        </Stack>
                    </Stack>
                </Paper>
            </TabPanel>

            {/* Details Drawer Modal (global) */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 420, p: 2 }}>
                    {drawerType === 'booth' && drawerData && (
                        <>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Visit Data</Typography>
                                <Button size="small" onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto' }}>
                                    <CloseIcon />
                                </Button>
                            </Stack>
                            {drawerData.loading ? (
                                <Typography variant="body2" color="text.secondary">Loading booth details...</Typography>
                            ) : drawerData.error ? (
                                <Typography variant="body2" color="error">Error: {drawerData.error}</Typography>
                            ) : (
                                <>
                                    {drawerData.details?.booth ? (
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>Booth Information</Typography>
                                            <Stack spacing={1.5}>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Name:</strong> {drawerData.details.booth.name || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Booth No:</strong> {drawerData.details.booth.booth_number || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Block:</strong> {drawerData.details.booth.block_id?.name || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Assembly:</strong> {drawerData.details.booth.assembly_id?.name || 'N/A'}</Typography>
                                                </Box>
                                                <Box sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                    <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.booth.parliament_id?.name || 'N/A'}</Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                            No booth found for Booth No: {drawerData.boothNo}
                                        </Typography>
                                    )}
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                                            Visit Data ({drawerData.details?.visits?.length || 0})
                                        </Typography>
                                        {drawerData.details?.visits && drawerData.details.visits.length > 0 ? (
                                            <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                                                <Stack spacing={1.5}>
                                                    {drawerData.details.visits.map((visit, index) => (
                                                        <Box key={index} sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                                <Box sx={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${theme.palette.primary.main}` }}>
                                                                    <img src={visit.candidate_id?.photo} alt={visit.candidate_id?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                </Box>
                                                                <Typography variant="body2" fontWeight="bold">{visit.candidate_id?.name || 'Unknown'}</Typography>
                                                            </Stack>
                                                            <Typography variant="body2"><strong>📅</strong> {formatDate(visit.date)}</Typography>
                                                            <Typography variant="body2"><strong>📍</strong> {visit.locationName || 'N/A'}</Typography>
                                                            <Typography variant="body2"><strong>🔄 Status:</strong> <span style={{ color: visit.work_status === 'complete' ? 'green' : visit.work_status === 'in progress' ? 'orange' : 'inherit', fontWeight: 'bold' }}>{visit.work_status?.toUpperCase() || 'N/A'}</span></Typography>
                                                            {visit.visitAgenda && (<Typography variant="body2"><strong>🗒️</strong> {visit.visitAgenda}</Typography>)}
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">No visits found for this booth.</Typography>
                                        )}
                                    </Box>
                                </>
                            )}
                        </>
                    )}

                    {drawerType === 'visit' && drawerData && (
                        <>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Visit Data</Typography>
                                <Button size="small" onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto' }}>
                                    <CloseIcon />
                                </Button>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Box sx={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${theme.palette.primary.main}` }}>
                                    <img src={drawerData.candidate?.photo} alt={drawerData.candidate?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                                <Typography fontWeight="bold">{drawerData.candidate?.name}</Typography>
                            </Stack>
                            <Typography variant="body2"><strong>📅</strong> {formatDate(drawerData.visit?.date)}</Typography>
                            <Typography variant="body2"><strong>📍</strong> {drawerData.visit?.locationName || 'N/A'}</Typography>
                            <Typography variant="body2"><strong>📌 Booth:</strong> {drawerData.visit?.booth_id?.name || 'N/A'}</Typography>
                            <Typography variant="body2"><strong>🔄 Status:</strong> {drawerData.visit?.work_status?.toUpperCase() || 'N/A'}</Typography>
                            {drawerData.visit?.visitAgenda && (<Typography variant="body2"><strong>🗒️ Agenda:</strong> {drawerData.visit.visitAgenda}</Typography>)}
                            {drawerData.visit?.remark && (<Typography variant="body2"><strong>📝 Remark:</strong> {drawerData.visit.remark}</Typography>)}
                        </>
                    )}

                    {drawerType === 'location' && drawerData && (
                        <>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Visit Data</Typography>
                                <Button size="small" onClick={() => setDrawerOpen(false)} sx={{ ml: 'auto' }}>
                                    <CloseIcon />
                                </Button>
                            </Stack>
                            {drawerData.locationName && (
                                <Typography variant="body2" sx={{ mb: 1 }}><strong>📍</strong> {drawerData.locationName}</Typography>
                            )}
                            {(drawerData.latitude !== undefined && drawerData.longitude !== undefined) && (
                                <Typography variant="caption" sx={{ mb: 2, display: 'block' }}>
                                    <strong>🌐</strong> {Number(drawerData.latitude).toFixed(4)}, {Number(drawerData.longitude).toFixed(4)}
                                </Typography>
                            )}
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Visits at this location ({(drawerData.visits || []).length})
                            </Typography>
                            <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
                                <Stack spacing={1.5}>
                                    {(drawerData.visits || []).map((visit, idx) => (
                                        <Box key={idx} sx={{ p: 1.5, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                                <Box sx={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${theme.palette.primary.main}` }}>
                                                    <img src={visit.candidate_id?.photo} alt={visit.candidate_id?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </Box>
                                                <Typography variant="body2" fontWeight="bold">{visit.candidate_id?.name || 'Unknown'}</Typography>
                                            </Stack>
                                            <Typography variant="body2"><strong>📅</strong> {formatDate(visit.date)}</Typography>
                                            <Typography variant="body2"><strong>🔄 Status:</strong> <span style={{ color: visit.work_status === 'complete' ? 'green' : visit.work_status === 'in progress' ? 'orange' : 'inherit', fontWeight: 'bold' }}>{visit.work_status?.toUpperCase() || 'N/A'}</span></Typography>
                                            {visit.visitAgenda && (<Typography variant="body2"><strong>🗒️</strong> {visit.visitAgenda}</Typography>)}
                                            {visit.remark && (<Typography variant="body2"><strong>📝</strong> {visit.remark}</Typography>)}
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </>
                    )}
                </Box>
            </Drawer>
        </MainCard>
    );
};

export default VisitMapTabs;
