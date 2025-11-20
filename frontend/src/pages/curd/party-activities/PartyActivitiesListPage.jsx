// PartyActivitiesListPage.jsx
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField,
    FormControl, InputLabel, Select, MenuItem, Grid, Drawer, Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';
import { Alert } from '@mui/material';
import { usePermissions } from 'contexts/PermissionContext';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import CloseIcon from '@mui/icons-material/Close';

import PartyActivitiesModal from './PartyActivitiesModal';
import AlertPartyActivitiesDelete from './AlertPartyActivitiesDelete';
import PartyActivitiesView from './PartyActivitiesView';

export default function PartyActivitiesListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    const [selectedPartyActivity, setSelectedPartyActivity] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [partyActivityDeleteId, setPartyActivityDeleteId] = useState('');
    const [partyActivities, setPartyActivities] = useState([]);
    const [allPartyActivities, setAllPartyActivities] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [parties, setParties] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({});
    const [appliedFilters, setAppliedFilters] = useState({});

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapTheme, setMapTheme] = useState('streets');
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithActivities, setBoothsWithActivities] = useState(new Set());
    const [selectedBoothForFilter, setSelectedBoothForFilter] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Memo: Deduplicated marker points for booths (1 per unique booth number)
    const boothMarkersGeoJSON = useMemo(() => {
        if (!boothGeoJSON?.features) return { type: 'FeatureCollection', features: [] };

        // Build quick lookup of booth numbers that have activities
        const boothNumbersWithActivities = new Set();
        if (Array.isArray(booths) && boothsWithActivities && boothsWithActivities.size) {
            booths.forEach(b => {
                if (!b) return;
                const id = String(b._id || '');
                const num = b.booth_number != null ? String(b.booth_number) : '';
                if (id && num && boothsWithActivities.has(id)) {
                    boothNumbersWithActivities.add(num);
                }
            });
        }

        const seen = new Set();
        const features = [];

        const getCentroid = (feature) => {
            let coordsArr = [];
            const geom = feature.geometry;
            if (!geom) return [0, 0];
            const collect = (arr) => arr.forEach(pt => Array.isArray(pt[0]) ? collect(pt) : coordsArr.push(pt));
            if (geom.type === 'Polygon') collect(geom.coordinates || []);
            if (geom.type === 'MultiPolygon') (geom.coordinates || []).forEach(poly => collect(poly));
            if (!coordsArr.length) return [0, 0];
            const lngs = coordsArr.map(c => c[0]);
            const lats = coordsArr.map(c => c[1]);
            return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
        };

        for (const feature of boothGeoJSON.features) {
            const props = feature.properties || {};
            const boothNoRaw = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
            const boothNoStr = boothNoRaw != null ? String(boothNoRaw).trim() : '';
            const centroid = getCentroid(feature);
            const coordKey = `coord:${centroid[0].toFixed(5)},${centroid[1].toFixed(5)}`;
            const key = boothNoStr ? `booth:${boothNoStr.toLowerCase()}` : coordKey;
            if (seen.has(key)) continue;
            seen.add(key);

            const hasActivities = boothNoStr ? boothNumbersWithActivities.has(boothNoStr) : false;

            features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: centroid },
                properties: { ...props, hasActivities }
            });
        }

        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, boothsWithActivities, booths]);

    // Handle filter changes
    const handleFilterChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };

        // Clear dependent fields when parent field changes
        switch (field) {
            case 'state_id':
                newFilters.division_id = '';
                newFilters.parliament_id = '';
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'division_id':
                newFilters.parliament_id = '';
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'parliament_id':
                newFilters.assembly_id = '';
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'assembly_id':
                newFilters.block_id = '';
                newFilters.booth_id = '';
                break;
            case 'block_id':
                newFilters.booth_id = '';
                break;
            default:
                break;
        }

        setFilters(newFilters);
    };

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const fetchOpts = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, partiesRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths?limit=10000`, fetchOpts),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parties?limit=10000`, fetchOpts)
            ]);


            const [usersRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/users?limit=10000`, fetchOpts)
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData, partiesData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json(),
                partiesRes.json()
            ]);


            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (partiesData.success) setParties(partiesData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Fetch all party activities for filters
    const fetchAllPartyActivitiesForFilters = async () => {
        try {
            const hierarchyFilters = {};
            if (userHierarchy?.state) hierarchyFilters.state_id = userHierarchy.state._id;
            if (userHierarchy?.division) hierarchyFilters.division_id = userHierarchy.division._id;
            if (userHierarchy?.parliament) hierarchyFilters.parliament_id = userHierarchy.parliament._id;
            if (userHierarchy?.assembly) hierarchyFilters.assembly_id = userHierarchy.assembly._id;
            if (userHierarchy?.block) hierarchyFilters.block_id = userHierarchy.block._id;
            if (userHierarchy?.booth) hierarchyFilters.booth_id = userHierarchy.booth._id;
            
            const data = await fetchAllDataForFilters('/party-activities', hierarchyFilters);
            setAllPartyActivities(data);
        } catch (error) {
            console.error('Error fetching all party activities for filters:', error);
        }
    };

    // Extract filter options from allPartyActivities
    const filterOptions = useFilterOptionsFromData(allPartyActivities, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
        booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' }
    });

    // Fetch booths with activities to mark them on the map
    const fetchBoothsWithActivities = async (selectedYear = yearFilter) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            let url = `${import.meta.env.VITE_APP_API_URL}/party-activities?all=true&limit=50000`;
            if (selectedYear) url += `&year=${selectedYear}`;
            const activitiesRes = await fetch(url, { headers });
            const activitiesJson = await activitiesRes.json();
            if (activitiesJson.success && Array.isArray(activitiesJson.data)) {
                const boothIds = new Set();
                activitiesJson.data.forEach(activity => {
                    if (activity.booth_id) {
                        const boothId = activity.booth_id._id || activity.booth_id;
                        boothIds.add(String(boothId));
                    }
                });
                setBoothsWithActivities(boothIds);
                console.log('✅ Booths with activities updated (Year: ' + (selectedYear || 'All') + '):', boothIds.size);
            }
        } catch (err) {
            console.warn('Failed to fetch booths with activities:', err);
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

            // Fetch booths with activities in parallel
            fetchBoothsWithActivities(yearFilter);

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

    // Refresh activity markers when year filter changes
    useEffect(() => {
        if (boothGeoJSON && yearFilter !== undefined) {
            fetchBoothsWithActivities(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    // Fetch booth details and party activities when a polygon is clicked
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

            // Get party activities for this booth
            let partyActivities = [];
            if (booth && booth._id) {
                try {
                    let activitiesUrl = `${import.meta.env.VITE_APP_API_URL}/party-activities?booth=${encodeURIComponent(booth._id)}&all=true`;
                    if (yearFilter) activitiesUrl += `&year=${yearFilter}`;
                    const activitiesRes = await fetch(activitiesUrl, { headers });
                    const activitiesJson = await activitiesRes.json();
                    if (activitiesJson.success && Array.isArray(activitiesJson.data)) {
                        partyActivities = activitiesJson.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch party activities for booth:', e);
                }
            }

            setDrawerData({
                loading: false,
                boothNo,
                details: {
                    booth,
                    partyActivities
                }
            });

            // Sync table filters so only this booth's activities show and reset pagination
            if (booth && booth._id) {
                const newFilters = {
                    state_id: booth.state_id?._id || booth.state_id || '',
                    division_id: booth.division_id?._id || booth.division_id || '',
                    parliament_id: booth.parliament_id?._id || booth.parliament_id || '',
                    assembly_id: booth.assembly_id?._id || booth.assembly_id || '',
                    block_id: booth.block_id?._id || booth.block_id || '',
                    booth_id: booth._id,
                    booth: booth._id
                };
                setFilters(prev => ({ ...prev, ...newFilters }));
                setAppliedFilters(prev => ({ ...prev, ...newFilters }));
                // remember which booth we're filtering by (store friendly label)
                setSelectedBoothForFilter({ id: booth._id, number: booth.booth_number || booth.name || booth._id });
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
            }
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, partyActivities: [] }, error: e.message });
        }
    };

    const fetchPartyActivities = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            // When searching, fetch all results on first page
            let currentPage = pageIndex + 1;
            let currentLimit = pageSize;
            if (globalFilter) {
                currentPage = 1;
                currentLimit = 10000;
            }
            // Build query parameters
            const queryParams = new URLSearchParams({
                page: currentPage,
                limit: currentLimit,
                ...(globalFilter && { search: globalFilter }),
                // Filters
                ...(appliedFilters.state_id && { state_id: appliedFilters.state_id }),
                ...(appliedFilters.division_id && { division_id: appliedFilters.division_id }),
                ...(appliedFilters.parliament_id && { parliament_id: appliedFilters.parliament_id }),
                ...(appliedFilters.assembly_id && { assembly_id: appliedFilters.assembly_id }),
                ...(appliedFilters.block_id && { block_id: appliedFilters.block_id }),
                // backend expects 'booth' param for filtering by booth id; include either key if present
                ...(appliedFilters.booth_id && { booth: appliedFilters.booth_id }),
                ...(appliedFilters.booth && { booth: appliedFilters.booth }),
                ...(appliedFilters.activity_type && { activity_type: appliedFilters.activity_type }),
                ...(appliedFilters.status && { status: appliedFilters.status }),
                ...(yearFilter && { year: yearFilter })
            });

            const token = localStorage.getItem('serviceToken');
            const fetchOpts = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/party-activities?${queryParams}`, fetchOpts);
            const json = await res.json();
            if (json.success) {
                setPartyActivities(json.data);
                if (globalFilter) {
                    setPageCount(1);
                    if (pageIndex !== 0) {
                        setPagination(prev => ({ ...prev, pageIndex: 0 }));
                    }
                } else {
                    setPageCount(json.pages);
                }
            }
        } catch (error) {
            console.error('Failed to fetch party activities:', error);
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchPartyActivities(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllPartyActivitiesForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters, yearFilter]);

    const handleDeleteOpen = (id) => {
        setPartyActivityDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'scheduled':
                return 'info';
            case 'postponed':
                return 'warning';
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
            header: 'Title',
            accessorKey: 'title',
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
            header: 'Activity Type',
            accessorKey: 'activity_type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.toUpperCase() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
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
            )
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
            )
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
            )
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
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? `${getValue().name} (${getValue().booth_number})` : 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
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
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Activity Date',
            accessorKey: 'activity_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'End Date',
            accessorKey: 'end_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Location',
            accessorKey: 'location',
            cell: ({ getValue }) => <Typography>{getValue() || 'N/A'}</Typography>
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
            )
        },
        {
            header: 'Attendance',
            accessorKey: 'attendance_count',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() ? getValue().toLocaleString() : 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Media Coverage',
            accessorKey: 'media_coverage',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? 'Yes' : 'No'}
                    color={getValue() ? 'success' : 'default'}
                    size="small"
                />
            )
        },
        {
            header: 'Media Links',
            accessorKey: 'media_links',
            cell: ({ getValue }) => (
                Array.isArray(getValue()) && getValue().length > 0
                    ? getValue().map((link, idx) => (
                        <img key={idx} src={link} alt={`media-link-${idx}`} style={{ maxWidth: '100px', display: 'block', marginBottom: '4px' }} />
                    ))
                    : 'N/A'
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
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.username || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <Typography>N/A</Typography>;
                const date = new Date(value);
                const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return <Typography>{formatted}</Typography>;
            }
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => {
                const value = getValue();
                if (!value) return <Typography>N/A</Typography>;
                const date = new Date(value);
                const formatted = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                return <Typography>{formatted}</Typography>;
            }
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
                                navigate(`/party-activities/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedPartyActivity(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: partyActivities,
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

    // Helper to fetch all party activities for CSV
    const fetchAllPartyActivitiesForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/party-activities?all=true`, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all party activities for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    // Excel import states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllPartyActivitiesForCsv();
        setCsvData(allData.map(item => ({
            Title: item.title,
            'Activity Type': item.activity_type,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            Block: item.block_id?.name || '',
            Booth: item.booth_id ? `${item.booth_id.name} (${item.booth_id.booth_number})` : '',
            Description: item.description,
            'Activity Date': item.activity_date,
            'End Date': item.end_date,
            Location: item.location,
            Status: item.status,
            Attendance: item.attendance_count,
            'Media Coverage': item.media_coverage ? 'Yes' : 'No',
            'Media Links': Array.isArray(item.media_links) ? item.media_links.join(', ') : '',
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

    // Excel Template Download
    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    title: 'Jan Sabha',
                    activity_type: 'Rally',
                    description: 'Public rally in Gwalior',
                    activity_date: '2024-01-15',
                    end_date: '2024-01-15',
                    location: 'Gwalior Maidan',
                    status: 'Completed',
                    attendance_count: '5000',
                    media_coverage: 'Yes',
                    media_links: 'http://example.com/news1',
                    party_name: 'BJP',
                    state_name: 'Madhya Pradesh',
                    division_name: 'Gwalior',
                    parliament_no: '101',
                    assembly_name: 'Gwalior North',
                    block_name: 'Block 1',
                    booth_number: '101'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'party-activities-template.xlsx');
        } catch (error) {
            console.error('Error generating template:', error);
            alert('Failed to download template. Please try again.');
        }
    };

    // Excel Import Handler
    const handleImportFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        setImportResult(null);

        try {
            const XLSX = await import('xlsx');
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const normalizedData = jsonData.map(row => {
                const normalized = {};
                Object.keys(row).forEach(key => {
                    const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
                    normalized[normalizedKey] = row[key];
                });
                return normalized;
            });

            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/party-activities/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({ data: normalizedData })
            });

            const result = await response.json();
            setImportResult(result);
            if (result.success) {
                fetchPartyActivities(pagination.pageIndex, pagination.pageSize, globalFilter);
            }
        } catch (err) {
            setImportResult({ success: false, message: err.message || 'Import failed' });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    // Removed page-level loading; show inline loading row in the table instead

    return (
        <>
            <MainCard content={false}>
                {/* Mapbox Booth Polygons */}
                <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid item xs={12}>
                        <Typography variant="h5" sx={{ mb: 1 }}>Party Activities Map</Typography>
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
                                {/* Activity Markers Layer - deduped */}
                                {boothGeoJSON && (
                                    <Source id="booth-markers" type="geojson" data={boothMarkersGeoJSON}>
                                        <Layer
                                            id="booth-activity-markers"
                                            type="circle"
                                            paint={{
                                                'circle-radius': 6,
                                                'circle-color': [
                                                    'case',
                                                    ['get', 'hasActivities'],
                                                    '#22c55e', // Green for booths with activities
                                                    '#ef4444'  // Red for booths without activities
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
                        {/* Active booth filter alert (show when table is filtered by a clicked booth) */}
                        {selectedBoothForFilter && (
                            <Box sx={{ mt: 2 }}>
                                <Alert severity="info" action={
                                    <Button size="small" color="inherit" onClick={() => {
                                        // clear only the booth filter and reset table
                                        setFilters(prev => {
                                            const copy = { ...prev };
                                            delete copy.booth_id;
                                            delete copy.booth;
                                            return copy;
                                        });
                                        setAppliedFilters(prev => {
                                            const copy = { ...prev };
                                            delete copy.booth_id;
                                            delete copy.booth;
                                            return copy;
                                        });
                                        setSelectedBoothForFilter(null);
                                        setPagination(prev => ({ ...prev, pageIndex: 0 }));
                                    }}>
                                        Clear Booth Filter
                                    </Button>
                                }>
                                    <Typography variant="body2">Table filtered for Booth: <strong>{selectedBoothForFilter.number}</strong></Typography>
                                </Alert>
                            </Box>
                        )}

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
                                    <Typography variant="caption">Has Party Activities</Typography>
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
                                    <Typography variant="caption">No Party Activities</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput

                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${partyActivities.length} party activities...`}
                    />

                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="party_activities_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
                            Download Excel Template
                        </Button>
                        <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing}>
                            {importing ? 'Importing...' : 'Import Excel'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedPartyActivity(null); setOpenModal(true); }}>
                            Add Party Activity
                        </Button>

                    </Stack>
                </Stack>

                {importResult && (
                    <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)} sx={{ mx: 3, mb: 2 }}>
                        {importResult.message || (importResult.success ? 'Import successful' : 'Import failed')}
                        {importResult.imported && ` (${importResult.imported} imported)`}
                        {importResult.failed && ` (${importResult.failed} failed)`}
                    </Alert>
                )}

                {/* Access Scope Information */}
                <Alert severity="info" sx={{ m: 2 }}>
                    <Typography variant="body2">
                        <strong>Data Access:</strong> {(() => {
                            if (!userHierarchy) return 'You have access to all Party Activities data';
                            const highest = getUserHighestLevel();
                            const labelMap = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
                            const idMap = { state: userHierarchy.state, division: userHierarchy.division, parliament: userHierarchy.parliament, assembly: userHierarchy.assembly, block: userHierarchy.block, booth: userHierarchy.booth };
                            return `You have access to Party Activities data for ${labelMap[highest] || 'Unknown'}: ${idMap[highest] || 'Unknown'}`;
                        })()}
                    </Typography>
                </Alert>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                >

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Activity Type</InputLabel>
                        <Select
                            value={filters?.activity_type || ''}
                            onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                            label="Activity Type"
                            size="small"
                        >
                            <MenuItem value="">All Types</MenuItem>
                            <MenuItem value="rally">Rally</MenuItem>
                            <MenuItem value="sabha">Sabha</MenuItem>
                            <MenuItem value="meeting">Meeting</MenuItem>
                            <MenuItem value="campaign">Campaign</MenuItem>
                            <MenuItem value="door_to_door">Door to Door</MenuItem>
                            <MenuItem value="press_conference">Press Conference</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Status Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={filters?.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            label="Status"
                            size="small"
                        >
                            <MenuItem value="">All Status</MenuItem>
                            <MenuItem value="scheduled">Scheduled</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                            <MenuItem value="postponed">Postponed</MenuItem>
                        </Select>
                    </FormControl>

                    {/* State Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>State</InputLabel>
                        <Select
                            value={filters?.state_id || ''}
                            onChange={(e) => handleFilterChange('state_id', e.target.value)}
                            label="State"
                            size="small"
                        >
                            <MenuItem value="">All States</MenuItem>
                            {filterOptions.states?.map((state) => (
                                <MenuItem key={state._id} value={state._id}>{state.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Division Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Division</InputLabel>
                        <Select
                            value={filters?.division_id || ''}
                            onChange={(e) => handleFilterChange('division_id', e.target.value)}
                            label="Division"
                            size="small"
                            disabled={!filters?.state_id}
                        >
                            <MenuItem value="">All Divisions</MenuItem>
                            {filterOptions.divisions?.filter(d => {
                                const stateId = d.state_id?._id || d.state_id;
                                return stateId === filters?.state_id;
                            }).map((division) => (
                                <MenuItem key={division._id} value={division._id}>{division.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Parliament Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Parliament</InputLabel>
                        <Select
                            value={filters?.parliament_id || ''}
                            onChange={(e) => handleFilterChange('parliament_id', e.target.value)}
                            label="Parliament"
                            size="small"
                            disabled={!filters?.division_id}
                        >
                            <MenuItem value="">All Parliaments</MenuItem>
                            {filterOptions.parliaments?.filter(p => {
                                const divisionId = p.division_id?._id || p.division_id;
                                return divisionId === filters?.division_id;
                            }).map((parliament) => (
                                <MenuItem key={parliament._id} value={parliament._id}>{parliament.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Assembly Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Assembly</InputLabel>
                        <Select
                            value={filters?.assembly_id || ''}
                            onChange={(e) => handleFilterChange('assembly_id', e.target.value)}
                            label="Assembly"
                            size="small"
                            disabled={!filters?.parliament_id}
                        >
                            <MenuItem value="">All Assemblies</MenuItem>
                            {filterOptions.assemblies?.filter(a => {
                                const parliamentId = a.parliament_id?._id || a.parliament_id;
                                return parliamentId === filters?.parliament_id;
                            }).map((assembly) => (
                                <MenuItem key={assembly._id} value={assembly._id}>{assembly.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Block Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Block</InputLabel>
                        <Select
                            value={filters?.block_id || ''}
                            onChange={(e) => handleFilterChange('block_id', e.target.value)}
                            label="Block"
                            size="small"
                            disabled={!filters?.assembly_id}
                        >
                            <MenuItem value="">All Blocks</MenuItem>
                            {filterOptions.blocks?.filter(b => {
                                const assemblyId = b.assembly_id?._id || b.assembly_id;
                                return assemblyId === filters?.assembly_id;
                            }).map((block) => (
                                <MenuItem key={block._id} value={block._id}>{block.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Booth Filter */}
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Booth</InputLabel>
                        <Select
                            value={filters?.booth_id || ''}
                            onChange={(e) => handleFilterChange('booth_id', e.target.value)}
                            label="Booth"
                            size="small"
                            disabled={!filters?.block_id}
                        >
                            <MenuItem value="">All Booths</MenuItem>
                            {filterOptions.booths?.filter(b => {
                                const blockId = b.block_id?._id || b.block_id;
                                return blockId === filters?.block_id;
                            }).map((booth) => (
                                <MenuItem key={booth._id} value={booth._id}>
                                    {booth.name} (No: {booth.booth_number})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={() => {
                            setAppliedFilters(filters);
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Apply
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => {
                            setFilters({});
                            setAppliedFilters({});
                            setPagination(prev => ({ ...prev, pageIndex: 0 }));
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
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={table.getAllLeafColumns().length}>
                                            <Typography variant="body2" sx={{ p: 2 }}>Loading...</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {table.getRowModel().rows.map((row) => (
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
                                                    <PartyActivitiesView data={row.original} />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))}
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
            </MainCard >

            {/* Right-side Drawer for clicked booth info */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                        <Box>
                            <Typography variant="h6">Booth Details</Typography>
                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view party activities</Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            {selectedBoothForFilter && (
                                <Button size="small" color="primary" onClick={() => {
                                    // clear booth filter from within drawer
                                    setFilters(prev => {
                                        const copy = { ...prev };
                                        delete copy.booth_id;
                                        delete copy.booth;
                                        return copy;
                                    });
                                    setAppliedFilters(prev => {
                                        const copy = { ...prev };
                                        delete copy.booth_id;
                                        delete copy.booth;
                                        return copy;
                                    });
                                    setSelectedBoothForFilter(null);
                                    setPagination(prev => ({ ...prev, pageIndex: 0 }));
                                }}>
                                    Clear Booth Filter
                                </Button>
                            )}
                            <IconButton color="secondary" onClick={() => setDrawerOpen(false)} sx={{ p: 0.5 }}>
                                <CloseIcon />
                            </IconButton>
                        </Stack>
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
                                    <Typography variant="subtitle2">Party Activities ({drawerData.details.partyActivities?.length || 0})</Typography>
                                    {drawerData.details.partyActivities?.length ? drawerData.details.partyActivities.slice(0, 10).map(activity => (
                                        <Box key={activity._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{activity.title}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {activity.activity_type} • {activity.status}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={activity.activity_type?.toUpperCase() || 'N/A'}
                                                    size="small"
                                                    color="primary"
                                                    sx={{ mr: 0.5 }}
                                                />
                                                <Chip
                                                    label={activity.status?.toUpperCase() || 'N/A'}
                                                    size="small"
                                                    color={activity.status === 'completed' ? 'success' : activity.status === 'ongoing' ? 'warning' : 'error'}
                                                />
                                            </Box>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                📅 {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString() : 'N/A'} - {activity.end_date ? new Date(activity.end_date).toLocaleDateString() : 'N/A'}
                                            </Typography>
                                            {activity.location && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    📍 {activity.location}
                                                </Typography>
                                            )}
                                            {activity.attendance_count && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    👥 Attendance: {activity.attendance_count.toLocaleString()}
                                                </Typography>
                                            )}
                                            {activity.media_coverage && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    📺 Media Coverage: Yes
                                                </Typography>
                                            )}
                                            {activity.description && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    {activity.description.slice(0, 100)}...
                                                </Typography>
                                            )}
                                        </Box>
                                    )) : (
                                        <Typography variant="body2">No party activities found for this booth.</Typography>
                                    )}
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            <PartyActivitiesModal
                open={openModal}
                modalToggler={setOpenModal}
                partyActivity={selectedPartyActivity}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                parties={parties}
                users={users}
                refresh={() => {
                    fetchPartyActivities(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithActivities(yearFilter);
                }}
            />

            <AlertPartyActivitiesDelete
                id={partyActivityDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => {
                    fetchPartyActivities(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithActivities(yearFilter);
                }}
            />

            <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />
        </>
    );
}

