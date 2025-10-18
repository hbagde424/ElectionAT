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
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

export default function WorkStatusListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    const [selectedWorkStatus, setSelectedWorkStatus] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [workStatusDeleteId, setWorkStatusDeleteId] = useState('');
    const [workStatuses, setWorkStatuses] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const searchDebounceRef = useRef(null);

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    useEffect(() => {
        setSearchInput(globalFilter || '');
    }, [globalFilter]);

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
            if (currentFilters.announced_by) queryParams.push(`announced_by=${encodeURIComponent(currentFilters.announced_by)}`);
            if (currentFilters.workType) queryParams.push(`workType=${encodeURIComponent(currentFilters.workType)}`);
            if (currentFilters.status) queryParams.push(`status=${encodeURIComponent(currentFilters.status)}`);

            // hierarchy-based filtering
            if (userHierarchy) {
                const highest = getUserHighestLevel();
                if (highest) {
                    switch (highest) {
                        case 'state':
                            queryParams.push(`state_id=${userHierarchy.state}`);
                            break;
                        case 'division':
                            queryParams.push(`division_id=${userHierarchy.division}`);
                            break;
                        case 'parliament':
                            queryParams.push(`parliament_id=${userHierarchy.parliament}`);
                            break;
                        case 'assembly':
                            queryParams.push(`assembly_id=${userHierarchy.assembly}`);
                            break;
                        case 'block':
                            queryParams.push(`block_id=${userHierarchy.block}`);
                            break;
                        case 'booth':
                            queryParams.push(`booth_id=${userHierarchy.booth}`);
                            break;
                    }
                }
            }

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
            const resp = await fetch(`${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${encodeURIComponent(blockNumberVal)}`, { headers });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const j = await resp.json();
            const features = j?.features || j?.data || [];
            if (!Array.isArray(features) || features.length === 0) {
                setMapError(`No booth polygons found for block number '${blockNumberVal}'`);
                setBoothGeoJSON(null);
                return;
            }
            const fc = { type: 'FeatureCollection', features };
            setBoothGeoJSON(fc);
            // Fit bounds to polygons
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
                } catch {}
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
                const boothNoStr = String(boothNo).trim();
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr)
                    || json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase())
                    || json.data.find(b => String(b.booth_number).trim().includes(boothNoStr) || boothNoStr.includes(String(b.booth_number).trim()));
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
                    fetch(`${import.meta.env.VITE_APP_API_URL}/work-status/booth/${encodeURIComponent(booth._id)}`, { headers }),
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
                            gender = { male: g.male || 0, female: g.female || 0, others: g.others || 0, total: (g.male||0)+(g.female||0)+(g.others||0) };
                        } else if (gJson.data && typeof gJson.data === 'object') {
                            const g = gJson.data;
                            gender = { male: g.male || 0, female: g.female || 0, others: g.others || 0, total: (g.male||0)+(g.female||0)+(g.others||0) };
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
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

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

    if (loading) return <EmptyReactTable />;

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
                                {blocks.map((b) => (
                                    <MenuItem key={b._id} value={b.block_number || b._id}>{b.block_number ? `#${b.block_number} — ${b.name}` : b.name}</MenuItem>
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
                            ref={mapRef}
                            mapboxAccessToken={mapboxToken}
                            initialViewState={{ longitude: 75.8577, latitude: 22.7196, zoom: 8 }}
                            mapStyle="mapbox://styles/mapbox/streets-v12"
                            interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
                            onClick={(e) => {
                                if (!boothGeoJSON) return;
                                try {
                                    const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                                    const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY };
                                    let features = e.features || [];
                                    if ((!features || features.length === 0) && map && point) {
                                        features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                    }
                                    const boothFeature = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                    if (boothFeature) {
                                        const props = boothFeature.properties || {};
                                        const boothNo = props.BoothNo || props.boothNo || props.booth_number || props['Booth No'] || '';
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
                                        layout={{ 'text-field': ['concat', 'Booth ', ['get', 'BoothNo']], 'text-size': 10 }}
                                        paint={{ 'text-color': '#333' }}
                                    />
                                </Source>
                            )}
                        </Map>
                    </MapContainerStyled>
                </Box>
                {/* Access Scope Information */}
                <Alert severity="info" sx={{ m: 2 }}>
                    <Typography variant="body2">
                        <strong>Data Access:</strong> {(() => {
                            if (!userHierarchy) return 'You have access to all Work Status data';
                            const highest = getUserHighestLevel();
                            const labelMap = { state: 'State', division: 'Division', parliament: 'Parliament', assembly: 'Assembly', block: 'Block', booth: 'Booth' };
                            const idMap = { state: userHierarchy.state, division: userHierarchy.division, parliament: userHierarchy.parliament, assembly: userHierarchy.assembly, block: userHierarchy.block, booth: userHierarchy.booth };
                            const label = labelMap[highest] || 'Unknown';
                            const id = idMap[highest];
                            return `You have access to Work Status data for ${label}${id ? ` (ID: ${id})` : ''}`;
                        })()}
                    </Typography>
                </Alert>
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
                                    {states.map((state) => (
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
                                    {divisions.filter(division => {
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
                                    {districts.map((d) => (
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
                                    {parliaments.filter(parliament => {
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
                                    {assemblies.filter(assembly => {
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
                                    {blocks.filter(block => {
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
                                    {booths.filter(booth => {
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
                                {table.getRowModel().rows.map((row) => (
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
                                    <Stack direction="row" spacing={1} sx={{ my: 1, flexWrap: 'wrap' }}>
                                        <Chip label={`All (${(drawerData.details.workSummary?.total ?? 0)})`} size="small" clickable onClick={() => applyPrefilledFilter('all')} />
                                        <Chip label={`Completed (${(drawerData.details.workSummary?.completed ?? 0)})`} color="success" size="small" clickable onClick={() => applyPrefilledFilter('completed')} />
                                        <Chip label={`In Progress (${(drawerData.details.workSummary?.in_progress ?? 0)})`} color="info" size="small" clickable onClick={() => applyPrefilledFilter('in progress')} />
                                        <Chip label={`In Complete (${(drawerData.details.workSummary?.in_complete ?? 0)})`} color="warning" size="small" clickable onClick={() => applyPrefilledFilter('in complete')} />
                                        <Chip label={`Announced (${(drawerData.details.workSummary?.announced ?? 0)})`} color="primary" size="small" clickable onClick={() => applyPrefilledFilter('announced')} />
                                        <Chip label={`Other (${(drawerData.details.workSummary?.other ?? 0)})`} size="small" clickable onClick={() => applyPrefilledFilter('')} />
                                    </Stack>
                                    {drawerData.details.workStatuses?.length ? drawerData.details.workStatuses.slice(0,5).map(ws => (
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
                                    {drawerData.details.samitis?.length ? drawerData.details.samitis.slice(0,5).map(sm => (
                                        <Box key={sm._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {sm.samiti_name || 'Samiti'}</Typography>
                                            <Typography variant="caption" color="text.secondary">Count: {sm.count ?? 0}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No samiti records.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Stack spacing={1}>
                                        <Typography variant="subtitle2">Visits ({drawerData.details.visits?.length || 0})</Typography>
                                        {drawerData.details.visits?.length ? drawerData.details.visits.slice(0,5).map(v => (
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
                                    {drawerData.details.volunteers?.length ? drawerData.details.volunteers.slice(0,5).map(p => (
                                        <Typography key={p._id} variant="body2">• {p.name || p.username || p.phone || 'Unknown'} {p.party?.name ? `(${p.party.name})` : ''}</Typography>
                                    )) : <Typography variant="body2">No volunteers found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Surveys ({drawerData.details.surveys?.length || 0})</Typography>
                                    {drawerData.details.surveys?.length ? drawerData.details.surveys.slice(0,5).map(s => (
                                        <Box key={s._id} sx={{ mb: 0.5 }}>
                                            <Typography variant="body2">• {s.remark ? s.remark.slice(0,80) : (s.respondent_name || 'Survey')}</Typography>
                                            <Typography variant="caption" color="text.secondary">{s.survey_date ? new Date(s.survey_date).toLocaleDateString('en-IN') : ''}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No surveys found.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Infrastructure ({drawerData.details.infra?.length || 0})</Typography>
                                    {drawerData.details.infra?.length ? drawerData.details.infra.slice(0,5).map(i => (
                                        <Typography key={i._id} variant="body2">• {i.premises_type || i.categorization || i.note || 'Infrastructure'}</Typography>
                                    )) : <Typography variant="body2">No infrastructure records.</Typography>}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 1 }}>
                                    <Typography variant="subtitle2">Party Presence ({drawerData.details.partyPresence?.length || 0})</Typography>
                                    {drawerData.details.partyPresence?.length ? drawerData.details.partyPresence.slice(0,5).map(pp => (
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
                                    {drawerData.details.votes?.length ? drawerData.details.votes.slice(0,5).map(v => {
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
                                    {drawerData.details.electionStats?.length ? drawerData.details.electionStats.slice(0,5).map(es => {
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
                refresh={() => fetchWorkStatuses(pagination.pageIndex, pagination.pageSize, globalFilter)}
            />

            <AlertWorkStatusDelete
                id={workStatusDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchWorkStatuses(pagination.pageIndex, pagination.pageSize, globalFilter)}
            />
        </>
    );
}

