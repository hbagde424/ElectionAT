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
const VisitMapTabs = ({ onFilterFromMap, onOpenDrawer, visitsFromTable }) => {
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
    // Store original (canonical) booth numbers (before variant normalization) for deeper debug/matching analysis
    const [originalBoothNumbers, setOriginalBoothNumbers] = useState(new Set());
    const visitMapRef = useRef(null);
    const mapFetchLockRef = useRef(false);

    // If parent provides visitsFromTable (authoritative table data), derive boothsWithVisits from it
    useEffect(() => {
        if (!visitsFromTable || !Array.isArray(visitsFromTable) || visitsFromTable.length === 0) return;
        try {
            console.log('[DEBUG] visitsFromTable provided, length:', visitsFromTable.length);
            const boothNumbers = new Set();
            const originalNumbers = new Set();
            visitsFromTable.forEach((visit) => {
                const boothId = visit?.booth_id;
                if (boothId) {
                    if (typeof boothId === 'object') {
                        const bn = boothId.booth_number || boothId.BoothNo || boothId.BoothNumber || boothId.name;
                        if (bn !== undefined && bn !== null && String(bn).trim() !== '') {
                            originalNumbers.add(String(bn).trim());
                            boothNumbers.add(String(bn).trim());
                            boothNumbers.add(String(bn).trim().toLowerCase());
                            boothNumbers.add(String(parseInt(bn)).trim());
                        }
                    } else if (typeof boothId === 'string' || typeof boothId === 'number') {
                        // If table only provides booth id string, still add as-is to help matching
                        boothNumbers.add(String(boothId).trim());
                    }
                }
            });
            if (boothNumbers.size > 0) {
                setBoothsWithVisits(boothNumbers);
                setOriginalBoothNumbers(originalNumbers);
                console.log('[DEBUG] boothsWithVisits populated from visitsFromTable ->', boothNumbers.size, Array.from(boothNumbers).slice(0, 20));
                console.log('[DEBUG] originalBoothNumbers (from table)->', Array.from(originalNumbers));
            }
        } catch (e) {
            // no-op on parse errors
            console.warn('[DEBUG] Error parsing visitsFromTable', e);
        }
    }, [visitsFromTable]);

    // Visit Booth Map States
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    // Use `boothsWithVisits` (populated from visits API) for marker matching
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

    // fetchMapVisits start (filters available in state)
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
            // URL used for map fetch
            const res = await fetch(url, { headers });
            const json = await res.json();

            if (json && json.success) {
                const rawVisits = Array.isArray(json.data) ? json.data : [];
                // raw visits count
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
                // visits with coords count

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

    // Helper function to auto-zoom map to fit booth polygons
    const autoZoomToBooths = (geojson, mapRef) => {
        if (!geojson || !geojson.features || geojson.features.length === 0) return;
        if (!mapRef || !mapRef.current) return;

        try {
            const map = typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current;
            if (!map) return;

            // Function to perform the actual zoom
            const performZoom = () => {
                try {
                    // Calculate bounding box for all features
                    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

                    geojson.features.forEach(feature => {
                        const processCoords = (coords) => {
                            coords.forEach(coord => {
                                if (Array.isArray(coord[0])) {
                                    processCoords(coord);
                                } else {
                                    const [lng, lat] = coord;
                                    if (typeof lng === 'number' && typeof lat === 'number' && !isNaN(lng) && !isNaN(lat)) {
                                        if (lng < minLng) minLng = lng;
                                        if (lng > maxLng) maxLng = lng;
                                        if (lat < minLat) minLat = lat;
                                        if (lat > maxLat) maxLat = lat;
                                    }
                                }
                            });
                        };

                        if (feature.geometry && feature.geometry.coordinates) {
                            processCoords(feature.geometry.coordinates);
                        }
                    });

                    if (minLng !== Infinity && maxLng !== -Infinity && minLat !== Infinity && maxLat !== -Infinity) {
                        map.fitBounds(
                            [[minLng, minLat], [maxLng, maxLat]],
                            { padding: 80, duration: 1500, maxZoom: 15 }
                        );
                    }
                } catch (e) {
                    console.warn('[AUTO-ZOOM] Error in performZoom:', e);
                }
            };

            // Check if map is loaded, if not wait for it
            if (map.loaded && map.loaded()) {
                performZoom();
            } else {
                map.once('load', () => {
                    performZoom();
                });
                // Fallback: also try after a delay in case 'load' event already fired
                setTimeout(performZoom, 1000);
            }
        } catch (e) {
            console.warn('[AUTO-ZOOM] Failed to auto-zoom to booths:', e);
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

    // Fetch booths that have visits (for Visit Booth Map green/red markers)
    const fetchBoothsWithVisits = async () => {
        // If parent passed visitsFromTable (authoritative), avoid fetching from API here
        if (visitsFromTable && Array.isArray(visitsFromTable) && visitsFromTable.length > 0) return;

        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const visitsUrl = `${import.meta.env.VITE_APP_API_URL}/visits?all=true&limit=50000`;
            const visitsRes = await fetch(visitsUrl, { headers });
            const visitsJson = await visitsRes.json();

            // DEBUG: show what the visits endpoint returned (counts and a small sample)
            try {
                console.log('[DEBUG] fetchBoothsWithVisits -> URL:', visitsUrl);
                console.log('[DEBUG] fetchBoothsWithVisits -> response success:', !!(visitsJson && visitsJson.success));
                if (visitsJson && Array.isArray(visitsJson.data)) {
                    console.log('[DEBUG] fetchBoothsWithVisits -> raw visits count:', visitsJson.data.length);
                    console.log('[DEBUG] fetchBoothsWithVisits -> sample visits (first 10):', visitsJson.data.slice(0, 10).map(v => ({ id: v._id || v.id, booth_id_raw: v.booth_id && (typeof v.booth_id === 'object' ? { id: v.booth_id._id || v.booth_id.id, booth_number: v.booth_id.booth_number || v.booth_id.BoothNo || v.booth_id.BoothNumber || null } : v.booth_id) }))); 
                } else {
                    console.log('[DEBUG] fetchBoothsWithVisits -> no array data in response:', visitsJson);
                }
            } catch (dbgErr) {
                console.warn('[DEBUG] fetchBoothsWithVisits -> debug logging failed:', dbgErr);
            }
            
            
            if (visitsJson.success && Array.isArray(visitsJson.data)) {
                const boothIds = new Set();
                const boothNumbers = new Set();
                const originalNumbers = new Set();
                const boothNames = new Set();
                const unresolvedBoothIds = new Set();

                visitsJson.data.forEach((visit, index) => {
                    if (visit.booth_id) {
                        // Store booth ID (could be object or string)
                        const boothId = (visit.booth_id && typeof visit.booth_id === 'object') ? (visit.booth_id._id || visit.booth_id.id) : visit.booth_id;
                        boothIds.add(String(boothId));

                        // Try to extract booth number from nested object if present
                        const bn = (visit.booth_id && typeof visit.booth_id === 'object') ? (visit.booth_id.booth_number || visit.booth_id.BoothNo || visit.booth_id.BoothNumber) : null;
                        if (bn !== undefined && bn !== null && bn !== '') {
                            originalNumbers.add(String(bn).trim());
                            boothNumbers.add(String(bn).trim());
                            boothNumbers.add(String(bn).trim().toLowerCase());
                            boothNumbers.add(String(parseInt(bn)).trim());
                        } else if (boothId && typeof boothId === 'string') {
                            // mark for resolution later (visit carries only booth id)
                            unresolvedBoothIds.add(String(boothId));
                        }

                        // Store booth name for additional matching
                        if (visit.booth_id && typeof visit.booth_id === 'object' && visit.booth_id.name) {
                            boothNames.add(String(visit.booth_id.name).trim());
                        }

                        // Debug first 5 visits
                        if (index < 5) {
                            // removed debug logging for visit details
                        }
                    }
                });

                // Resolve unresolved booth IDs to booth_number by fetching booths list (fallback)
                if (unresolvedBoothIds.size > 0) {
                    try {
                        // resolving booth IDs to numbers
                        const boothsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=50000`, { headers });
                        const boothsJson = await boothsRes.json();
                        if (boothsJson && boothsJson.success && Array.isArray(boothsJson.data)) {
                            const idToNumber = new Map();
                            boothsJson.data.forEach(b => {
                                if (b && (b._id || b.id)) {
                                    const id = String(b._id || b.id);
                                    const num = b.booth_number || b.BoothNo || b.BoothNumber || b.name;
                                    if (num !== undefined && num !== null) {
                                        originalNumbers.add(String(num).trim());
                                        idToNumber.set(id, String(num).trim());
                                    }
                                }
                            });

                            unresolvedBoothIds.forEach(id => {
                                const resolved = idToNumber.get(String(id));
                                    if (resolved) {
                                        originalNumbers.add(String(resolved).trim());
                                    boothNumbers.add(resolved);
                                    boothNumbers.add(resolved.toLowerCase());
                                    boothNumbers.add(String(parseInt(resolved)).trim());
                                    // resolved id -> number
                                }
                            });
                        }
                    } catch (e) {
                        console.warn('Failed to resolve booth IDs to numbers:', e);
                    }
                }
                console.log('[DEBUG] fetchBoothsWithVisits -> boothIds:', boothIds.size, 'unresolvedIds:', unresolvedBoothIds.size, 'boothNumbers(variants):', boothNumbers.size, 'originalNumbers:', Array.from(originalNumbers));
                setBoothsWithVisits(boothNumbers); // Using booth numbers for matching
                setOriginalBoothNumbers(originalNumbers);
            }
        } catch (err) {
            console.error('Failed to fetch booths with visits:', err);
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

            fetchBoothsWithVisits(); // ensure visits set is populated

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
                
                // Auto-zoom to fit all booth polygons (increased delay for map initialization)
                setTimeout(() => autoZoomToBooths(fc, workStatusMapRef), 1000);
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
            
            // Auto-zoom to fit selected block's booth polygons (increased delay)
            setTimeout(() => autoZoomToBooths(fc, workStatusMapRef), 1000);
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

    // Auto-zoom when booth polygons are loaded and we're on the Visit Booth Map tab
    useEffect(() => {
        if (boothGeoJSON && activeTab === 1 && workStatusMapRef.current) {
            // Increased delay to ensure map is fully rendered
            setTimeout(() => autoZoomToBooths(boothGeoJSON, workStatusMapRef), 1200);
        }
    }, [boothGeoJSON, activeTab]);

    // Debug: log how many markers will be green according to current boothsWithVisits
    useEffect(() => {
        if (!boothGeoJSON) return;
        try {
            const total = boothGeoJSON.features.length;
            let green = 0;
            const matchedNumbers = new Set();
            const digit = (v) => String(v || '').replace(/[^0-9]/g, '');
            const originalDigitSet = new Set(Array.from(originalBoothNumbers).map(digit));
            boothGeoJSON.features.forEach(feature => {
                const props = feature.properties || {};
                const rawCandidates = [props.BoothNo, props.BoothNumber, props.boothNo, props.booth_number, props.id, props.booth, props.Booth_Name, props.BoothName, props.name];
                const boothNo = rawCandidates.find(v => v !== undefined && v !== null && String(v).trim() !== '');
                const boothNoStr = boothNo !== undefined ? String(boothNo).trim() : '';
                const boothNoLower = boothNoStr.toLowerCase();
                const boothNoInt = boothNoStr ? String(parseInt(boothNoStr)).trim() : '';
                let has = false;
                if (boothsWithVisits.has(boothNoStr) || boothsWithVisits.has(boothNoLower) || (boothNoInt && boothsWithVisits.has(boothNoInt))) {
                    has = true;
                    matchedNumbers.add(boothNoStr);
                } else {
                    // Fallback: numeric digit comparison on any candidate and original numbers
                    const featureDigits = new Set(rawCandidates.filter(Boolean).map(v => digit(v)).filter(d => d));
                    for (const fd of featureDigits) {
                        if (originalDigitSet.has(fd)) {
                            has = true;
                            matchedNumbers.add(fd);
                            break;
                        }
                    }
                }
                if (has) green++;
            });
            // Compute which original numbers did not match
            const unmatched = Array.from(originalBoothNumbers).filter(o => {
                const od = digit(o);
                return !Array.from(matchedNumbers).some(m => m === o || m === od);
            });
            console.log('[DEBUG MATCH SUMMARY] polygons:', total, 'green:', green, 'originalBoothNumbers:', Array.from(originalBoothNumbers), 'unmatchedOriginal:', unmatched);
        } catch (e) {
            console.warn('[DEBUG] error computing green markers:', e);
        }
    }, [boothGeoJSON, boothsWithVisits, originalBoothNumbers]);

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

                                        // year selection changed

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
                        onLoad={() => {
                            // Visit Booth Map loaded
                            // Auto-zoom on map load if booth data is already available
                            if (boothGeoJSON) {
                                setTimeout(() => autoZoomToBooths(boothGeoJSON, workStatusMapRef), 500);
                            }
                        }}
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
                                    features: boothGeoJSON.features.map((feature, idx) => {
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

                                        // Check if this booth has visits by matching booth number (try multiple variations)
                                        const boothNoStr = String(boothNo).trim();
                                        const boothNoLower = boothNoStr.toLowerCase();
                                        const boothNoInt = String(parseInt(boothNo) || boothNo).trim();
                                        
                                        let hasWorkStatus = boothsWithVisits.has(boothNoStr) || 
                                                            boothsWithVisits.has(boothNoLower) ||
                                                            boothsWithVisits.has(boothNoInt);
                                        if (!hasWorkStatus) {
                                            // Fallback: compare digits with originalBoothNumbers
                                            const digits = (v) => String(v || '').replace(/[^0-9]/g, '');
                                            const boothDigits = digits(boothNoStr);
                                            if (boothDigits && Array.from(originalBoothNumbers).some(o => digits(o) === boothDigits)) {
                                                hasWorkStatus = true;
                                            } else if (!boothDigits && props.name) {
                                                const nameDigits = digits(props.name);
                                                if (nameDigits && Array.from(originalBoothNumbers).some(o => digits(o) === nameDigits)) {
                                                    hasWorkStatus = true;
                                                }
                                            }
                                        }

                                        // no debug logs

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
