import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Tabs, Tab, Typography, Alert, Stack, FormControl, InputLabel, Select, MenuItem, Button, Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';

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

// Add optional onFilterFromMap callback so parent can sync table filters with map selections
const VisitMapTabs = ({ onFilterFromMap, onOpenDrawer }) => {
    const theme = useTheme();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    const [activeTab, setActiveTab] = useState(0);

    // Visit Map States
    const [mapVisits, setMapVisits] = useState([]);
    const [popupInfo, setPopupInfo] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState('streets');
    const [routeData, setRouteData] = useState(null);
    const [yearFilter, setYearFilter] = useState(''); // stores the numeric year used for map queries
    const [selectedElectionYearId, setSelectedElectionYearId] = useState(''); // stores the _id of the selected election-year
    const [electionYears, setElectionYears] = useState([]);
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [boothsWithVisits, setBoothsWithVisits] = useState(new Set());
    const visitMapRef = useRef(null);
    const mapFetchLockRef = useRef(false);

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
    // fetchMapVisits accepts optional overrides so callers can force a fetch with specific year/electionYearId
    const fetchMapVisits = async (overrides = {}) => {
        if (mapFetchLockRef.current) {
            return;
        }
        mapFetchLockRef.current = true;

        // Determine effective values (prefer overrides when provided)
        const effectiveYear = overrides.hasOwnProperty('yearOverride') ? overrides.yearOverride : yearFilter;
        const effectiveElectionYearId = overrides.hasOwnProperty('electionYearIdOverride') ? overrides.electionYearIdOverride : selectedElectionYearId;

        // MAP DEBUG: fetch start (show effective filters)
        console.log('[MAP DEBUG] fetchMapVisits START', { yearFilter: effectiveYear, selectedElectionYearId: effectiveElectionYearId });
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
            if (effectiveYear) {
                query += `&year=${effectiveYear}`;
            }

            // Include election_year_id when we have it (server supports filtering by this canonical id)
            if (effectiveElectionYearId) {
                query += `&election_year_id=${encodeURIComponent(effectiveElectionYearId)}`;
            }

            const url = `${import.meta.env.VITE_APP_API_URL}/visits?${query}`;
            // MAP DEBUG: URL used for map fetch
            console.log('[MAP DEBUG] fetchMapVisits -> URL:', url);
            const res = await fetch(url, { headers });
            const json = await res.json();

            if (json && json.success) {
                const rawVisits = Array.isArray(json.data) ? json.data : [];
                console.log('[MAP DEBUG] fetchMapVisits -> rawVisits.length:', rawVisits.length);
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
                console.log('[MAP DEBUG] fetchMapVisits -> visitsWithCoords.length:', visitsWithCoords.length);

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
        } finally {
            mapFetchLockRef.current = false;
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

            if (electionYearsData.success) {
                setElectionYears(electionYearsData.data);
                // MAP DEBUG: election years loaded for map selector
                console.log('[MAP DEBUG] electionYears loaded:', Array.isArray(electionYearsData.data) ? electionYearsData.data.length : 0);
            }
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

            try {
                if (typeof onOpenDrawer === 'function') {
                    onOpenDrawer({ open: true, type: 'booth', data: { loading: false, boothNo, details: { booth, visits } } });
                }
            } catch (_) { /* noop */ }
            // Notify parent to filter table by this booth id if available
            try {
                if (typeof onFilterFromMap === 'function') {
                    if (booth && booth._id) {
                        onFilterFromMap({ type: 'booth', boothId: String(booth._id), booth });
                    } else if (boothNo) {
                        onFilterFromMap({ type: 'booth-number', boothNumber: String(boothNo) });
                    }
                }
            } catch (err) {
                // ignore
            }
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            try {
                if (typeof onOpenDrawer === 'function') {
                    onOpenDrawer({ open: true, type: 'booth', data: { loading: false, boothNo, details: { booth: null, visits: [] }, error: e.message } });
                }
            } catch (_) { /* noop */ }
        }
    };

    useEffect(() => {
        fetchMapVisits();
        fetchReferenceData();
        // Load all booth polygons by default so the 'Visit Booth Map' shows polygons without manual action
        try {
            loadBoothPolygonsByBlockNumber('ALL');
        } catch (e) {
            console.warn('Automatic loading of all booth polygons failed:', e);
        }
    }, []);

    // Drawer is managed by parent via onOpenDrawer to survive parent fetches/re-renders

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleMarkerClick = (visit) => {
        // Marker clicked — group visits at location, open parent drawer and notify parent filters
        // Group all visits at the same location as the clicked marker
        const normalize = (v) => (v && typeof v === 'string' ? v.trim().toLowerCase() : '');
        const locationKey = normalize(visit.locationName);
        const rounded = (n) => (typeof n === 'number' && !isNaN(n) ? Number(n.toFixed(4)) : null);
        const latKey = rounded(visit.latitude);
        const lngKey = rounded(visit.longitude);

        const visitsAtLocation = (Array.isArray(mapVisits) ? mapVisits : []).filter((v) => {
            const sameName = locationKey && normalize(v.locationName) === locationKey;
            const sameCoords = latKey !== null && lngKey !== null && rounded(v.latitude) === latKey && rounded(v.longitude) === lngKey;
            return sameName || sameCoords;
        });

        

        // Ask parent to open drawer for this location
        try {
            if (typeof onOpenDrawer === 'function') {
                onOpenDrawer({ open: true, type: 'location', data: { locationName: visit.locationName, latitude: visit.latitude, longitude: visit.longitude, visits: visitsAtLocation.length ? visitsAtLocation : [visit] } });
            }
        } catch (err) { /* ignore */ }

        // Then, inform parent to filter the table
        if (typeof onFilterFromMap === 'function') {
            const searchText = visit.locationName || `${visit.latitude || ''},${visit.longitude || ''}`;
            onFilterFromMap({ type: 'location', locationName: searchText, latitude: visit.latitude, longitude: visit.longitude });
        }
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
                                interactiveLayerIds={boothGeoJSON ? ['booth-fill', 'booth-visit-markers'] : []}
                                onClick={(e) => {
                                    if (!boothGeoJSON) return;
                                    try {
                                        const map = visitMapRef.current && (typeof visitMapRef.current.getMap === 'function' ? visitMapRef.current.getMap() : visitMapRef.current);
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                            const point = e.point || { x: e.x, y: e.y };
                                            if (point) {
                                                features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill', 'booth-visit-markers'] }) || [];
                                            }
                                        }

                                        // Support clicks on polygon fill and circle markers
                                        const boothFeature = features.find(f => f.layer && (f.layer.id === 'booth-fill' || f.layer.id === 'booth-visit-markers')) || features[0];
                                                                    if (boothFeature && boothFeature.properties) {
                                                                        const props = boothFeature.properties;
                                                                        const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                                                        if (boothNo) {
                                                                            // Ask parent to open a loading drawer while we fetch details
                                                                            try {
                                                                                if (typeof onOpenDrawer === 'function') {
                                                                                    onOpenDrawer({ open: true, type: 'booth', data: { loading: true, boothNo, details: { booth: null, visits: [] } } });
                                                                                }
                                                                            } catch (_) { /* noop */ }
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

                                {/* Booth polygons and booth-marker layers were intentionally removed from the Visit Locations Map
                                    to avoid visual clutter. Booth polygons remain available in the "Visit Booth Map" tab only. */}

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
                                    value={selectedElectionYearId}
                                        onChange={(e) => {
                                        const selectedId = e.target.value;
                                        setSelectedElectionYearId(selectedId);

                                        // Resolve the selected election-year object so we send canonical fields
                                        const ey = Array.isArray(electionYears) ? electionYears.find(x => String(x._id) === String(selectedId)) : null;
                                        const yearVal = ey ? (ey.year || '') : '';
                                        setYearFilter(yearVal);

                                        // MAP DEBUG: show selection and resolved year before fetching map data
                                        console.log('[MAP DEBUG] year select ->', { selectedId, ey: ey ? { _id: ey._id, year: ey.year } : null, yearVal });

                                        // Immediately fetch map data with explicit overrides to avoid setState race
                                        try {
                                            fetchMapVisits({ yearOverride: yearVal || '', electionYearIdOverride: selectedId || '' });
                                        } catch (e) {
                                            // still safe to ignore—fetchMapVisits handles errors
                                        }

                                        // Inform parent (table) to filter by year as well. Send both year and electionYearId when available.
                                        try {
                                            if (typeof onFilterFromMap === 'function') {
                                                if (ey) {
                                                    onFilterFromMap({ type: 'year', year: ey.year, electionYearId: ey._id });
                                                } else {
                                                    onFilterFromMap({ type: 'year', year: '' });
                                                }
                                            }
                                        } catch (_) { /* noop */ }
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
                                        <option key={ey._id || ey.year} value={ey._id}>{ey.year}{ey.election_type ? ` (${ey.election_type})` : ''}</option>
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
                        interactiveLayerIds={boothGeoJSON ? ['booth-fill', 'booth-work-status-markers'] : []}
                        onClick={(e) => {
                            if (!boothGeoJSON) return;
                            try {
                                const map = workStatusMapRef.current && (typeof workStatusMapRef.current.getMap === 'function' ? workStatusMapRef.current.getMap() : workStatusMapRef.current);
                                let features = e.features || [];
                                if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                    const point = e.point || { x: e.x, y: e.y };
                                    if (point) {
                                        features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill', 'booth-work-status-markers'] }) || [];
                                    }
                                }
                                const boothFeature = features.find(f => f.layer && (f.layer.id === 'booth-fill' || f.layer.id === 'booth-work-status-markers')) || features[0];
                                if (boothFeature && boothFeature.properties) {
                                    const props = boothFeature.properties;
                                    const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                    if (boothNo) {
                                        try {
                                            if (typeof onOpenDrawer === 'function') {
                                                onOpenDrawer({ open: true, type: 'booth', data: { loading: true, boothNo, details: { booth: null, visits: [] } } });
                                            }
                                        } catch (_) { /* noop */ }
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

                {/* Drawer is handled by parent VisitListPage */}
        </MainCard>
    );
};

export default VisitMapTabs;
