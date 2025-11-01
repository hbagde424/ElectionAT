import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem, Alert,
    Grid, Drawer, Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import CloseIcon from '@mui/icons-material/Close';

import EventModal from './EventModal';
import AlertEventDelete from './AlertEventDelete';
import EventView from './EventsView';
import { usePermissions } from 'contexts/PermissionContext';

export default function EventListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [eventDeleteId, setEventDeleteId] = useState('');
    const [events, setEvents] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [panchayats, setPanchayats] = useState([]);
    const [villages, setVillages] = useState([]);
    const [falliyas, setFalliyas] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const searchDebounceRef = useRef(null);

    // Filter states
    const [selectedState, setSelectedState] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedParliament, setSelectedParliament] = useState('');
    const [selectedAssembly, setSelectedAssembly] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedBooth, setSelectedBooth] = useState('');
    const [selectedPanchayat, setSelectedPanchayat] = useState('');
    const [selectedVillage, setSelectedVillage] = useState('');
    const [selectedFalliya, setSelectedFalliya] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedType, setSelectedType] = useState('');

    // Temporary filter states
    const [tempFilters, setTempFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        panchayat: '',
        village: '',
        falliya: '',
        status: '',
        type: ''
    });

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);
    const [filteredPanchayats, setFilteredPanchayats] = useState([]);
    const [filteredVillages, setFilteredVillages] = useState([]);
    const [filteredFalliyas, setFilteredFalliyas] = useState([]);

    // Previous values to detect changes
    const prevStateRef = useRef('');
    const prevDivisionRef = useRef('');
    const prevParliamentRef = useRef('');
    const prevAssemblyRef = useRef('');
    const prevBlockRef = useRef('');

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapTheme, setMapTheme] = useState('streets');
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithEvents, setBoothsWithEvents] = useState(new Set());
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all events data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all events data' };
        }

        const levelNames = {
            state: 'State',
            division: 'Division',
            parliament: 'Parliament',
            assembly: 'Assembly',
            block: 'Block',
            booth: 'Booth'
        };

        const levelName = levelNames[highestLevel.level] || 'Unknown';
        const levelValue = highestLevel.value || 'Unknown';

        return {
            level: levelName,
            description: `You have access to events data for ${levelName}: ${levelValue}`
        };
    };

    const accessScope = getUserAccessScope();

    // Memo: map event booth IDs to booth numbers for quick lookup (used for marker coloring)
    const eventBoothNumberSet = useMemo(() => {
        const set = new Set();
        try {
            Array.from(boothsWithEvents || []).forEach((id) => {
                const booth = booths?.find((b) => String(b._id) === String(id));
                const num = booth && String(booth.booth_number).trim().toLowerCase();
                if (num) set.add(num);
            });
        } catch {}
        return set;
    }, [boothsWithEvents, booths]);

    // Memo: Build deduplicated marker source (1 point per unique booth number)
    const boothMarkersGeoJSON = useMemo(() => {
        if (!boothGeoJSON?.features) return null;
        const seen = new Set();
        const features = [];

        // helper: centroid from geom (Polygon/MultiPolygon)
        const centroidFromGeom = (geometry) => {
            try {
                const coordsArr = [];
                const collect = (arr) => arr.forEach(pt => Array.isArray(pt[0]) ? collect(pt) : coordsArr.push(pt));
                if (!geometry) return [0, 0];
                if (geometry.type === 'Polygon') collect(geometry.coordinates || []);
                if (geometry.type === 'MultiPolygon') (geometry.coordinates || []).forEach(poly => collect(poly));
                if (!coordsArr.length) return [0, 0];
                const lngs = coordsArr.map(c => c[0]);
                const lats = coordsArr.map(c => c[1]);
                return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
            } catch (e) { return [0, 0]; }
        };

        // helper: normalize booth number string
        const normalizeBoothNo = (raw) => {
            if (raw === undefined || raw === null) return '';
            const s = String(raw).trim();
            if (!s) return '';
            // remove surrounding whitespace and lowercase
            let n = s.toLowerCase();
            // if numeric-like, strip leading zeros for consistent matching
            if (/^0*\d+$/.test(n)) n = String(Number(n));
            return n;
        };

        // helper: distance in meters between two [lng,lat]
        const distanceMeters = (a, b) => {
            try {
                const toRad = (v) => v * Math.PI / 180;
                const [lng1, lat1] = a; const [lng2, lat2] = b;
                const R = 6371000; // meters
                const dLat = toRad(lat2 - lat1);
                const dLon = toRad(lng2 - lng1);
                const rLat1 = toRad(lat1); const rLat2 = toRad(lat2);
                const aa = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
                return R * c;
            } catch { return Infinity; }
        };

        // store centroids added to compare proximity for features without booth numbers
        const addedCentroids = [];

        for (const feature of boothGeoJSON.features) {
            const props = feature.properties || {};
            const boothNoRaw = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
            const boothNoNorm = normalizeBoothNo(boothNoRaw);
            const coordinates = centroidFromGeom(feature.geometry);

            // if we have a normalized booth number, dedupe by that
            if (boothNoNorm) {
                const key = `booth:${boothNoNorm}`;
                if (seen.has(key)) continue;
                seen.add(key);

                const hasEvents = eventBoothNumberSet.has(boothNoNorm);
                features.push({ type: 'Feature', geometry: { type: 'Point', coordinates }, properties: { ...props, hasEvents, _dedupeKey: key } });
                addedCentroids.push(coordinates);
                continue;
            }

            // For features without booth number: skip if centroid is very close (within 30m) to an already added centroid
            const close = addedCentroids.some(c => distanceMeters(c, coordinates) <= 30);
            if (close) continue;

            // quantize key as fallback
            const coordKey = `coord:${coordinates[0].toFixed(5)},${coordinates[1].toFixed(5)}`;
            if (seen.has(coordKey)) continue;
            seen.add(coordKey);

            // determine hasEvents by trying to find matching booth number in booths array via properties if possible
            const propsBoothNo = normalizeBoothNo(props.booth_number || props.BoothNo || props.BoothNumber || props.boothNo);
            const hasEvents = propsBoothNo ? eventBoothNumberSet.has(propsBoothNo) : false;

            features.push({ type: 'Feature', geometry: { type: 'Point', coordinates }, properties: { ...props, hasEvents, _dedupeKey: coordKey } });
            addedCentroids.push(coordinates);
        }

        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, eventBoothNumberSet]);

    // State -> Division
    useEffect(() => {
        if (tempFilters.state) {
            const filtered = divisions?.filter(division => {
                const matches = division.state_id?._id === tempFilters.state ||
                    division.state_id === tempFilters.state;
                return matches;
            }) || [];

            setFilteredDivisions(filtered);

            // Clear dependent fields only if state actually changed
            if (prevStateRef.current !== tempFilters.state) {
                setTempFilters(prev => ({
                    ...prev,
                    division: '',
                    parliament: '',
                    assembly: '',
                    block: '',
                    booth: ''
                }));
            }
        } else {
            setFilteredDivisions(divisions || []);
        }
        prevStateRef.current = tempFilters.state;
    }, [tempFilters.state, divisions]);

    // Division -> Parliament
    useEffect(() => {
        if (tempFilters.division) {
            const filtered = parliaments?.filter(parliament => {
                const matches = parliament.division_id?._id === tempFilters.division ||
                    parliament.division_id === tempFilters.division;
                return matches;
            }) || [];

            setFilteredParliaments(filtered);

            // Clear dependent fields only if division actually changed
            if (prevDivisionRef.current !== tempFilters.division) {
                setTempFilters(prev => ({
                    ...prev,
                    parliament: '',
                    assembly: '',
                    block: '',
                    booth: ''
                }));
            }
        } else {
            setFilteredParliaments(parliaments || []);
        }
        prevDivisionRef.current = tempFilters.division;
    }, [tempFilters.division, parliaments]);    // Parliament -> Assembly
    useEffect(() => {
        if (tempFilters.parliament) {
            const filtered = assemblies?.filter(assembly =>
                assembly.parliament_id?._id === tempFilters.parliament ||
                assembly.parliament_id === tempFilters.parliament
            ) || [];
            setFilteredAssemblies(filtered);

            // Clear dependent fields only if parliament actually changed
            if (prevParliamentRef.current !== tempFilters.parliament) {
                setTempFilters(prev => ({
                    ...prev,
                    assembly: '',
                    block: '',
                    booth: ''
                }));
            }
        } else {
            setFilteredAssemblies(assemblies || []);
        }
        prevParliamentRef.current = tempFilters.parliament;
    }, [tempFilters.parliament, assemblies]);

    // Assembly -> Block
    useEffect(() => {
        if (tempFilters.assembly) {
            const filtered = blocks?.filter(block =>
                block.assembly_id?._id === tempFilters.assembly ||
                block.assembly_id === tempFilters.assembly
            ) || [];
            setFilteredBlocks(filtered);

            // Clear dependent fields only if assembly actually changed
            if (prevAssemblyRef.current !== tempFilters.assembly) {
                setTempFilters(prev => ({
                    ...prev,
                    block: '',
                    booth: ''
                }));
            }
        } else {
            setFilteredBlocks(blocks || []);
        }
        prevAssemblyRef.current = tempFilters.assembly;
    }, [tempFilters.assembly, blocks]);

    // Block -> Booth
    useEffect(() => {
        if (tempFilters.block) {
            const filtered = booths?.filter(booth =>
                booth.block_id?._id === tempFilters.block ||
                booth.block_id === tempFilters.block
            ) || [];
            setFilteredBooths(filtered);

            // Clear booth only if block actually changed
            if (prevBlockRef.current !== tempFilters.block) {
                setTempFilters(prev => ({
                    ...prev,
                    booth: '',
                    panchayat: '',
                    village: '',
                    falliya: ''
                }));
            }

            // Filter panchayats based on selected block
            const filteredPanchs = panchayats?.filter(panchayat =>
                panchayat.block_id?._id === tempFilters.block ||
                panchayat.block_id === tempFilters.block
            ) || [];
            setFilteredPanchayats(filteredPanchs);
        } else {
            setFilteredBooths(booths || []);
            setFilteredPanchayats([]);
        }
        prevBlockRef.current = tempFilters.block;
    }, [tempFilters.block, booths, panchayats]);

    // Panchayat -> Village
    useEffect(() => {
        if (tempFilters.panchayat) {
            const filtered = villages?.filter(village =>
                village.panchayat_id?._id === tempFilters.panchayat ||
                village.panchayat_id === tempFilters.panchayat
            ) || [];
            setFilteredVillages(filtered);
            
            setTempFilters(prev => ({
                ...prev,
                village: '',
                falliya: ''
            }));
        } else {
            setFilteredVillages([]);
        }
    }, [tempFilters.panchayat, villages]);

    // Village -> Falliya
    useEffect(() => {
        if (tempFilters.village) {
            const filtered = falliyas?.filter(falliya =>
                falliya.village_id?._id === tempFilters.village ||
                falliya.village_id === tempFilters.village
            ) || [];
            setFilteredFalliyas(filtered);
            
            setTempFilters(prev => ({
                ...prev,
                falliya: ''
            }));
        } else {
            setFilteredFalliyas([]);
        }
    }, [tempFilters.village, falliyas]);

    const fetchReferenceData = async () => {
        try {
            const getAuthHeaders = () => {
                const token = localStorage.getItem('serviceToken');
                return token ? { Authorization: `Bearer ${token}` } : {};
            };

            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, panchayatsRes, villagesRes, falliyasRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/panchayats`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/villages`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/falliyas`, { headers: getAuthHeaders() })
            ]);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData, panchayatsData, villagesData, falliyasData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                panchayatsRes.json(),
                villagesRes.json(),
                falliyasRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (panchayatsData.success) setPanchayats(panchayatsData.data);
            if (villagesData.success) setVillages(villagesData.data);
            if (falliyasData.success) setFalliyas(falliyasData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Fetch booths with events to mark them on the map
    const fetchBoothsWithEvents = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const eventsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/events?all=true&limit=50000`, { headers });
            const eventsJson = await eventsRes.json();
            if (eventsJson.success && Array.isArray(eventsJson.data)) {
                const boothIds = new Set();
                eventsJson.data.forEach(event => {
                    if (event.booth_id) {
                        const boothId = event.booth_id._id || event.booth_id;
                        boothIds.add(String(boothId));
                    }
                });
                setBoothsWithEvents(boothIds);
                console.log('✅ Booths with events updated:', boothIds.size);
            }
        } catch (err) {
            console.warn('Failed to fetch booths with events:', err);
        }
    };

    // Load booth polygons by block name or id (tries multiple backend endpoints)
    const loadBoothPolygons = async (blockInput) => {
        if (!blockInput) {
            setMapError('Please select a Block');
            return;
        }
        setMapError('');
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch booths with events in parallel
            fetchBoothsWithEvents();

            // If user selected ALL blocks, fetch all polygons (large result)
            if (blockInput === 'ALL') {
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
                setTimeout(() => {
                    try {
                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                        if (!map || !fc.features?.length) return;
                        const coords = [];
                        fc.features.forEach(f => {
                            const geom = f.geometry;
                            if (!geom) return;
                            const collect = (arr) => arr.forEach(pt => Array.isArray(pt[0]) ? collect(pt) : coords.push(pt));
                            if (geom.type === 'Polygon') collect(geom.coordinates);
                            if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => collect(poly));
                        });
                        if (coords.length) {
                            const lons = coords.map(c => c[0]);
                            const lats = coords.map(c => c[1]);
                            const bounds = [
                                [Math.min(...lons), Math.min(...lats)],
                                [Math.max(...lons), Math.max(...lats)]
                            ];
                            map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
                        }
                    } catch { }
                }, 0);
                return;
            }

            // Try multiple endpoints in order until we get features
            const candidates = [
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block/${encodeURIComponent(blockInput)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${encodeURIComponent(blockInput)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons?block=${encodeURIComponent(blockInput)}`
            ];

            let json = null;
            for (const url of candidates) {
                try {
                    const resp = await fetch(url, { headers });
                    if (!resp.ok) {
                        console.warn('Non-ok response from', url, resp.status);
                        continue;
                    }
                    const j = await resp.json();
                    const features = j.features || (Array.isArray(j) ? j : (j.data || null));
                    if (features && Array.isArray(features) && features.length > 0) {
                        json = { type: 'FeatureCollection', features };
                        break;
                    }
                } catch (innerErr) {
                    console.warn('Error fetching booth polygons from candidate url:', innerErr);
                }
            }

            if (!json) {
                setMapError(`No booth polygons found for block '${blockInput}'`);
                setBoothGeoJSON(null);
                return;
            }

            const fc = { type: 'FeatureCollection', features: json.features };
            setBoothGeoJSON(fc);
            setTimeout(() => {
                try {
                    const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                    if (!map || !fc.features?.length) return;
                    const coords = [];
                    fc.features.forEach(f => {
                        const geom = f.geometry;
                        if (!geom) return;
                        const collect = (arr) => arr.forEach(pt => Array.isArray(pt[0]) ? collect(pt) : coords.push(pt));
                        if (geom.type === 'Polygon') collect(geom.coordinates);
                        if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => collect(poly));
                    });
                    if (coords.length) {
                        const lons = coords.map(c => c[0]);
                        const lats = coords.map(c => c[1]);
                        const bounds = [
                            [Math.min(...lons), Math.min(...lats)],
                            [Math.max(...lons), Math.max(...lats)]
                        ];
                        map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
                    }
                } catch { }
            }, 0);
        } catch (e) {
            console.error('Failed to load booth polygons:', e);
            setMapError(`Failed to load booth polygons: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    // Auto-load ALL blocks map on component mount
    useEffect(() => {
        if (mapboxToken && blocks && blocks.length > 0) {
            loadBoothPolygons('ALL');
        }
    }, [blocks, mapboxToken]);

    // Fetch booth details and events when a polygon is clicked
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

            // Get events for this booth
            let events = [];
            if (booth && booth._id) {
                try {
                    const eventsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/events?booth=${encodeURIComponent(booth._id)}&all=true`, { headers });
                    const eventsJson = await eventsRes.json();
                    if (eventsJson.success && Array.isArray(eventsJson.data)) {
                        events = eventsJson.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch events for booth:', e);
                }
            }

            // When a booth is found, also filter the table below to this booth
            if (booth && booth._id) {
                setSelectedBooth(booth._id);
                setTempFilters((prev) => ({
                    ...prev,
                    state: booth.state_id?._id || booth.state_id || prev.state,
                    division: booth.division_id?._id || booth.division_id || prev.division,
                    parliament: booth.parliament_id?._id || booth.parliament_id || prev.parliament,
                    assembly: booth.assembly_id?._id || booth.assembly_id || prev.assembly,
                    block: booth.block_id?._id || booth.block_id || prev.block,
                    booth: booth._id
                }));
                // reset to first page so user sees results immediately
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }

            setDrawerData({
                loading: false,
                boothNo,
                details: {
                    booth,
                    events
                }
            });
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, events: [] }, error: e.message });
        }
    };

    const fetchEvents = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            if (selectedState) query += `&state_id=${selectedState}`;
            if (selectedDivision) query += `&division_id=${selectedDivision}`;
            if (selectedParliament) query += `&parliament_id=${selectedParliament}`;
            if (selectedAssembly) query += `&assembly_id=${selectedAssembly}`;
            if (selectedBlock) query += `&block_id=${selectedBlock}`;
            if (selectedBooth) query += `&booth_id=${selectedBooth}`;
            if (selectedPanchayat) query += `&panchayat_id=${selectedPanchayat}`;
            if (selectedVillage) query += `&village_id=${selectedVillage}`;
            if (selectedFalliya) query += `&falliya_id=${selectedFalliya}`;
            if (selectedStatus) query += `&status=${selectedStatus}`;
            if (selectedType) query += `&type=${selectedType}`;

            // Add hierarchy-based filtering
            if (userHierarchy) {
                const highest = getUserHighestLevel();
                if (highest) {
                    switch (highest) {
                        case 'state':
                            query += `&state_id=${userHierarchy.state}`;
                            break;
                        case 'division':
                            query += `&division_id=${userHierarchy.division}`;
                            break;
                        case 'parliament':
                            query += `&parliament_id=${userHierarchy.parliament}`;
                            break;
                        case 'assembly':
                            query += `&assembly_id=${userHierarchy.assembly}`;
                            break;
                        case 'block':
                            query += `&block_id=${userHierarchy.block}`;
                            break;
                        case 'booth':
                            query += `&booth_id=${userHierarchy.booth}`;
                            break;
                    }
                }
            }

            // When searching, fetch all results on first page
            let currentPage = pageIndex + 1;
            let currentLimit = pageSize;
            if (globalFilter) {
                currentPage = 1;
                currentLimit = 10000; // Get all results when searching
            }

            const apiUrl = `${import.meta.env.VITE_APP_API_URL}/events?page=${currentPage}&limit=${currentLimit}${query}`;

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(apiUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const json = await res.json();

            if (json.success) {
                setEvents(json.data);
                // When searching, set pageCount to 1 to show all results on single page
                if (globalFilter) {
                    setPageCount(1);
                    // Reset pagination to first page when searching
                    if (pageIndex !== 0) {
                        setPagination(prev => ({ ...prev, pageIndex: 0 }));
                    }
                } else {
                    setPageCount(json.pages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [
        pagination.pageIndex,
        pagination.pageSize,
        globalFilter,
        selectedState,
        selectedDivision,
        selectedParliament,
        selectedAssembly,
        selectedBlock,
        selectedBooth,
        selectedPanchayat,
        selectedVillage,
        selectedFalliya,
        selectedStatus,
        selectedType
    ]);

    // Debug useEffect to track when selectedDivision changes
    useEffect(() => {
        if (selectedDivision) {
            const selectedDivisionData = divisions?.find(d => d._id === selectedDivision);
        }
    }, [selectedDivision, divisions]);

    // Fetch reference data only once when component mounts
    useEffect(() => {
        fetchReferenceData();
    }, []);

    const handleDeleteOpen = (id) => {
        setEventDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Safe date-time formatter — avoids 'Invalid Date'
    const formatDateTime = (value) => {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleString();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'done': return 'success';
            case 'incomplete': return 'warning';
            case 'cancelled': return 'error';
            case 'postponed': return 'info';
            default: return 'default';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'campaign': return 'primary';
            case 'activity': return 'secondary';
            default: return 'default';
        }
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row, table }) => {
                const { pageIndex, pageSize } = table.getState().pagination;
                const serialNumber = pageIndex * pageSize + row.index + 1;
                return <Typography>{serialNumber}</Typography>;
            },
            size: 60
        },
        {
            header: 'Event Name',
            accessorKey: 'name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    minWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()}
                </Typography>
            ),
            size: 200
        },
        {
            header: 'Type',
            accessorKey: 'type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    size="small"
                    color={getTypeColor(getValue())}
                    variant="outlined"
                />
            ),
            size: 120
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    color={getStatusColor(getValue())}
                    size="small"
                />
            ),
            size: 120
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{
                    minWidth: 200,
                    maxWidth: 300,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() ? getValue().replace(/<[^>]+>/g, '') : 'N/A'}
                </Typography>
            ),
            size: 300
        },
        {
            header: 'Start Date',
            accessorKey: 'start_date',
            cell: ({ getValue }) => (
                <Typography>
                    {formatDate(getValue())}
                </Typography>
            ),
            size: 120
        },
        {
            header: 'End Date',
            accessorKey: 'end_date',
            cell: ({ getValue }) => (
                <Typography>
                    {formatDate(getValue())}
                </Typography>
            ),
            size: 120
        },
        {
            header: 'Location',
            accessorKey: 'location',
            cell: ({ getValue }) => (
                <Typography sx={{
                    minWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()}
                </Typography>
            ),
            size: 200
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="warning"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="secondary"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="info"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Booth Number',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.booth_number || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Panchayat',
            accessorKey: 'panchayat_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.panchayat_name || 'N/A'}
                    color="info"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Village',
            accessorKey: 'village_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.village_name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Falliya',
            accessorKey: 'falliya_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.falliya_name || 'N/A'}
                    color="warning"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 150
        },
        {
            header: 'Year',
            accessorKey: 'year',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            ),
            size: 100
        },
        {
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            ),
            size: 150
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => (
                <Typography>{formatDateTime(getValue())}</Typography>
            ),
            size: 150
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            ),
            size: 150
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => (
                <Typography>{formatDateTime(getValue())}</Typography>
            ),
            size: 150
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>

                        <IconButton
                            color="info"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/Events/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedEvent(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            },
            size: 150
        }
    ], [theme]);

    const table = useReactTable({
        data: events,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllEventsForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/events?all=true`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all events for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllEventsForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            Type: item.type,
            Status: item.status,
            Description: item.description ? item.description.replace(/<[^>]+>/g, '') : '',
            'Start Date': item.start_date,
            'End Date': item.end_date,
            Location: item.location,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            Block: item.block_id?.name || '',
            Booth: item.booth_id?.name || '',
            'Booth Number': item.booth_id?.booth_number || '',
            'Created By': item.created_by?.username || '',
            'Updated By': item.updated_by?.username || '',
            'Created At': item.created_at,
            'Updated At': item.updated_at
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    // Do not block the entire page during table fetches; we'll show a loader inside the table instead

    return (
        <>
            <MainCard content={false}>
                {/* Mapbox Booth Polygons */}
                <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid item xs={12}>
                        <Typography variant="h5" sx={{ mb: 1 }}>Events Map</Typography>
                        {!mapboxToken && (
                            <Alert severity="warning" sx={{ mb: 1 }}>Mapbox token missing. Set VITE_APP_MAPBOX_ACCESS_TOKEN.</Alert>
                        )}
                        {mapError && (
                            <Alert severity="error" sx={{ mb: 1 }}>{mapError}</Alert>
                        )}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                            <TextField
                                select
                                size="small"
                                label="Block"
                                value={blockNumberInput}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setBlockNumberInput(value);

                                }}
                                sx={{ width: { xs: '100%', sm: 260 } }}
                            >
                                <MenuItem value="">Select Block</MenuItem>
                                <MenuItem value="ALL">All Blocks</MenuItem>
                                {blocks?.map((b) => (
                                    <MenuItem key={b._id} value={b.name}>{b.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                size="small"
                                label="Year"
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 150 } }}
                            >
                                <MenuItem value="">All Years</MenuItem>
                                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </TextField>
                            <Button variant="contained" size="small" onClick={() => loadBoothPolygons(blockNumberInput)}>
                                Load Polygons
                            </Button>
                            <TextField
                                select
                                size="small"
                                label="Map Theme"
                                value={mapTheme}
                                onChange={(e) => setMapTheme(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 180 } }}
                            >
                                <MenuItem value="streets">Streets</MenuItem>
                                <MenuItem value="satellite">Satellite</MenuItem>
                                <MenuItem value="light">Light</MenuItem>
                                <MenuItem value="dark">Dark</MenuItem>
                            </TextField>
                        </Stack>

                        <MapContainerStyled>
                            <Map
                                ref={mapRef}
                                initialViewState={{ latitude: 23.4707, longitude: 77.9455, zoom: 6 }}
                                mapStyle={
                                    mapTheme === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' :
                                        mapTheme === 'light' ? 'mapbox://styles/mapbox/light-v10' :
                                            mapTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v10' :
                                                'mapbox://styles/mapbox/streets-v11'
                                }
                                mapboxAccessToken={mapboxToken}
                                interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
                                onClick={(e) => {
                                    if (!boothGeoJSON) return;
                                    try {
                                        const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                        let features = e.features || [];
                                        if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                            const point = e.point || { x: e.x, y: e.y };
                                            if (point) {
                                                features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                            }
                                        }

                                        const boothFeature = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                        if (boothFeature) {
                                            const props = boothFeature.properties || {};
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || (props.properties && (props.properties.BoothNo || props.properties.booth_number));
                                            setDrawerOpen(true);
                                            setDrawerData({ loading: true, boothNo, details: null });
                                            fetchBoothDetailsByPolygon(boothNo);
                                        }
                                    } catch (err) {
                                        console.error('Error handling map click:', err);
                                    }
                                }}
                            >
                                <MapControl />
                                {boothGeoJSON && (
                                    <Source id="booth-source" type="geojson" data={boothGeoJSON}>
                                        <Layer 
                                            id="booth-fill" 
                                            type="fill" 
                                            paint={{ 
                                                'fill-color': '#1e88e5', 
                                                'fill-opacity': 0.25 
                                            }} 
                                        />
                                        <Layer 
                                            id="booth-outline" 
                                            type="line" 
                                            paint={{ 
                                                'line-color': '#1565c0', 
                                                'line-width': 1 
                                            }} 
                                        />
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
                                {/* Event Markers Layer - deduped by booth number */}
                                {boothMarkersGeoJSON && (
                                    <Source id="booth-markers" type="geojson" data={boothMarkersGeoJSON}>
                                        <Layer
                                            id="booth-event-markers"
                                            type="circle"
                                            paint={{
                                                'circle-radius': 6,
                                                'circle-color': [
                                                    'case',
                                                    ['get', 'hasEvents'],
                                                    '#22c55e', // Green for booths with events
                                                    '#ef4444'  // Red for booths without events
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
                                    <Typography variant="caption">Has Events</Typography>
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
                                    <Typography variant="caption">No Events</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <TextField
                        size="small"
                        variant="outlined"
                        placeholder={`Search ${events.length} events...`}
                        value={searchInput}
                        onChange={(e) => {
                            const v = e.target.value;
                            setSearchInput(v);
                            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                            searchDebounceRef.current = setTimeout(() => setGlobalFilter(v), 500);
                        }}
                        sx={{ minWidth: 300 }}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="events_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedEvent(null); setOpenModal(true); }}>
                            Add Event
                        </Button>
                    </Stack>
                </Stack>

                {/* Access Scope Information */}
                <Alert
                    severity="info"
                    sx={{ m: 2 }}
                >
                    <Typography variant="body2">
                        <strong>Data Access:</strong> {accessScope.description}
                    </Typography>
                </Alert>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                >
                    {/* State */}
                    <TextField
                        select
                        label="State"
                        value={tempFilters.state}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, state: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                    >
                        <MenuItem value="">All States</MenuItem>
                        {states.map((state) => (
                            <MenuItem key={state._id} value={state._id}>
                                {state.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Division */}
                    <TextField
                        select
                        label="Division"
                        value={tempFilters.division}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, division: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">All Divisions</MenuItem>
                        {filteredDivisions.map((division) => (
                            <MenuItem key={division._id} value={division._id}>
                                {division.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Parliament */}
                    <TextField
                        select
                        label="Parliament"
                        value={tempFilters.parliament}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, parliament: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.division}
                    >
                        <MenuItem value="">All Parliaments</MenuItem>
                        {filteredParliaments.map((parliament) => (
                            <MenuItem key={parliament._id} value={parliament._id}>
                                {parliament.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Assembly */}
                    <TextField
                        select
                        label="Assembly"
                        value={tempFilters.assembly}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, assembly: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.parliament}
                    >
                        <MenuItem value="">All Assemblies</MenuItem>
                        {filteredAssemblies.map((assembly) => (
                            <MenuItem key={assembly._id} value={assembly._id}>
                                {assembly.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Block */}
                    <TextField
                        select
                        label="Block"
                        value={tempFilters.block}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, block: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.assembly}
                    >
                        <MenuItem value="">All Blocks</MenuItem>
                        {filteredBlocks.map((block) => (
                            <MenuItem key={block._id} value={block._id}>
                                {block.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Booth */}
                    <TextField
                        select
                        label="Booth"
                        value={tempFilters.booth}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, booth: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.block}
                    >
                        <MenuItem value="">All Booths</MenuItem>
                        {filteredBooths.map((booth) => (
                            <MenuItem key={booth._id} value={booth._id}>
                                {booth.name} (No: {booth.booth_number})
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Panchayat */}
                    <TextField
                        select
                        label="Panchayat"
                        value={tempFilters.panchayat}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, panchayat: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.block}
                    >
                        <MenuItem value="">All Panchayats</MenuItem>
                        {filteredPanchayats.map((panchayat) => (
                            <MenuItem key={panchayat._id} value={panchayat._id}>
                                {panchayat.panchayat_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Village */}
                    <TextField
                        select
                        label="Village"
                        value={tempFilters.village}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, village: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.panchayat}
                    >
                        <MenuItem value="">All Villages</MenuItem>
                        {filteredVillages.map((village) => (
                            <MenuItem key={village._id} value={village._id}>
                                {village.village_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Falliya */}
                    <TextField
                        select
                        label="Falliya"
                        value={tempFilters.falliya}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, falliya: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.village}
                    >
                        <MenuItem value="">All Falliyas</MenuItem>
                        {filteredFalliyas.map((falliya) => (
                            <MenuItem key={falliya._id} value={falliya._id}>
                                {falliya.falliya_name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Status */}
                    <TextField
                        select
                        label="Status"
                        value={tempFilters.status}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, status: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="done">Done</MenuItem>
                        <MenuItem value="incomplete">Incomplete</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                        <MenuItem value="postponed">Postponed</MenuItem>
                    </TextField>

                    {/* Type */}
                    <TextField
                        select
                        label="Type"
                        value={tempFilters.type}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, type: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                    >
                        <MenuItem value="">All Types</MenuItem>
                        <MenuItem value="campaign">Campaign</MenuItem>
                        <MenuItem value="activity">Activity</MenuItem>
                    </TextField>

                    {/* Apply and Clear Buttons */}
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSelectedState(tempFilters.state);
                            setSelectedDivision(tempFilters.division);
                            setSelectedParliament(tempFilters.parliament);
                            setSelectedAssembly(tempFilters.assembly);
                            setSelectedBlock(tempFilters.block);
                            setSelectedBooth(tempFilters.booth);
                            setSelectedPanchayat(tempFilters.panchayat);
                            setSelectedVillage(tempFilters.village);
                            setSelectedFalliya(tempFilters.falliya);
                            setSelectedStatus(tempFilters.status);
                            setSelectedType(tempFilters.type);
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Apply
                    </Button>                    <Button
                        variant="outlined"
                        onClick={() => {
                            setTempFilters({
                                state: '',
                                division: '',
                                parliament: '',
                                assembly: '',
                                block: '',
                                booth: '',
                                panchayat: '',
                                village: '',
                                falliya: '',
                                status: '',
                                type: ''
                            });
                            setSelectedState('');
                            setSelectedDivision('');
                            setSelectedParliament('');
                            setSelectedAssembly('');
                            setSelectedBlock('');
                            setSelectedBooth('');
                            setSelectedPanchayat('');
                            setSelectedVillage('');
                            setSelectedFalliya('');
                            setSelectedStatus('');
                            setSelectedType('');
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Clear
                    </Button>
                </Stack>

                <ScrollX>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: 'primary.main' }}>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                sx={{
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    backgroundColor: 'primary.main'
                                                }}
                                            >
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
                                                    {header.column.getCanSort() && <HeaderSort column={header.column} />}
                                                </Stack>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={table.getAllLeafColumns().length}>
                                            <Typography variant="body2">Loading...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <Fragment key={row.id}>
                                            <TableRow>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                            {row.getIsExpanded() && (
                                                <TableRow>
                                                    <TableCell colSpan={row.getVisibleCells().length}>
                                                        <EventView data={row.original} />
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                        <TablePagination
                            setPageSize={(size) => setPagination((prev) => ({ ...prev, pageSize: size }))}
                            setPageIndex={(index) => setPagination((prev) => ({ ...prev, pageIndex: index }))}
                            getState={table.getState}
                            getPageCount={() => pageCount}
                        />
                    </Box>
                </ScrollX>
            </MainCard>

            {/* Right-side Drawer for clicked booth info */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                        <Box>
                            <Typography variant="h6">Booth Details</Typography>
                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view events</Typography>
                        </Box>
                        <IconButton color="secondary" onClick={() => setDrawerOpen(false)} sx={{ p: 0.5 }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 72px)' }}>
                        {!drawerData && <Typography variant="body2">Click a booth polygon to view details.</Typography>}
                        {drawerData?.loading && <Typography variant="body2">Loading...</Typography>}

                        {drawerData?.details && (
                            <Stack spacing={2}>
                                <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Booth Information</Typography>
                                    <Typography variant="body2"><strong>Name:</strong> {drawerData.details.booth?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Booth No:</strong> {drawerData.details.booth?.booth_number || drawerData.details.boothNo || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Block:</strong> {drawerData.details.booth?.block_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Assembly:</strong> {drawerData.details.booth?.assembly_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.booth?.parliament_id?.name || 'N/A'}</Typography>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Events ({drawerData.details.events?.length || 0})</Typography>
                                    {drawerData.details.events?.length ? drawerData.details.events.slice(0, 10).map(event => (
                                        <Box key={event._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{event.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {event.type} • {event.status}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={event.type?.toUpperCase() || 'N/A'}
                                                    size="small"
                                                    color={event.type === 'campaign' ? 'primary' : 'secondary'}
                                                    sx={{ mr: 0.5 }}
                                                />
                                                <Chip
                                                    label={event.status?.toUpperCase() || 'N/A'}
                                                    size="small"
                                                    color={event.status === 'done' ? 'success' : event.status === 'incomplete' ? 'warning' : 'error'}
                                                />
                                            </Box>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                📅 {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A'} - {event.end_date ? new Date(event.end_date).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                            {event.location && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    📍 {event.location}
                                                </Typography>
                                            )}
                                            {event.description && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    {event.description.replace(/<[^>]*>/g, '').slice(0, 100)}...
                                                </Typography>
                                            )}
                                        </Box>
                                    )) : (
                                        <Typography variant="body2">No events found for this booth.</Typography>
                                    )}
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <EventModal
                open={openModal}
                modalToggler={setOpenModal}
                event={selectedEvent}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => {
                    fetchEvents(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithEvents();
                }}
            />

            <AlertEventDelete
                id={eventDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => {
                    fetchEvents(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithEvents();
                }}
            />
        </>
    );
}
