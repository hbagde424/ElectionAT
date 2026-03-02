import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip,
    FormControl, InputLabel, Select, MenuItem, Grid, TextField, Alert, Drawer, Paper, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';
import { usePermissions } from 'contexts/PermissionContext';

import WorkStatusModal from './WorkStatusModal';
import AlertWorkStatusDelete from './AlertWorkStatusDelete';
import WorkStatusView from './WorkStatusView';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import MapGL, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

export default function WorkStatusListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    const [selectedWorkStatus, setSelectedWorkStatus] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [workStatusDeleteId, setWorkStatusDeleteId] = useState('');
    const [workStatuses, setWorkStatuses] = useState([]);
    const [allWorkStatuses, setAllWorkStatuses] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [panchayats, setPanchayats] = useState([]);
    const [villages, setVillages] = useState([]);
    const [falliyas, setFalliyas] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const searchDebounceRef = useRef(null);

    // Import functionality states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithWorkStatus, setBoothsWithWorkStatus] = useState({ ids: new Set(), numbers: new Set() });
    // Memoized maps/sets for efficient lookups
    const normalizeBoothNo = (raw) => {
        if (raw === null || raw === undefined) return '';
        const s = String(raw).trim().toLowerCase();
        // strip non-alphanumerics except slash/hyphen, and remove leading zeros for pure numbers
        const cleaned = s.replace(/\s+/g, ' ').replace(/[^a-z0-9\/-]/g, '');
        return cleaned.replace(/\b0+(?=\d)/g, '');
    };
    const boothIdToNumberMap = useMemo(() => {
        const m = new Map();
        booths.forEach((b) => {
            m.set(String(b._id), normalizeBoothNo(b.booth_number));
        });
        return m;
    }, [booths]);
    const boothNumbersWithWorkStatus = useMemo(() => {
        // Already normalized in fetchBoothsWithWorkStatus
        return boothsWithWorkStatus.numbers;
    }, [boothsWithWorkStatus.numbers]);

    // Build a deduped FeatureCollection of point markers from booth polygons
    const boothMarkersGeoJSON = useMemo(() => {
        if (!boothGeoJSON || !Array.isArray(boothGeoJSON.features)) return null;

        // approximate distance in meters using equirectangular approximation
        const distanceMeters = (a, b) => {
            if (!a || !b) return Infinity;
            const R = 6371000; // meters
            const toRad = (d) => (d * Math.PI) / 180;
            const lat1 = toRad(a[1]);
            const lat2 = toRad(b[1]);
            const dLat = lat2 - lat1;
            const dLon = toRad(b[0] - a[0]);
            const x = dLon * Math.cos((lat1 + lat2) / 2);
            const y = dLat;
            return Math.sqrt(x * x + y * y) * R;
        };

        const centroidOf = (feature) => {
            try {
                const geom = feature.geometry;
                if (!geom) return null;
                const coords = [];
                const collect = (arr) => arr.forEach((pt) => (Array.isArray(pt[0]) ? collect(pt) : coords.push(pt)));
                if (geom.type === 'Polygon') collect(geom.coordinates);
                if (geom.type === 'MultiPolygon') geom.coordinates.forEach((poly) => collect(poly));
                if (!coords.length) return null;
                const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
                const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
                return [lng, lat];
            } catch {
                return null;
            }
        };

        const seenBoothNos = new Set();
        const seenKeys = new Set();
        const keptCentroids = [];
        const features = [];
        const PROXIMITY_M = 30; // 30 meters

        for (const f of boothGeoJSON.features) {
            const props = f.properties || {};
            const boothNoRaw = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || '';
            const boothNoNorm = normalizeBoothNo(boothNoRaw);
            const center = centroidOf(f);
            if (!center) continue;
            const coordKey = `${center[0].toFixed(5)},${center[1].toFixed(5)}`;

            let shouldKeep = false;
            if (boothNoNorm && !seenBoothNos.has(boothNoNorm)) {
                seenBoothNos.add(boothNoNorm);
                shouldKeep = true;
            } else if (!seenKeys.has(coordKey)) {
                // proximity-based collapse
                const tooClose = keptCentroids.some((c) => distanceMeters(c, center) <= PROXIMITY_M);
                if (!tooClose) {
                    seenKeys.add(coordKey);
                    shouldKeep = true;
                }
            }

            if (!shouldKeep) continue;
            keptCentroids.push(center);
            const hasWorkStatus = boothNumbersWithWorkStatus.has(boothNoNorm);
            
            // Only add markers for booths WITH work status
            if (hasWorkStatus) {
                features.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: center },
                    properties: { ...props, boothNo: boothNoRaw, hasWorkStatus: hasWorkStatus }
                });
            }
        }

        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, boothNumbersWithWorkStatus]);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Auto zoom to fit filtered polygons (only booths with work status data)
    const autoZoomToFilteredPolygons = () => {
        setTimeout(() => {
            try {
                const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                if (!map || !boothGeoJSON?.features?.length) return;
                
                // Filter features to only include booths with work status data
                const filteredFeatures = boothGeoJSON.features.filter(feature => {
                    const props = feature.properties || {};
                    const boothId = props._id || props.id || props.booth_id;
                    const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number;
                    
                    const hasData = (
                        (boothId && boothsWithWorkStatus.ids.has(String(boothId))) ||
                        (boothNo && boothsWithWorkStatus.numbers.has(String(boothNo).trim().toLowerCase()))
                    );
                    
                    return hasData;
                });

                if (filteredFeatures.length === 0) return;

                const coords = [];
                filteredFeatures.forEach(f => {
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
                    map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
                }
            } catch (err) {
                console.error('Auto zoom error:', err);
            }
        }, 300);
    };

    useEffect(() => {
        setSearchInput(globalFilter || '');
    }, [globalFilter]);

    // Auto-load ALL booth polygons on mount for default view
    useEffect(() => {
        if (mapboxToken) {
            try {
                loadBoothPolygonsByBlockNumber('ALL');
            } catch (e) {
                // non-blocking
            }
        }
    }, [mapboxToken]);

    // Refresh markers when year filter changes
    useEffect(() => {
        if (boothGeoJSON && yearFilter !== undefined) {
            fetchBoothsWithWorkStatus(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    // Auto zoom to filtered polygons when boothsWithWorkStatus updates
    useEffect(() => {
        if (boothGeoJSON && boothsWithWorkStatus.ids.size > 0) {
            autoZoomToFilteredPolygons();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [boothsWithWorkStatus]);

    // Filter states
    const [filters, setFilters] = useState({
        state_id: '',
        district_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        workType: '',
        status: ''
    });

    // Temporary filters for staging changes
    const [tempFilters, setTempFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: '',
        booth_id: '',
        workType: '',
        status: ''
    });

    // Helper to add Authorization header when token exists
    const getAuthHeaders = () => {
        try {
            const token = localStorage.serviceToken;
            return token ? { Authorization: `Bearer ${token}` } : {};
        } catch (err) {
            return {};
        }
    };

    const handleStateChange = (event) => {
        const stateId = event.target.value;
        setTempFilters({
            ...tempFilters,
            state_id: stateId,
            district_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleDivisionChange = (event) => {
        const divisionId = event.target.value;
        setTempFilters({
            ...tempFilters,
            division_id: divisionId,
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleParliamentChange = (event) => {
        const parliamentId = event.target.value;
        setTempFilters({
            ...tempFilters,
            parliament_id: parliamentId,
            assembly_id: '',
            block_id: '',
            booth_id: ''
        });
    };

    const handleAssemblyChange = (event) => {
        const assemblyId = event.target.value;
        setTempFilters({
            ...tempFilters,
            assembly_id: assemblyId,
            block_id: '',
            booth_id: ''
        });
    };

    const handleBlockChange = (event) => {
        const blockId = event.target.value;
        setTempFilters({
            ...tempFilters,
            block_id: blockId,
            booth_id: ''
        });
    };

    const handleDistrictChange = (event) => {
        const districtId = event.target.value;
        setTempFilters({
            ...tempFilters,
            district_id: districtId
        });
    };

    const handlePanchayatChange = (event) => {
        setTempFilters({ ...tempFilters, panchayat: event.target.value });
    };

    const handleVillageChange = (event) => {
        setTempFilters({ ...tempFilters, village: event.target.value });
    };

    const handleFalliyaChange = (event) => {
        setTempFilters({ ...tempFilters, falliya: event.target.value });
    };

    const handleAnnouncedByChange = (event) => {
        setTempFilters({ ...tempFilters, announced_by: event.target.value });
    };

    const handleBoothChange = (event) => {
        const boothId = event.target.value;
        setTempFilters({
            ...tempFilters,
            booth_id: boothId
        });
    };

    const handleWorkTypeChange = (event) => {
        const workType = event.target.value;
        setTempFilters({
            ...tempFilters,
            workType: workType
        });
    };

    const handleStatusChange = (event) => {
        const status = event.target.value;
        setTempFilters({
            ...tempFilters,
            status: status
        });
    };

    const handleApplyFilters = () => {
        setFilters(tempFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchWorkStatuses(0, 10, globalFilter, tempFilters);
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: '',
            booth_id: '',
            workType: '',
            status: ''
        };
        setFilters(emptyFilters);
        setTempFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
        fetchWorkStatuses(0, 10, globalFilter, emptyFilters);
    };

    const fetchAllWorkStatusesForFilters = async () => {
        const hierarchyFilters = {};
        if (userHierarchy?.state) hierarchyFilters.state = userHierarchy.state._id || userHierarchy.state;
        if (userHierarchy?.division) hierarchyFilters.division = userHierarchy.division._id || userHierarchy.division;
        if (userHierarchy?.parliament) hierarchyFilters.parliament = userHierarchy.parliament._id || userHierarchy.parliament;
        if (userHierarchy?.assembly) hierarchyFilters.assembly = userHierarchy.assembly._id || userHierarchy.assembly;
        if (userHierarchy?.block) hierarchyFilters.block = userHierarchy.block._id || userHierarchy.block;
        if (userHierarchy?.booth) hierarchyFilters.booth = userHierarchy.booth._id || userHierarchy.booth;

        const data = await fetchAllDataForFilters('/work-status', hierarchyFilters);
        setAllWorkStatuses(data);
    };

    const fetchReferenceData = async () => {
        try {
            // Fetch states first
            const statesRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers: getAuthHeaders() });
            const statesData = await statesRes.json();

            // Fetch divisions next to see their structure
            const divisionsRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers: getAuthHeaders() });
            const divisionsData = await divisionsRes.json();

            // Fetch the rest
            const [
                parliamentsRes,
                assembliesRes,
                blocksRes,
                boothsRes,
                districtsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/districts`, { headers: getAuthHeaders() })
            ]);

            const [

                parliamentsData,
                assembliesData,
                blocksData,
                boothsData
                ,
                districtsData
            ] = await Promise.all([

                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
                ,
                districtsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) {
                setDivisions(divisionsData.data);
            }
            if (parliamentsData.success) {
                setParliaments(parliamentsData.data);
            }
            if (assembliesData.success) {
                setAssemblies(assembliesData.data);
            }
            if (blocksData.success) {
                setBlocks(blocksData.data);
            }
            if (boothsData.success) {
                setBooths(boothsData.data);
            }
            if (districtsData.success) setDistricts(districtsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchWorkStatuses = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        setLoading(true);
        try {
            const queryParams = [];
            // If searching, fetch all results on first page
            if (globalFilter) {
                queryParams.push('page=1');
                queryParams.push('limit=10000');
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            } else {
                queryParams.push(`page=${pageIndex + 1}`);
                queryParams.push(`limit=${pageSize}`);
            }
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.district_id) queryParams.push(`district=${encodeURIComponent(currentFilters.district_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);
            if (currentFilters.block_id) queryParams.push(`block=${encodeURIComponent(currentFilters.block_id)}`);
            if (currentFilters.booth_id) queryParams.push(`booth=${encodeURIComponent(currentFilters.booth_id)}`);
            if (currentFilters.panchayat) queryParams.push(`panchayat=${encodeURIComponent(currentFilters.panchayat)}`);
            if (currentFilters.village) queryParams.push(`village=${encodeURIComponent(currentFilters.village)}`);
            if (currentFilters.falliya) queryParams.push(`falliya=${encodeURIComponent(currentFilters.falliya)}`);
            if (currentFilters.announced_by) queryParams.push(`announced_by=${encodeURIComponent(currentFilters.announced_by)}`);
            if (currentFilters.workType) queryParams.push(`workType=${encodeURIComponent(currentFilters.workType)}`);
            if (currentFilters.status) queryParams.push(`status=${encodeURIComponent(currentFilters.status)}`);
            if (yearFilter) queryParams.push(`year=${yearFilter}`);

            // Hierarchy-based filtering is handled automatically by the backend
            // via getUserPermissionsAndHierarchy middleware, so no need to add filters here

            const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/work-status${queryString}`, { headers: getAuthHeaders() });
            const json = await res.json();
            if (json.success) {
                setWorkStatuses(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch work statuses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch booths with work status to mark them on the map
    const fetchBoothsWithWorkStatus = async (selectedYear = yearFilter) => {
        try {
            const headers = getAuthHeaders();
            let url = `${import.meta.env.VITE_APP_API_URL}/work-status?all=true&limit=50000`;
            if (selectedYear) url += `&year=${selectedYear}`;
            const workStatusRes = await fetch(url, { headers });
            const workStatusJson = await workStatusRes.json();
            if (workStatusJson.success && Array.isArray(workStatusJson.data)) {
                const boothIds = new Set();
                const boothNumbers = new Set();
                
                workStatusJson.data.forEach(workStatus => {
                    if (workStatus.booth_id) {
                        const boothId = workStatus.booth_id._id || workStatus.booth_id;
                        boothIds.add(String(boothId));
                        
                        // If booth object contains booth_number, capture it too (normalized)
                        if (workStatus.booth_id.booth_number !== undefined && workStatus.booth_id.booth_number !== null) {
                            const normalized = normalizeBoothNo(workStatus.booth_id.booth_number);
                            if (normalized) {
                                boothNumbers.add(normalized);
                            }
                        }
                    }
                });
                
                setBoothsWithWorkStatus({ ids: boothIds, numbers: boothNumbers });
                console.log('✅ Booths with work status updated (Year: ' + (selectedYear || 'All') + '):', { ids: boothIds.size, numbers: boothNumbers.size });
            }
        } catch (err) {
            console.warn('Failed to fetch booths with work status:', err);
        }
    };

    // Apply a prefilled filter (from Drawer) for a specific booth and status
    const applyPrefilledFilter = (status) => {
        try {
            const boothId = drawerData?.details?.booth?._id;
            if (!boothId) return;
            const statusVal = (status === 'all') ? '' : status;
            const newFilters = {
                ...filters,
                booth_id: boothId,
                status: statusVal
            };
            // Update both temp filters and active filters for visibility in UI
            setTempFilters(newFilters);
            setFilters(newFilters);
            // Reset pagination and fetch
            const newPageSize = pagination.pageSize || 10;
            setPagination({ pageIndex: 0, pageSize: newPageSize });
            fetchWorkStatuses(0, newPageSize, globalFilter, newFilters);
            // Keep Drawer open so user can see filtered table
        } catch (err) {
            console.error('Failed to apply prefilled filter:', err);
        }
    };

    const loadBoothPolygonsByBlockNumber = async (blockNumberVal) => {
        if (!blockNumberVal) {
            setMapError('Please enter Block Number');
            return;
        }
        setMapError('');
        try {
            const headers = getAuthHeaders();

            // Fetch booths with work status in parallel
            fetchBoothsWithWorkStatus(yearFilter);

            // Support fetching ALL polygons (could be large)
            if (blockNumberVal === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || '';
                const url = `${apiUrl}/booths/polygons?limit=50000&page=1`;
                console.log('[work-status] Loading ALL booth polygons from', url);
                const resp = await fetch(url, { headers });
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const j = await resp.json();
                let features = j.features || j.data || [];
                console.log('[work-status] ALL polygons response features length:', (features && features.length) || 0);
                if (features.length === 1 && features[0] && features[0].features && Array.isArray(features[0].features)) {
                    features = features[0].features;
                }
                if (!features || !Array.isArray(features) || features.length === 0) {
                    setMapError('No booth polygons found');
                    setBoothGeoJSON(null);
                    return;
                }
                const fc = { type: 'FeatureCollection', features };
                console.log('[work-status] setBoothGeoJSON with features count:', fc.features.length);
                // Log a sample of properties for debugging label rendering
                try { console.log('[work-status] sample feature properties:', fc.features[0] && fc.features[0].properties); } catch { }
                setBoothGeoJSON(fc);
                // fit bounds
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

            // Try multiple endpoints (block id, block-number, query param)
            const candidates = [
                `${import.meta.env.VITE_APP_API_URL}/booths/polygons/block/${encodeURIComponent(blockNumberVal)}`,
                `${import.meta.env.VITE_APP_API_URL}/booths/polygons?block=${encodeURIComponent(blockNumberVal)}`
            ];
            console.log('[work-status] Trying candidate booth polygon endpoints for block:', blockNumberVal, candidates);
            let json = null;
            for (const url of candidates) {
                try {
                    console.log('[work-status] Fetching candidate URL:', url);
                    const resp = await fetch(url, { headers });
                    console.log('[work-status] Response status for', url, resp.status);
                    if (!resp.ok) {
                        console.warn('[work-status] Non-ok response from', url, resp.status);
                        continue;
                    }
                    const j = await resp.json();
                    const features = j.features || (Array.isArray(j) ? j : (j.data || null));
                    console.log('[work-status] Candidate response features (or data) length for', url, (features && features.length) || 0);
                    if (features && Array.isArray(features) && features.length > 0) {
                        console.log('[work-status] Found features for block', blockNumberVal, 'from', url);
                        json = { type: 'FeatureCollection', features };
                        break;
                    }
                } catch (innerErr) {
                    console.warn('[work-status] Error fetching booth polygons from candidate url:', innerErr);
                }
            }

            if (!json) {
                setMapError(`No booth polygons found for block '${blockNumberVal}'`);
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

    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            const headers = getAuthHeaders();
            // Get all booths to find booth by number
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;
            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = normalizeBoothNo(boothNo);
                booth = json.data.find(b => normalizeBoothNo(b.booth_number) === boothNoStr)
                    || json.data.find(b => normalizeBoothNo(b.booth_number).includes(boothNoStr) || boothNoStr.includes(normalizeBoothNo(b.booth_number)));
            }

            let visits = [];
            let volunteers = [];
            let surveys = [];
            let infra = [];
            let partyPresence = [];
            let demographics = null;
            let votes = [];
            let electionStats = [];
            let workStatusesForBooth = [];
            let samitis = [];
            let gender = null;

            if (booth && booth._id) {
                let wsUrl = `${import.meta.env.VITE_APP_API_URL}/work-status/booth/${encodeURIComponent(booth._id)}`;
                if (yearFilter) wsUrl += `?year=${yearFilter}`;
                const fetchPromises = [
                    fetch(`${import.meta.env.VITE_APP_API_URL}/visits?booth=${encodeURIComponent(booth._id)}&all=true`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-volunteers/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-surveys/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-infrastructure?booth=${encodeURIComponent(booth._id)}&limit=100`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/party-presence/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-demographics/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/genders/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-votes/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-stats/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(wsUrl, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/samitis?booth_id=${encodeURIComponent(booth._id)}&limit=100`, { headers })
                ];

                const [vRes, volRes, sRes, iRes, ppRes, dRes, genderRes, bvRes, esRes, wsRes, smRes] = await Promise.allSettled(fetchPromises);

                const tryJson = async (r) => { try { const j = await r.json(); return j; } catch { return null; } };

                if (vRes.status === 'fulfilled' && vRes.value.ok) { const j = await tryJson(vRes.value); if (j?.success && Array.isArray(j.data)) visits = j.data; }
                if (volRes.status === 'fulfilled' && volRes.value.ok) { const j = await tryJson(volRes.value); if (j?.success && Array.isArray(j.data)) volunteers = j.data; }
                if (sRes.status === 'fulfilled' && sRes.value.ok) { const j = await tryJson(sRes.value); if (j?.success && Array.isArray(j.data)) surveys = j.data; }
                if (iRes.status === 'fulfilled' && iRes.value.ok) { const j = await tryJson(iRes.value); if (j?.success && Array.isArray(j.data)) infra = j.data; }
                if (ppRes.status === 'fulfilled' && ppRes.value.ok) { const j = await tryJson(ppRes.value); if (j?.success && Array.isArray(j.data)) partyPresence = j.data; }
                if (dRes.status === 'fulfilled' && dRes.value.ok) { const j = await tryJson(dRes.value); if (j?.success) demographics = j.data; }
                if (bvRes.status === 'fulfilled' && bvRes.value.ok) { const j = await tryJson(bvRes.value); if (j?.success && Array.isArray(j.data)) votes = j.data; }
                if (esRes.status === 'fulfilled' && esRes.value.ok) { const j = await tryJson(esRes.value); if (j?.success && Array.isArray(j.data)) electionStats = j.data; }
                if (wsRes.status === 'fulfilled' && wsRes.value.ok) { const j = await tryJson(wsRes.value); if (j?.success && Array.isArray(j.data)) workStatusesForBooth = j.data; }
                if (smRes.status === 'fulfilled' && smRes.value.ok) { const j = await tryJson(smRes.value); if (j?.success && Array.isArray(j.data)) samitis = j.data; }

                if (genderRes.status === 'fulfilled' && genderRes.value.ok) {
                    const gJson = await tryJson(genderRes.value);
                    if (gJson?.success) {
                        if (Array.isArray(gJson.data) && gJson.data.length > 0) {
                            const g = gJson.data[0];
                            gender = { male: g.male || 0, female: g.female || 0, others: g.others || 0, total: (g.male || 0) + (g.female || 0) + (g.others || 0) };
                        } else if (gJson.data && typeof gJson.data === 'object') {
                            const g = gJson.data;
                            gender = { male: g.male || 0, female: g.female || 0, others: g.others || 0, total: (g.male || 0) + (g.female || 0) + (g.others || 0) };
                        }
                    }
                }

                if (!gender || (gender.male === 0 && gender.female === 0 && gender.others === 0 && gender.total === 0)) {
                    const male = Number(booth?.Male_Count ?? booth?.male ?? 0) || 0;
                    const female = Number(booth?.Female_Count ?? booth?.female ?? 0) || 0;
                    const others = Number(booth?.others_Count ?? booth?.others ?? 0) || 0;
                    const total = Number(booth?.Total ?? booth?.total ?? (male + female + others)) || (male + female + others);
                    gender = { male, female, others, total };
                }

                // compute work status summary counts
                const workSummary = {
                    total: workStatusesForBooth.length || 0,
                    completed: 0,
                    in_progress: 0,
                    in_complete: 0,
                    announced: 0,
                    other: 0
                };
                workStatusesForBooth.forEach(ws => {
                    const s = (ws.status || '').toLowerCase();
                    if (s === 'completed') workSummary.completed += 1;
                    else if (s === 'in progress') workSummary.in_progress += 1;
                    else if (s === 'in complete') workSummary.in_complete += 1;
                    else if (s === 'announced') workSummary.announced += 1;
                    else workSummary.other += 1;
                });

                setDrawerData({
                    loading: false,
                    boothNo,
                    details: {
                        booth,
                        visits,
                        volunteers,
                        surveys,
                        infra,
                        partyPresence,
                        demographics,
                        votes,
                        electionStats,
                        workStatuses: workStatusesForBooth,
                        samitis,
                        gender,
                        workSummary
                    }
                });
                setDrawerOpen(true);

                // Sync table filters to this booth and reset pagination without full page refresh
                try {
                    const newFilters = {
                        ...filters,
                        state_id: booth?.state_id?._id || booth?.state_id || '',
                        division_id: booth?.division_id?._id || booth?.division_id || '',
                        parliament_id: booth?.parliament_id?._id || booth?.parliament_id || '',
                        assembly_id: booth?.assembly_id?._id || booth?.assembly_id || '',
                        block_id: booth?.block_id?._id || booth?.block_id || '',
                        booth_id: booth?._id || ''
                    };
                    setTempFilters(newFilters);
                    setFilters(newFilters);
                    const newPageSize = pagination.pageSize || 10;
                    setPagination({ pageIndex: 0, pageSize: newPageSize });
                    fetchWorkStatuses(0, newPageSize, globalFilter, newFilters);
                } catch { }
            } else {
                setDrawerData({ loading: false, boothNo, details: null, error: 'Booth not found' });
                setDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to fetch booth details by polygon:', err);
            setDrawerData({ loading: false, boothNo, details: null, error: err.message });
            setDrawerOpen(true);
        }
    };

    useEffect(() => {
        fetchWorkStatuses(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllWorkStatusesForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, yearFilter]);

    // Extract filter options from actual work status data
    const filterOptions = useFilterOptionsFromData(allWorkStatuses, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
        booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
        districts: { field: 'district_id', nameField: 'name' }
    });

    const handleDeleteOpen = (id) => {
        setWorkStatusDeleteId(id);
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

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row, table }) => {
                const { pageIndex, pageSize } = table.getState().pagination;
                const serialNumber = pageIndex * pageSize + row.index + 1;
                return <Typography>{serialNumber}</Typography>;
            }
        },
        {
            header: 'Work Name',
            accessorKey: 'work_name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Department',
            accessorKey: 'department',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => {
                const status = (getValue() || '').toLowerCase();
                let color = 'default';
                if (status === 'completed') color = 'success';
                else if (status === 'in progress') color = 'info';
                else if (status === 'in complete') color = 'warning';
                else if (status === 'announced') color = 'primary';

                return (
                    <Chip
                        label={status}
                        color={color}
                        size="small"
                    />
                );
            }
        },
        {
            header: 'Work Type',
            accessorKey: 'work_type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="primary"
                />
            )
        },
        {
            header: 'Fund Source',
            accessorKey: 'approved_fund_from',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Falia',
            accessorKey: 'falia',
            cell: ({ getValue }) => (
                <Typography>{getValue() || 'N/A'}</Typography>
            )
        },
        // {
        //     header: 'Description',
        //     accessorKey: 'description',
        //     cell: ({ getValue }) => (
        //         <Typography sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        //             {getValue() || 'N/A'}
        //         </Typography>
        //     )
        // },
        {
            header: 'Total Budget',
            accessorKey: 'total_budget',
            cell: ({ getValue }) => (
                <Typography>{formatCurrency(getValue())}</Typography>
            )
        },
        {
            header: 'Spent Amount',
            accessorKey: 'spent_amount',
            cell: ({ getValue }) => (
                <Typography>{formatCurrency(getValue())}</Typography>
            )
        },
        {
            header: 'Start Date',
            accessorKey: 'start_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Expected End',
            accessorKey: 'expected_end_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Actual End',
            accessorKey: 'actual_end_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'} {getValue()?.booth_number ? `(#${getValue()?.booth_number})` : ''}
                </Typography>
            )
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
            )
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
            )
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
            )
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
            )
        },
        {
            header: 'District',
            accessorKey: 'district_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} size="small" variant="outlined" color="secondary" />
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="info"
                />
            )
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="secondary"
                />
            )
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="warning"
                />
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    size="small"
                    variant="outlined"
                    color="primary"
                />
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 250,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                    color: 'text.secondary'
                }}>
                    {/* Strip HTML tags for table preview */}
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
            )
        },

        {
            header: 'Panchayat',
            accessorKey: 'panchayat',
            cell: ({ getValue }) => <Typography>{getValue() || 'N/A'}</Typography>
        },
        {
            header: 'Village',
            accessorKey: 'village',
            cell: ({ getValue }) => <Typography>{getValue() || 'N/A'}</Typography>
        },
        {
            header: 'Announced Date',
            accessorKey: 'announced_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Announced By',
            accessorKey: 'announced_by',
            cell: ({ getValue }) => <Typography>{getValue() || 'N/A'}</Typography>
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => {
                const val = getValue();
                const name = val?.username || val?.name || (typeof val === 'string' ? val : null);
                return <Typography>{name || 'N/A'}</Typography>;
            }
        },
        {
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => {
                const val = getValue();
                const name = val?.username || val?.name || (typeof val === 'string' ? val : null);
                return <Typography>{name || 'N/A'}</Typography>;
            }
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <IconButton
                            color="info"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/Work-Status/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton
                            color="primary"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWorkStatus(row.original);
                                setOpenModal(true);
                            }}
                        >
                            <Edit />
                        </IconButton>
                        <IconButton
                            color="error"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOpen(row.original._id);
                            }}
                        >
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            }
        }
    ], [theme]);


    const table = useReactTable({
        data: workStatuses,
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
        // removed expandable rows - use detail page for full view
    });

    const fetchAllWorkStatusesForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/work-status?all=true`, { headers: getAuthHeaders() });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all work statuses for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllWorkStatusesForCsv();
        setCsvData(allData.map(item => ({
            'Work Name': item.work_name,
            'Department': item.department,
            'Status': item.status,
            'Approved Fund From': item.approved_fund_from,
            'Total Budget': item.total_budget,
            'Spent Amount': item.spent_amount,
            'Falia': item.falia,
            'Description': item.description,
            'Start Date': item.start_date,
            'Expected End Date': item.expected_end_date,
            'Actual End Date': item.actual_end_date || '',
            'State': item.state_id?.name || '',
            'District': item.district_id?.name || '',
            'Division': item.division_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Block': item.block_id?.name || '',
            'Booth': item.booth_id?.name ? `${item.booth_id.name} (Booth #${item.booth_id.booth_number || ''})` : '',
            'Panchayat': item.panchayat || '',
            'Village': item.village || '',
            'Announced Date': item.announced_date || '',
            'Announced By': item.announced_by || '',
            'Created By': item.created_by?.username || '',
            'Updated By': item.updated_by?.username || '',
            'Created At': item.created_at,
            'Updated At': item.updated_at || ''
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    const handleDownloadExcelTemplate = async () => {
        // Prefer numeric/geocode fields (state_no, division_code, parliament_no, assembly_no, block_no, booth_number)
        const headers = [
            'work_name', 'department', 'status', 'work_type', 'approved_fund_from', 'total_budget', 'spent_amount', 'description',
            'start_date', 'expected_end_date', 'actual_end_date', 'announced_date', 'announced_by', 'year',
            'state_no', 'division_code', 'parliament_no', 'assembly_no', 'block_no', 'block_number', 'booth_number',
            'panchayat_name', 'village_name', 'falliya_name', 'falia', 'district'
        ];
        const exampleRow = [
            'Road Construction', 'PWD', 'in progress', 'infrastructure', 'vidhayak nidhi', '5000000', '2000000', 'Sample work description',
            '2024-01-01', '2024-12-31', '', '2024-01-15', 'Engineer', '2024',
            '27', 'DIV01', '5', '150', '10', '10', '123',
            'Sample Panchayat', 'Sample Village', 'Sample Faliya', 'Sample Falia', 'Sample District'
        ];
        
        try {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            XLSX.writeFile(wb, 'work_status_import_template.xlsx');
            return;
        } catch (e) {
            console.warn('xlsx dynamic import failed, falling back to CSV template:', e && e.message);
        }

        try {
            const csvContent = headers.join(',') + '\n' + exampleRow.join(',') + '\n';
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'work_status_import_template.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to generate fallback CSV template:', err);
        }
    };

    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);
        try {
            const XLSX = await import('xlsx');
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data, { type: 'array' });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            const json = XLSX.utils.sheet_to_json(ws, { defval: '' });

            const rows = json.map((r) => {
                const obj = {};
                for (const k of Object.keys(r)) obj[k.trim().toLowerCase()] = r[k];
                // Map a wide set of possible column names to the shape expected by the backend helper
                return {
                    work_name: obj.work_name ?? '',
                    department: obj.department ?? '',
                    status: obj.status ?? '',
                    work_type: obj.work_type ?? '',
                    approved_fund_from: obj.approved_fund_from ?? '',
                    total_budget: obj.total_budget ?? '',
                    spent_amount: obj.spent_amount ?? '',
                    description: obj.description ?? '',
                    start_date: obj.start_date ?? '',
                    expected_end_date: obj.expected_end_date ?? '',
                    actual_end_date: obj.actual_end_date ?? '',
                    announced_date: obj.announced_date ?? '',
                    announced_by: obj.announced_by ?? '',
                    year: obj.year ?? '',

                    // Geographic numeric-first fields (helpers accept many variants)
                    state_no: obj.state_no ?? obj.state ?? '',
                    division_code: obj.division_code ?? obj.division ?? '',
                    parliament_no: obj.parliament_no ?? obj.parliament ?? '',
                    assembly_no: obj.assembly_no ?? obj.ac_no ?? obj.ac ?? obj.assembly ?? '',
                    block_no: obj.block_no ?? obj.block_number ?? obj.block ?? '',
                    block: obj.block ?? '',
                    booth_number: obj.booth_number ?? obj.booth ?? '',

                    // Local names/backfills
                    panchayat_name: obj.panchayat_name ?? obj.panchayat ?? '',
                    village_name: obj.village_name ?? obj.village ?? '',
                    falliya_name: obj.falliya_name ?? obj.falliya ?? '',
                    falia: obj.falia ?? '' ,
                    district: obj.district ?? ''
                };
            });

            const filtered = rows.filter(r => String(r.work_name).trim());

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/work-status/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ rows: filtered })
            });
            const result = await res.json();
            setImportResult(result);
            if (result?.success) {
                fetchWorkStatuses();
            }
        } catch (err) {
            setImportResult({ success: false, message: err?.message || String(err) });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    // Page-level loading removed; show inline loader row in table instead

    return (
        <>
            <MainCard content={false}>
                {/* Map section above the table */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Booth Map</Typography>
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
                                    <MenuItem key={b._id} value={b.name || b.block_number || b._id}>{b.block_number ? `#${b.block_number} — ${b.name}` : b.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel id="workstatus-year-select">Year</InputLabel>
                            <Select
                                labelId="workstatus-year-select"
                                value={yearFilter}
                                label="Year"
                                onChange={(e) => setYearFilter(e.target.value)}
                            >
                                <MenuItem value="">All Years</MenuItem>
                                {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                                    <MenuItem key={year} value={year}>{year}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Button variant="contained" size="small" onClick={() => loadBoothPolygonsByBlockNumber(blockNumberInput)}>
                            Load Polygons
                        </Button>
                        {mapError && <Alert severity="warning" sx={{ ml: 2 }}>{mapError}</Alert>}
                    </Stack>
                    <MapContainerStyled>
                        <MapGL
                            ref={mapRef}
                            mapboxAccessToken={mapboxToken}
                            initialViewState={{ longitude: 75.8577, latitude: 22.7196, zoom: 8 }}
                            mapStyle="mapbox://styles/mapbox/streets-v12"
                            interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
                            onClick={(e) => {
                                if (!boothGeoJSON) return;
                                try {
                                    const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                    let features = e.features || [];
                                    // If features not provided by event, query at point
                                    if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                        const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY } || { x: e.x, y: e.y };
                                        if (point) {
                                            features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                        }
                                    }

                                    const boothFeature = features.find(f => f.layer && (f.layer.id === 'booth-fill' || f.layer.id === 'booth-source')) || features[0];
                                    if (boothFeature) {
                                        const props = boothFeature.properties || {};
                                        console.log('[work-status] Map click - boothFeature found', { boothFeatureId: boothFeature.id, layer: boothFeature.layer && boothFeature.layer.id, props });
                                        // try multiple possible property names
                                        const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || (props.properties && (props.properties.BoothNo || props.properties.booth_number)) || '';
                                        setDrawerData({ loading: true, boothNo, details: null });
                                        setDrawerOpen(true);
                                        fetchBoothDetailsByPolygon(boothNo);
                                    }
                                } catch (err) {
                                    console.warn('Map click handler error:', err);
                                }
                            }}
                        >
                            <MapControl />
                            {boothGeoJSON && (
                                <Source 
                                    id="booth-polygons" 
                                    type="geojson" 
                                    data={{
                                        type: 'FeatureCollection',
                                        features: boothGeoJSON.features.filter(feature => {
                                            const props = feature.properties || {};
                                            const boothId = props._id || props.id || props.booth_id;
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number;
                                            
                                            // Check if this booth has work status data (by ID or booth number)
                                            const hasData = (
                                                (boothId && boothsWithWorkStatus.ids.has(String(boothId))) ||
                                                (boothNo && boothsWithWorkStatus.numbers.has(String(boothNo).trim().toLowerCase()))
                                            );
                                            
                                            return hasData;
                                        })
                                    }}
                                >
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
                            {/* Work Status Markers Layer - Show green dots for booths with data only */}
                            {boothMarkersGeoJSON && (
                                <Source id="booth-markers" type="geojson" data={boothMarkersGeoJSON}>
                                    <Layer
                                        id="booth-work-status-markers"
                                        type="circle"
                                        paint={{
                                            'circle-radius': 6,
                                            'circle-color': '#22c55e',
                                            'circle-stroke-width': 2,
                                            'circle-stroke-color': '#ffffff',
                                            'circle-opacity': 0.9
                                        }}
                                    />
                                </Source>
                            )}
                        </MapGL>
                    </MapContainerStyled>

                    {/* Map Legend */}
                    <Paper elevation={2} sx={{ mt: 1, p: 1.5, display: 'inline-block' }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Map Legend {yearFilter ? `(Year: ${yearFilter})` : '(All Years)'}
                        </Typography>
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
                                <Typography variant="caption">Has Work Status</Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                </Box>
                {/* Access Scope Information */}
                {(() => {
                    const getUserAccessScope = () => {
                        if (!userHierarchy) {
                            return { level: 'All', description: 'You have access to all work status data' };
                        }
                        const highestLevel = getUserHighestLevel();
                        if (!highestLevel) {
                            return { level: 'All', description: 'You have access to all work status data' };
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
                        const entity = userHierarchy[highestLevel];
                        const entityName = entity?.name || (typeof entity === 'object' && entity !== null ? (entity.displayName || entity.title || String(entity._id || entity.id || '')) : String(entity || 'Unknown'));

                        return {
                            level: levelName,
                            entity: entityName,
                            description: `You have access to work status data for ${entityName} ${levelName} and all areas within it`
                        };
                    };
                    const accessScope = getUserAccessScope();
                    return (
                        <>
                            {/* Import Result */}
                            {importResult && (
                                <Alert severity={importResult.success ? 'success' : 'error'} sx={{ m: 2 }}>
                                    {importResult.success ? (
                                        <span>
                                            Imported: {importResult.created || 0} / {importResult.total || 0}
                                            {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                                                <> | Errors: {importResult.errors.length}</>
                                            )}
                                        </span>
                                    ) : (
                                        <span>Import failed: {importResult.message || 'Unknown error'}</span>
                                    )}
                                </Alert>
                            )}
                            <Alert severity="info" sx={{ m: 2 }}>
                                <Typography variant="body2">
                                    <strong>Data Access:</strong> {accessScope.description}
                                </Typography>
                            </Alert>
                        </>
                    );
                })()}
                <Stack spacing={2} sx={{ padding: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <TextField
                            size="small"
                            variant="outlined"
                            placeholder={`Search ${workStatuses.length} work status list...`}
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
                                filename="work_status_all.csv"
                                style={{ display: 'none' }}
                                ref={csvLinkRef}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleDownloadExcelTemplate}
                                size="small"
                            >
                                Download Excel Template
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    if (importInputRef.current) importInputRef.current.click();
                                }}
                                size="small"
                                disabled={importing}
                            >
                                {importing ? 'Importing...' : 'Import Excel'}
                            </Button>
                            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => {
                                    setSelectedWorkStatus(null);
                                    setOpenModal(true);
                                }}
                            >
                                Add Work Status
                            </Button>
                        </Stack>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>State</InputLabel>
                                <Select
                                    value={tempFilters.state_id}
                                    onChange={handleStateChange}
                                    label="State"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.states?.map((state) => (
                                        <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Division</InputLabel>
                                <Select
                                    value={tempFilters.division_id}
                                    onChange={handleDivisionChange}
                                    label="Division"
                                    disabled={!tempFilters.state_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.divisions?.filter(division => {
                                        const stateId = division.state_id?._id || division.state_id;
                                        return stateId === tempFilters.state_id;
                                    }).map((division) => (
                                        <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>District</InputLabel>
                                <Select
                                    value={tempFilters.district_id}
                                    onChange={handleDistrictChange}
                                    label="District"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.districts?.map((d) => (
                                        <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Panchayat"
                                size="small"
                                value={tempFilters.panchayat || ''}
                                onChange={handlePanchayatChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Village"
                                size="small"
                                value={tempFilters.village || ''}
                                onChange={handleVillageChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Falliya"
                                size="small"
                                value={tempFilters.falliya || ''}
                                onChange={handleFalliyaChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                label="Announced By"
                                size="small"
                                value={tempFilters.announced_by || ''}
                                onChange={handleAnnouncedByChange}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Parliament</InputLabel>
                                <Select
                                    value={tempFilters.parliament_id}
                                    onChange={handleParliamentChange}
                                    label="Parliament"
                                    disabled={!tempFilters.division_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.parliaments?.filter(parliament => {
                                        const divisionId = parliament.division_id?._id || parliament.division_id;
                                        return divisionId === tempFilters.division_id;
                                    }).map((parliament) => (
                                        <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Assembly</InputLabel>
                                <Select
                                    value={tempFilters.assembly_id}
                                    onChange={handleAssemblyChange}
                                    label="Assembly"
                                    disabled={!tempFilters.parliament_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.assemblies?.filter(assembly => {
                                        const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                                        return parliamentId === tempFilters.parliament_id;
                                    }).map((assembly) => (
                                        <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Block</InputLabel>
                                <Select
                                    value={tempFilters.block_id}
                                    onChange={handleBlockChange}
                                    label="Block"
                                    disabled={!tempFilters.assembly_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.blocks?.filter(block => {
                                        const assemblyId = block.assembly_id?._id || block.assembly_id;
                                        return assemblyId === tempFilters.assembly_id;
                                    }).map((block) => (
                                        <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Booth</InputLabel>
                                <Select
                                    value={tempFilters.booth_id}
                                    onChange={handleBoothChange}
                                    label="Booth"
                                    disabled={!tempFilters.block_id}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {filterOptions.booths?.filter(booth => {
                                        const blockId = booth.block_id?._id || booth.block_id;
                                        return blockId === tempFilters.block_id;
                                    }).map((booth) => (
                                        <MenuItem key={booth._id} value={booth._id}>{booth.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Work Type</InputLabel>
                                <Select
                                    value={tempFilters.workType}
                                    onChange={handleWorkTypeChange}
                                    label="Work Type"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="infrastructure">Infrastructure</MenuItem>
                                    <MenuItem value="social">Social</MenuItem>
                                    <MenuItem value="education">Education</MenuItem>
                                    <MenuItem value="health">Health</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={tempFilters.status}
                                    onChange={handleStatusChange}
                                    label="Status"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="in progress">in progress</MenuItem>
                                    <MenuItem value="completed">completed</MenuItem>
                                    <MenuItem value="in complete">in complete</MenuItem>
                                    <MenuItem value="announced">announced</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="contained"
                                    onClick={handleApplyFilters}
                                    sx={{ width: '50%' }}
                                >
                                    Apply
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleClearFilters}
                                    sx={{ width: '50%' }}
                                >
                                    Clear
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
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
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={table.getAllLeafColumns().length}>
                                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ py: 2 }}>
                                                <Typography variant="body2">Loading...</Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                        <TablePagination
                            setPageSize={(size) =>
                                setPagination((prev) => ({ ...prev, pageSize: size }))
                            }
                            setPageIndex={(index) =>
                                setPagination((prev) => ({ ...prev, pageIndex: index }))
                            }
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
                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view more information</Typography>
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
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Basic</Typography>
                                    <Typography variant="body2"><strong>Name:</strong> {drawerData.details.booth?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Booth No:</strong> {drawerData.details.booth?.booth_number || drawerData.details.boothNo || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Block:</strong> {drawerData.details.booth?.block_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Assembly:</strong> {drawerData.details.booth?.assembly_id?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.booth?.parliament_id?.name || 'N/A'}</Typography>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Gender</Typography>
                                    {drawerData.details.gender ? (
                                        <Box>
                                            <Typography variant="body2">Male: {drawerData.details.gender.male}</Typography>
                                            <Typography variant="body2">Female: {drawerData.details.gender.female}</Typography>
                                            <Typography variant="body2">Others: {drawerData.details.gender.others}</Typography>
                                            <Typography variant="body2">Total: {drawerData.details.gender.total}</Typography>
                                        </Box>
                                    ) : (
                                        <Typography variant="body2">No gender data.</Typography>
                                    )}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Work Status ({drawerData.details.workSummary?.total ?? drawerData.details.workStatuses?.length ?? 0})</Typography>
                                    <Stack direction="column" spacing={1} sx={{ my: 1 }}>
                                        <Chip label={`All (${(drawerData.details.workSummary?.total ?? 0)})`} size="small" clickable onClick={() => applyPrefilledFilter('all')} />
                                        <Chip label={`Completed (${(drawerData.details.workSummary?.completed ?? 0)})`} color="success" size="small" clickable onClick={() => applyPrefilledFilter('completed')} />
                                        <Chip label={`In Progress (${(drawerData.details.workSummary?.in_progress ?? 0)})`} color="info" size="small" clickable onClick={() => applyPrefilledFilter('in progress')} />
                                        <Chip label={`In Complete (${(drawerData.details.workSummary?.in_complete ?? 0)})`} color="warning" size="small" clickable onClick={() => applyPrefilledFilter('in complete')} />
                                        <Chip label={`Announced (${(drawerData.details.workSummary?.announced ?? 0)})`} color="primary" size="small" clickable onClick={() => applyPrefilledFilter('announced')} />
                                        <Chip label={`Other (${(drawerData.details.workSummary?.other ?? 0)})`} size="small" clickable onClick={() => applyPrefilledFilter('')} />
                                    </Stack>
                                    {drawerData.details.workStatuses?.length ? drawerData.details.workStatuses.slice(0, 5).map(ws => (
                                        <Box key={ws._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {ws.work_name || 'Work'} — {ws.status || ''}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Budget: {ws.total_budget ?? 'N/A'} | Spent: {ws.spent_amount ?? 0} | Start: {ws.start_date ? new Date(ws.start_date).toLocaleDateString('en-IN') : 'N/A'}
                                            </Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No work status records.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Samiti ({drawerData.details.samitis?.length || 0})</Typography>
                                    {drawerData.details.samitis?.length ? drawerData.details.samitis.slice(0, 5).map(sm => (
                                        <Box key={sm._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {sm.samiti_name || 'Samiti'}</Typography>
                                            <Typography variant="caption" color="text.secondary">Count: {sm.count ?? 0}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No samiti records.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Visits ({drawerData.details.visits?.length || 0})</Typography>
                                        {drawerData.details.visits?.length ? drawerData.details.visits.slice(0, 5).map(v => (
                                            <Box key={v._id} sx={{ mb: 0.5 }}>
                                                <Typography variant="body2">• {v.date ? new Date(v.date).toLocaleDateString('en-IN') : ''} - {v.candidate_id?.name || ''}</Typography>
                                                <Typography variant="caption" color="text.secondary">{v.locationName || ''}</Typography>
                                            </Box>
                                        )) : (
                                            <Typography variant="body2">No visits found.</Typography>
                                        )}
                                    </Stack>
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Volunteers ({drawerData.details.volunteers?.length || 0})</Typography>
                                    {drawerData.details.volunteers?.length ? drawerData.details.volunteers.slice(0, 5).map(p => (
                                        <Typography key={p._id} variant="body2">• {p.name || p.username || p.phone || 'Unknown'} {p.party?.name ? `(${p.party.name})` : ''}</Typography>
                                    )) : <Typography variant="body2">No volunteers found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Surveys ({drawerData.details.surveys?.length || 0})</Typography>
                                    {drawerData.details.surveys?.length ? drawerData.details.surveys.slice(0, 5).map(s => (
                                        <Box key={s._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {s.remark ? s.remark.slice(0, 80) : (s.respondent_name || 'Survey')}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.survey_date ? new Date(s.survey_date).toLocaleDateString('en-IN') : ''}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No surveys found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Infrastructure ({drawerData.details.infra?.length || 0})</Typography>
                                    {drawerData.details.infra?.length ? drawerData.details.infra.slice(0, 5).map(i => (
                                        <Typography key={i._id} variant="body2">• {i.premises_type || i.categorization || i.note || 'Infrastructure'}</Typography>
                                    )) : <Typography variant="body2">No infrastructure records.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Party Presence ({drawerData.details.partyPresence?.length || 0})</Typography>
                                    {drawerData.details.partyPresence?.length ? drawerData.details.partyPresence.slice(0, 5).map(pp => (
                                        <Typography key={pp._id} variant="body2">• {pp.party_id?.name || pp.party?.name || 'Party'} - {pp.count || ''}</Typography>
                                    )) : <Typography variant="body2">No party presence data.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Demographics</Typography>
                                    {drawerData.details.demographics ? (
                                        <Box>
                                            <Typography variant="body2">Male: {drawerData.details.demographics.male || 'N/A'}</Typography>
                                            <Typography variant="body2">Female: {drawerData.details.demographics.female || 'N/A'}</Typography>
                                            <Typography variant="body2">Total: {drawerData.details.demographics.total || 'N/A'}</Typography>
                                        </Box>
                                    ) : <Typography variant="body2">No demographics data.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Votes ({drawerData.details.votes?.length || 0})</Typography>
                                    {drawerData.details.votes?.length ? drawerData.details.votes.slice(0, 5).map(v => {
                                        const candidateVal = v?.candidate_name || v?.candidate || v?.party_name || v?.party || 'Candidate';
                                        const candidateLabel = (typeof candidateVal === 'object') ? (candidateVal.name || candidateVal._id || JSON.stringify(candidateVal)) : candidateVal;
                                        const voteCount = v?.votes ?? v?.vote_count ?? 'N/A';
                                        const electionYearVal = v?.election_year;
                                        const electionYearLabel = electionYearVal ? (typeof electionYearVal === 'object' ? (electionYearVal.year || electionYearVal._id || electionYearVal.name) : electionYearVal) : '';
                                        return (
                                            <Box key={v._id} sx={{ mb: 0.5 }}>
                                                <Typography variant="body2">• {candidateLabel}: {voteCount} votes</Typography>
                                                <Typography variant="caption" color="text.secondary">{electionYearLabel}</Typography>
                                            </Box>
                                        );
                                    }) : <Typography variant="body2">No vote records found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Election Stats ({drawerData.details.electionStats?.length || 0})</Typography>
                                    {drawerData.details.electionStats?.length ? drawerData.details.electionStats.slice(0, 5).map(es => {
                                        const yearVal = es?.election_year;
                                        const yearLabel = yearVal ? (typeof yearVal === 'object' ? (yearVal.year || yearVal.name || yearVal._id) : yearVal) : 'Election';
                                        const turnoutVal = es?.turnout_percentage ?? es?.total_voters ?? 'N/A';
                                        return (
                                            <Box key={es._id} sx={{ mb: 0.5 }}>
                                                <Typography variant="body2">• {yearLabel}: {turnoutVal}</Typography>
                                                <Typography variant="caption" color="text.secondary">Turnout: {es?.turnout_percentage ? `${es.turnout_percentage}%` : 'N/A'}</Typography>
                                            </Box>
                                        );
                                    }) : <Typography variant="body2">No election stats found.</Typography>}
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={importInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            <WorkStatusModal
                open={openModal}
                modalToggler={setOpenModal}
                workStatus={selectedWorkStatus}
                booths={booths}
                blocks={blocks}
                assemblies={assemblies}
                parliaments={parliaments}
                divisions={divisions}
                states={states}
                districts={districts}
                refresh={() => {
                    fetchWorkStatuses(pagination.pageIndex, pagination.pageSize, globalFilter);
                    fetchBoothsWithWorkStatus(yearFilter);
                }}
            />

            <AlertWorkStatusDelete
                id={workStatusDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => {
                    fetchWorkStatuses(pagination.pageIndex, pagination.pageSize, globalFilter);
                    fetchBoothsWithWorkStatus(yearFilter);
                }}
            />
        </>
    );
}

