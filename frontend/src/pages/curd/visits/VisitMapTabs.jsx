import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Tabs, Tab, Typography, Alert, Stack, FormControl, InputLabel, Select, MenuItem, Button, Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { usePermissions } from 'contexts/PermissionContext';

const mapConfiguration = { mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN, minZoom: 1 };

const MAPBOX_THEMES = {
    light: 'mapbox://styles/mapbox/light-v10',
    dark: 'mapbox://styles/mapbox/dark-v10',
    streets: 'mapbox://styles/mapbox/streets-v11',
    outdoors: 'mapbox://styles/mapbox/outdoors-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};

const VisitMapTabs = ({ onFilterFromMap, onOpenDrawer }) => {
    const theme = useTheme();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    const [activeTab, setActiveTab] = useState(0);

    // Locations map
    const [mapVisits, setMapVisits] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState('streets');
    const [routeData, setRouteData] = useState(null);
    const [yearFilter, setYearFilter] = useState('');
    const [selectedElectionYearId, setSelectedElectionYearId] = useState('');
    const [electionYears, setElectionYears] = useState([]);
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [boothsWithVisits, setBoothsWithVisits] = useState(new Set());
    const visitMapRef = useRef(null);
    const mapFetchLockRef = useRef(false);

    // Booth map
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [boothsWithWorkStatus, setBoothsWithWorkStatus] = useState(new Set());
    const [boothNumbersWithWorkStatus, setBoothNumbersWithWorkStatus] = useState(new Set());
    const [blocks, setBlocks] = useState([]);
    const workStatusMapRef = useRef(null);

    const getUserAccessScope = () => {
        if (!userHierarchy) return { level: 'All', description: 'You have access to all data' };
        const highestLevel = getUserHighestLevel();
        if (!highestLevel) return { level: 'All', description: 'You have access to all data' };
        const levelNames = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
        const levelName = levelNames[highestLevel] || highestLevel;
        const entityName = userHierarchy[highestLevel]?.name || 'Unknown';
        return { level: levelName, entity: entityName, description: `You have access to data for ${entityName} ${levelName} and all areas within it` };
    };

    const accessScope = getUserAccessScope();

    const fetchMapVisits = async (overrides = {}) => {
        if (mapFetchLockRef.current) return;
        mapFetchLockRef.current = true;
        const effectiveYear = overrides.hasOwnProperty('yearOverride') ? overrides.yearOverride : yearFilter;
        const effectiveElectionYearId = overrides.hasOwnProperty('electionYearIdOverride') ? overrides.electionYearIdOverride : selectedElectionYearId;
        console.log('[MAP DEBUG] fetchMapVisits START', { yearFilter: effectiveYear, selectedElectionYearId: effectiveElectionYearId });
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            let query = 'all=true&limit=50000';
            if (userHierarchy) {
                const highestLevel = getUserHighestLevel();
                if (highestLevel) {
                    switch (highestLevel.level) {
                        case 'state': query += `&state_id=${highestLevel.value}`; break;
                        case 'division': query += `&division_id=${highestLevel.value}`; break;
                        case 'parliament': query += `&parliament_id=${highestLevel.value}`; break;
                        case 'assembly': query += `&assembly_id=${highestLevel.value}`; break;
                        case 'block': query += `&block_id=${highestLevel.value}`; break;
                        case 'booth': query += `&booth_id=${highestLevel.value}`; break;
                        default: break;
                    }
                }
            }
            if (effectiveYear) query += `&year=${effectiveYear}`;
            if (effectiveElectionYearId) query += `&election_year_id=${encodeURIComponent(effectiveElectionYearId)}`;
            const url = `${import.meta.env.VITE_APP_API_URL}/visits?${query}`;
            console.log('[MAP DEBUG] fetchMapVisits -> URL:', url);
            const res = await fetch(url, { headers });
            const json = await res.json();
            if (json && json.success) {
                const rawVisits = Array.isArray(json.data) ? json.data : [];
                console.log('[MAP DEBUG] fetchMapVisits -> rawVisits.length:', rawVisits.length);
                if (rawVisits.length === 0) { setMapVisits([]); setRouteData(null); return; }
                const visitsWithCoords = rawVisits.map(v => ({ ...v, latitude: v.latitude !== undefined && v.latitude !== null && v.latitude !== '' ? Number(v.latitude) : NaN, longitude: v.longitude !== undefined && v.longitude !== null && v.longitude !== '' ? Number(v.longitude) : NaN })).filter(v => !isNaN(v.latitude) && !isNaN(v.longitude));
                setMapVisits(visitsWithCoords);
                console.log('[MAP DEBUG] fetchMapVisits -> visitsWithCoords.length:', visitsWithCoords.length);
                const boothNumbersSet = new Set();
                rawVisits.forEach(visit => { const boothNumber = visit?.booth_id?.booth_number; if (boothNumber !== undefined && boothNumber !== null) boothNumbersSet.add(String(boothNumber)); });
                setBoothsWithVisits(boothNumbersSet);
                if (visitsWithCoords.length > 1) {
                    const coordinates = visitsWithCoords.map(v => [v.longitude, v.latitude]);
                    setRouteData({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } });
                } else setRouteData(null);
            } else { console.error('Failed to fetch visits:', json); setMapVisits([]); setRouteData(null); }
        } catch (err) { console.error('Error loading visit data:', err); setMapVisits([]); setRouteData(null); } finally { mapFetchLockRef.current = false; }
    };

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
            if (features.length === 1 && features[0] && features[0].features && Array.isArray(features[0].features)) features = features[0].features;
            if (!features || !Array.isArray(features) || features.length === 0) { setMapError('No booth polygons found'); setBoothGeoJSON(null); return; }
            setBoothGeoJSON({ type: 'FeatureCollection', features });
        } catch (e) { console.error('Failed to load booth polygons:', e); setMapError(`Failed to load booth polygons: ${e.message}`); setBoothGeoJSON(null); }
    };

    const fetchBoothsWithWorkStatus = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/work-status?all=true&limit=50000`, { headers });
            const json = await res.json();
            if (json && json.success && Array.isArray(json.data)) {
                const ids = new Set();
                const numbers = new Set();
                json.data.forEach(ws => {
                    if (!ws) return;
                    const b = ws.booth_id;
                    if (b) {
                        const bid = (b._id || b.id) || b;
                        if (bid) ids.add(String(bid));
                        const bnum = b.booth_number || b.BoothNo || b.BoothNumber;
                        if (bnum) numbers.add(String(bnum));
                    }
                    if (ws.booth_number) numbers.add(String(ws.booth_number));
                });
                setBoothsWithWorkStatus(ids);
                setBoothNumbersWithWorkStatus(numbers);
                console.log('[MAP DEBUG] fetchBoothsWithWorkStatus -> entries:', json.data.length, 'ids:', ids.size, 'numbers:', numbers.size);
            }
        } catch (e) { console.warn('Failed to fetch booths with Visit Booth:', e); }
    };

    const loadBoothPolygonsByBlockNumber = async (blockNumberVal) => {
        if (!blockNumberVal) { setMapError('Please enter Block Number'); return; }
        setMapError('');
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            fetchBoothsWithWorkStatus();
            if (blockNumberVal === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || 'https://myhostmanager.co.in/backend/api';
                const url = `${apiUrl}/booth-polygons?limit=50000&page=1`;
                const resp = await fetch(url, { headers }); if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const j = await resp.json(); let features = j.features || j.data || [];
                if (features.length === 1 && features[0] && features[0].features && Array.isArray(features[0].features)) features = features[0].features;
                if (!features || !Array.isArray(features) || features.length === 0) { setMapError('No booth polygons found'); setBoothGeoJSON(null); return; }
                setBoothGeoJSON({ type: 'FeatureCollection', features }); return;
            }
            const candidates = [
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block/${encodeURIComponent(blockNumberVal)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${encodeURIComponent(blockNumberVal)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons?block=${encodeURIComponent(blockNumberVal)}`
            ];
            let json = null;
            for (const url of candidates) {
                try { const resp = await fetch(url, { headers }); if (!resp.ok) continue; const j = await resp.json(); const features = j.features || (Array.isArray(j) ? j : (j.data || null)); if (features && Array.isArray(features) && features.length > 0) { json = { type: 'FeatureCollection', features }; break; } } catch (e) { console.warn('Error fetching booth polygons:', e); }
            }
            if (!json) { setMapError(`No booth polygons found for block '${blockNumberVal}'`); setBoothGeoJSON(null); return; }
            setBoothGeoJSON({ type: 'FeatureCollection', features: json.features });
        } catch (e) { console.error('Failed to load booth polygons:', e); setMapError(`Failed to load booth polygons: ${e.message}`); setBoothGeoJSON(null); }
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const [electionYearsRes, blocksRes] = await Promise.all([fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers }), fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers })]);
            const [electionYearsData, blocksData] = await Promise.all([electionYearsRes.json(), blocksRes.json()]);
            if (electionYearsData.success) { setElectionYears(electionYearsData.data); console.log('[MAP DEBUG] electionYears loaded:', Array.isArray(electionYearsData.data) ? electionYearsData.data.length : 0); }
            if (blocksData.success) setBlocks(blocksData.data);
        } catch (e) { console.error('Failed to fetch reference data:', e); }
    };

    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json(); let booth = null;
            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo).trim();
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr) || json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase()) || json.data.find(b => String(b.booth_number).trim().includes(boothNoStr) || boothNoStr.includes(String(b.booth_number).trim()));
                if (!booth) console.warn(`No booth found for BoothNo: "${boothNoStr}"`);
            } else console.error('Failed to fetch booths:', json);
            let visits = [];
            if (booth && booth._id) {
                try { const visitsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/visits?booth=${encodeURIComponent(booth._id)}&all=true`, { headers }); const visitsJson = await visitsRes.json(); if (visitsJson.success && Array.isArray(visitsJson.data)) visits = visitsJson.data; } catch (e) { console.warn('Failed to fetch visits for booth:', e); }
            }
            try { if (typeof onOpenDrawer === 'function') onOpenDrawer({ open: true, type: 'booth', data: { loading: false, boothNo, details: { booth, visits } } }); } catch (_) {}
            try { if (typeof onFilterFromMap === 'function') { if (booth && booth._id) onFilterFromMap({ type: 'booth', boothId: String(booth._id), booth }); else if (boothNo) onFilterFromMap({ type: 'booth-number', boothNumber: String(boothNo) }); } } catch (e) {}
        } catch (e) { console.error('Failed to load booth details by polygon:', e); try { if (typeof onOpenDrawer === 'function') onOpenDrawer({ open: true, type: 'booth', data: { loading: false, boothNo, details: { booth: null, visits: [] }, error: e.message } }); } catch (_) {} }
    };

    useEffect(() => { fetchMapVisits(); fetchReferenceData(); try { loadBoothPolygonsByBlockNumber('ALL'); } catch (e) { console.warn('Automatic loading of all booth polygons failed:', e); } }, []);

    // When tab changes or on mount, ensure map instances recalculate size (mapbox needs resize when container size changes)
    useEffect(() => {
        try {
            const vm = visitMapRef.current && (typeof visitMapRef.current.getMap === 'function' ? visitMapRef.current.getMap() : visitMapRef.current);
            if (vm && typeof vm.resize === 'function') vm.resize();
        } catch (e) {
            // ignore
        }
        try {
            const wm = workStatusMapRef.current && (typeof workStatusMapRef.current.getMap === 'function' ? workStatusMapRef.current.getMap() : workStatusMapRef.current);
            if (wm && typeof wm.resize === 'function') wm.resize();
        } catch (e) {
            // ignore
        }
    }, [activeTab]);

    const handleTabChange = (event, newValue) => setActiveTab(newValue);

    const handleMarkerClick = (visit) => {
        const normalize = v => (v && typeof v === 'string' ? v.trim().toLowerCase() : '');
        const locationKey = normalize(visit.locationName);
        const rounded = n => (typeof n === 'number' && !isNaN(n) ? Number(n.toFixed(4)) : null);
        const latKey = rounded(visit.latitude);
        const lngKey = rounded(visit.longitude);
        const visitsAtLocation = (Array.isArray(mapVisits) ? mapVisits : []).filter(v => { const sameName = locationKey && normalize(v.locationName) === locationKey; const sameCoords = latKey !== null && lngKey !== null && rounded(v.latitude) === latKey && rounded(v.longitude) === lngKey; return sameName || sameCoords; });
        try { if (typeof onOpenDrawer === 'function') onOpenDrawer({ open: true, type: 'location', data: { locationName: visit.locationName, latitude: visit.latitude, longitude: visit.longitude, visits: visitsAtLocation.length ? visitsAtLocation : [visit] } }); } catch (_) {}
        if (typeof onFilterFromMap === 'function') { const searchText = visit.locationName || `${visit.latitude || ''},${visit.longitude || ''}`; onFilterFromMap({ type: 'location', locationName: searchText, latitude: visit.latitude, longitude: visit.longitude }); }
    };

    const formatDate = dateString => { if (!dateString) return 'N/A'; return new Date(dateString).toLocaleDateString('en-IN'); };

    return (
        <MainCard>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} aria-label="map tabs">
                    <Tab label="Visit Locations Map" />
                    <Tab label="Visit Booth Map" />
                </Tabs>
            </Box>

            <Alert severity="info" sx={{ m: 2 }}>
                <Typography variant="body2"><strong>Data Access:</strong> {accessScope.description}</Typography>
            </Alert>

            {/* Locations Map Tab */}
            <Box sx={{ height: '600px' }} hidden={activeTab !== 0}>
                <MapContainerStyled>
                    <Map ref={visitMapRef} initialViewState={{ latitude: 23.4707, longitude: 77.9455, zoom: 6 }} mapStyle={MAPBOX_THEMES[selectedTheme]} mapboxAccessToken={mapConfiguration.mapboxAccessToken} interactiveLayerIds={boothGeoJSON ? ['booth-fill', 'booth-visit-markers'] : []} onClick={(e) => {
                        if (!boothGeoJSON) return;
                        try {
                            const map = visitMapRef.current && (typeof visitMapRef.current.getMap === 'function' ? visitMapRef.current.getMap() : visitMapRef.current);
                            let features = e.features || [];
                            if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                const point = e.point || { x: e.x, y: e.y };
                                if (point) features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill', 'booth-visit-markers'] }) || [];
                            }
                            const boothFeature = features.find(f => f.layer && (f.layer.id === 'booth-fill' || f.layer.id === 'booth-visit-markers')) || features[0];
                            if (boothFeature && boothFeature.properties) {
                                const props = boothFeature.properties;
                                const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                if (boothNo) {
                                    try { if (typeof onOpenDrawer === 'function') onOpenDrawer({ open: true, type: 'booth', data: { loading: true, boothNo, details: { booth: null, visits: [] } } }); } catch (_) {}
                                    fetchBoothDetailsByPolygon(boothNo);
                                }
                            }
                        } catch (err) { console.warn('Error handling map click:', err); }
                    }}>
                        <MapControl />
                        <Source id="india-source" type="geojson" data="/india.geojson">
                            <Layer id="india-fill" type="fill" paint={{ 'fill-color': '#e0e0e0', 'fill-opacity': 0.07 }} />
                            <Layer id="india-outline" type="line" paint={{ 'line-color': '#003366', 'line-width': 1 }} />
                        </Source>

                        {/* Route line */}
                        {routeData && (
                            <Source id="route" type="geojson" data={routeData}><Layer id="route-line" type="line" paint={{ 'line-color': theme.palette.primary.main, 'line-width': 2 }} /></Source>
                        )}

                        {/* Markers for each visit */}
                        {mapVisits.map((visit, idx) => (
                            <Marker key={idx} longitude={visit.longitude} latitude={visit.latitude} anchor="bottom">
                                <Box sx={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${theme.palette.primary.main}`, cursor: 'pointer', overflow: 'hidden' }} onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); handleMarkerClick(visit); }}>
                                    <img src={visit.candidate_id?.photo} alt={visit.candidate_id?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                            </Marker>
                        ))}
                    </Map>
                </MapContainerStyled>
            </Box>

            {/* Booth Map Tab */}
            <Box sx={{ height: '600px' }} hidden={activeTab !== 1}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 260 }}>
                        <InputLabel id="workstatus-block-select">Block</InputLabel>
                        <Select labelId="workstatus-block-select" value={blockNumberInput} label="Block" onChange={(e) => setBlockNumberInput(e.target.value)}>
                            <MenuItem value="">Select Block</MenuItem>
                            <MenuItem value="ALL">All Blocks</MenuItem>
                            {blocks.map(b => <MenuItem key={b._id} value={b.name || b.block_number || b._id}>{b.block_number ? `#${b.block_number} — ${b.name}` : b.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <Button variant="contained" size="small" onClick={() => loadBoothPolygonsByBlockNumber(blockNumberInput)}>Load Polygons</Button>
                    {mapError && <Alert severity="warning" sx={{ ml: 2 }}>{mapError}</Alert>}
                </Stack>

                <MapContainerStyled>
                    <Map ref={workStatusMapRef} mapboxAccessToken={mapConfiguration.mapboxAccessToken} initialViewState={{ longitude: 75.8577, latitude: 22.7196, zoom: 8 }} mapStyle="mapbox://styles/mapbox/streets-v12" interactiveLayerIds={boothGeoJSON ? ['booth-fill', 'booth-work-status-markers'] : []} onClick={(e) => {
                        if (!boothGeoJSON) return;
                        try {
                            const map = workStatusMapRef.current && (typeof workStatusMapRef.current.getMap === 'function' ? workStatusMapRef.current.getMap() : workStatusMapRef.current);
                            let features = e.features || [];
                            if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                const point = e.point || { x: e.x, y: e.y };
                                if (point) features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill', 'booth-work-status-markers'] }) || [];
                            }
                            const boothFeature = features.find(f => f.layer && (f.layer.id === 'booth-fill' || f.layer.id === 'booth-work-status-markers')) || features[0];
                            if (boothFeature && boothFeature.properties) {
                                const props = boothFeature.properties; const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                if (boothNo) { try { if (typeof onOpenDrawer === 'function') onOpenDrawer({ open: true, type: 'booth', data: { loading: true, boothNo, details: { booth: null, visits: [] } } }); } catch (_) {} fetchBoothDetailsByPolygon(boothNo); }
                            }
                        } catch (err) { console.warn('Error handling map click (visit booth tab):', err); }
                    }}>
                        <MapControl />

                        {boothGeoJSON && (
                            <Source id="booth-polygons" type="geojson" data={boothGeoJSON}>
                                <Layer id="booth-fill" type="fill" paint={{ 'fill-color': '#1E90FF', 'fill-opacity': 0.25 }} />
                                <Layer id="booth-outline" type="line" paint={{ 'line-color': '#1E90FF', 'line-width': 2 }} />
                                <Layer id="booth-label" type="symbol" layout={{ 'text-field': ['format', ['coalesce', ['get', 'BoothNo'], ['get', 'BoothNumber'], ['get', 'boothNo'], ['get', 'booth_number'], ['get', 'Booth_Name'], ['get', 'BoothName'], ['get', 'name'], ['literal', '']], { 'font-scale': 1 }, '\n', { 'font-scale': 0.85 }, ['coalesce', ['get', 'BoothName'], ['get', 'Booth_Name'], ['get', 'name'], ['literal', '']]], 'text-size': 12, 'text-offset': [0, 0.6], 'text-anchor': 'top', 'text-allow-overlap': true, 'text-ignore-placement': true }} paint={{ 'text-color': '#000000', 'text-halo-color': '#ffffff', 'text-halo-width': 1 }} />
                            </Source>
                        )}

                        {boothGeoJSON && (() => {
                            const featuresArr = boothGeoJSON.features.map(feature => {
                                const props = feature.properties || {};
                                const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
                                let coordinates = [0, 0];
                                if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]) {
                                    const coords = feature.geometry.coordinates[0]; const lngs = coords.map(c => c[0]); const lats = coords.map(c => c[1]); coordinates = [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
                                } else if (feature.geometry?.type === 'MultiPolygon' && feature.geometry.coordinates?.[0]?.[0]) {
                                    const coords = feature.geometry.coordinates[0][0]; const lngs = coords.map(c => c[0]); const lats = coords.map(c => c[1]); coordinates = [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
                                }
                                // Check if this booth has visits (green = has visits, red = no visits)
                                // boothsWithVisits is a Set of booth numbers (as strings) from fetchMapVisits
                                const hasVisits = boothNo ? boothsWithVisits.has(String(boothNo)) : false;
                                return { type: 'Feature', geometry: { type: 'Point', coordinates }, properties: { ...props, hasVisits } };
                            });
                            try { const total = featuresArr.length; const withVisits = featuresArr.filter(f => f.properties && f.properties.hasVisits).length; console.log('[MAP DEBUG] Visit Booth markers -> total features:', total, 'withVisits (green):', withVisits); } catch (e) {}
                            return (
                                <Source id="booth-markers" type="geojson" data={{ type: 'FeatureCollection', features: featuresArr }}>
                                    <Layer id="booth-work-status-markers" type="circle" paint={{ 'circle-radius': 6, 'circle-color': ['case', ['get', 'hasVisits'], '#22c55e', '#ef4444'], 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff', 'circle-opacity': 0.9 }} />
                                </Source>
                            );
                        })()}

                    </Map>
                </MapContainerStyled>

                <Paper elevation={2} sx={{ mt: 1, p: 1.5, display: 'inline-block' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Map Legend</Typography>
                    <Stack direction="row" spacing={3}>
                        <Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#22c55e', border: '2px solid #ffffff', boxShadow: 1 }} /><Typography variant="caption">Has Visit Booth</Typography></Stack>
                        <Stack direction="row" spacing={1} alignItems="center"><Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#ef4444', border: '2px solid #ffffff', boxShadow: 1 }} /><Typography variant="caption">No Visit Booth</Typography></Stack>
                    </Stack>
                </Paper>
            </Box>

        </MainCard>
    );
};

export default VisitMapTabs;
