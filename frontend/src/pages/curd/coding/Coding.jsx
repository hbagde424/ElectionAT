// codingListPage.js
import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
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

import CodingModal from './CodingModal';
import AlertCodingDelete from './AlertCodingDelete';
import CodingView from './CodingView';
import { usePermissions } from 'contexts/PermissionContext';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { Drawer, Paper } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function CodingListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();

    const [selectedCoding, setSelectedCoding] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [codingDeleteId, setCodingDeleteId] = useState('');
    const [codingList, setCodingList] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapTheme, setMapTheme] = useState('streets');
    const [mapError, setMapError] = useState('');
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    // Drawer for polygon click
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithCoding, setBoothsWithCoding] = useState(new Set());

    // Filtered dropdown data
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);

    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: ''
    });

    const handleFilterChange = (field, value) => {

        let newFilters = { ...filters, [field]: value };

        // Clear child selections when parent changes
        if (field === 'state') {
            newFilters = { ...newFilters, division: '', parliament: '', assembly: '', block: '' };
            // Update filtered divisions based on selected state
            if (value && divisions.length > 0) {

                const stateDivisions = divisions.filter(division =>
                    division.state_id === value || division.state_id?._id === value
                );

                setFilteredDivisions(stateDivisions);
            } else {
                setFilteredDivisions([]);
            }
            setFilteredParliaments([]);
            setFilteredAssemblies([]);
            setFilteredBlocks([]);
        } else if (field === 'division') {
            newFilters = { ...newFilters, parliament: '', assembly: '', block: '' };
            // Update filtered parliaments based on selected division
            if (value && parliaments.length > 0) {

                const divisionParliaments = parliaments.filter(parliament =>
                    parliament.division_id === value || parliament.division_id?._id === value
                );

                setFilteredParliaments(divisionParliaments);
            } else {
                setFilteredParliaments([]);
            }
            setFilteredAssemblies([]);
            setFilteredBlocks([]);
        } else if (field === 'parliament') {
            newFilters = { ...newFilters, assembly: '', block: '' };
            // Update filtered assemblies based on selected parliament
            if (value && assemblies.length > 0) {

                const parliamentAssemblies = assemblies.filter(assembly =>
                    assembly.parliament_id === value || assembly.parliament_id?._id === value
                );

                setFilteredAssemblies(parliamentAssemblies);
            } else {
                setFilteredAssemblies([]);
            }
            setFilteredBlocks([]);
        } else if (field === 'assembly') {
            newFilters = { ...newFilters, block: '' };
            // Update filtered blocks based on selected assembly
            if (value && blocks.length > 0) {

                const assemblyBlocks = blocks.filter(block =>
                    block.assembly_id === value || block.assembly_id?._id === value
                );

                setFilteredBlocks(assemblyBlocks);
            } else {
                setFilteredBlocks([]);
            }
        }

        setFilters(newFilters);

        // Note: Filters are now only applied when Apply button is clicked
        // Removed automatic filter application to match user requirement
    };

    const handleApplyFilters = () => {
        const newColumnFilters = Object.entries(filters)
            .filter(([_, value]) => value !== '')
            .map(([id, value]) => ({ id, value }));
        setColumnFilters(newColumnFilters);
    };

    const handleClearFilters = () => {
        setFilters({
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: ''
        });
        setColumnFilters([]);

        // Clear all filtered dropdowns
        setFilteredDivisions([]);
        setFilteredParliaments([]);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
    };

    const [columnFilters, setColumnFilters] = useState([]);

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all coding data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all coding data' };
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
            description: `You have access to coding data for ${levelName}: ${levelValue}`
        };
    };

    const accessScope = getUserAccessScope();

    const fetchReferenceData = async () => {
        try {
            const getAuthHeaders = () => {
                const token = localStorage.serviceToken;
                return token ? { Authorization: `Bearer ${token}` } : {};
            };
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers: getAuthHeaders() }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, { headers: getAuthHeaders() })
            ]);

            const [statesData, divisionsData, parliamentsData, assembliesData, blocksData, boothsData] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) {

                setStates(statesData.data);
            }
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
            if (boothsData.success) setBooths(boothsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Load booth polygons by block name/id or ALL
    const loadBoothPolygons = async (blockInput) => {
        if (!blockInput) {
            setMapError('Please select a Block');
            return;
        }
        setMapError('');
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Fetch booths with coding to mark them on the map
            const fetchBoothsWithCoding = async () => {
                try {
                    const codingRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/codings?all=true&limit=50000`, { headers });
                    const codingJson = await codingRes.json();
                    if (codingJson.success && Array.isArray(codingJson.data)) {
                        const boothIds = new Set();
                        codingJson.data.forEach(coding => {
                            if (coding.booth_id) {
                                const boothId = coding.booth_id._id || coding.booth_id;
                                boothIds.add(String(boothId));
                            }
                        });
                        setBoothsWithCoding(boothIds);
                        console.log('✅ Booths with coding:', boothIds.size);
                    }
                } catch (err) {
                    console.warn('Failed to fetch booths with coding:', err);
                }
            };

            // Fetch booths with coding in parallel
            fetchBoothsWithCoding();

            if (blockInput === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || '';
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

            // Try multiple endpoints
            const candidates = [
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block/${encodeURIComponent(blockInput)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${encodeURIComponent(blockInput)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons?block=${encodeURIComponent(blockInput)}`
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
                } catch { }
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
            setMapError(`Failed to load booth polygons: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    // Auto-load ALL polygons once blocks/token ready
    useEffect(() => {
        if (mapboxToken && blocks && blocks.length > 0) {
            loadBoothPolygons('ALL');
        }
    }, [blocks, mapboxToken]);

    // Fetch booth and coding entries by clicked polygon's booth number
    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            console.log('[Coding Map] Clicked booth number:', boothNo);

            // Fetch booths and match by booth_number
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;
            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo || '').trim();
                // Try exact match first (case-sensitive)
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr);
                
                if (!booth) {
                    // Try case-insensitive match
                    booth = json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase());
                }
                
                console.log('[Coding Map] Matched booth:', booth ? { id: booth._id, name: booth.name, booth_number: booth.booth_number } : 'NOT FOUND');
            }

            // Fetch coding entries for the booth
            let codingsForBooth = [];
            if (booth && booth._id) {
                try {
                    const apiUrl = `${import.meta.env.VITE_APP_API_URL}/codings?booth_id=${encodeURIComponent(booth._id)}&limit=100`;
                    console.log('[Coding Map] Fetching from:', apiUrl);
                    
                    const cRes = await fetch(apiUrl, { headers });
                    const cJson = await cRes.json();
                    
                    if (cJson.success && Array.isArray(cJson.data)) {
                        codingsForBooth = cJson.data;
                        console.log('[Coding Map] Found codings:', codingsForBooth.length);
                    }
                } catch (err) {
                    console.error('[Coding Map] Error fetching codings:', err);
                }
            } else {
                console.warn('[Coding Map] No booth matched, cannot fetch codings');
            }

            setDrawerData({ loading: false, boothNo, details: { booth, codings: codingsForBooth } });
        } catch (e) {
            console.error('[Coding Map] Error in fetchBoothDetailsByPolygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, codings: [] }, error: e.message });
        }
    };

    const fetchCodingList = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let actualPageIndex = pageIndex;
            let actualPageSize = pageSize;

            // When searching, fetch all results on one page
            if (globalFilter && globalFilter.trim() !== '') {
                actualPageIndex = 0;
                actualPageSize = 10000; // Large enough to get all results
            }

            let query = globalFilter && globalFilter.trim() !== '' ? `&search=${encodeURIComponent(globalFilter)}` : '';

            // Add column filters to the query
            columnFilters.forEach(filter => {
                if (filter.value) {
                    // Use the filter field names as expected by the backend
                    query += `&${filter.id}=${encodeURIComponent(filter.value)}`;
                }
            });

            // Add hierarchy-based filtering
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

            const token = localStorage.serviceToken;
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/codings?page=${actualPageIndex + 1}&limit=${actualPageSize}${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const json = await res.json();
            if (json.success) {
                setCodingList(json.data);
                if (globalFilter && globalFilter.trim() !== '') {
                    // When searching, show all results on one page
                    setPageCount(1);
                } else {
                    // When not searching, use normal pagination
                    setPageCount(json.pages);
                }
            } else {
                console.error('API Error:', json);
            }
        } catch (error) {
            console.error('Failed to fetch coding list:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodingList(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, columnFilters]);

    // Reset to first page when filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [columnFilters]);

    const handleDeleteOpen = (id) => {
        setCodingDeleteId(id);
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

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row, table }) => {
                const { pageIndex, pageSize } = table.getState().pagination;
                const serialNumber = pageIndex * pageSize + row.index + 1;
                return <Typography>{serialNumber}</Typography>;
            },
            enableColumnFilter: false,
        },
        {
            header: 'Name',
            accessorKey: 'name',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Mobile',
            accessorKey: 'mobile',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Email',
            accessorKey: 'email',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'WhatsApp',
            accessorKey: 'whatsapp_number',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Facebook',
            accessorKey: 'facebook',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Instagram',
            accessorKey: 'instagram',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Twitter',
            accessorKey: 'twitter',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Coding Types',
            accessorKey: 'coding_types',
            cell: ({ getValue }) => (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                    {getValue()?.map((type, index) => (
                        <Chip key={index} label={type} size="small" />
                    ))}
                </Stack>
            )
        },
        {
            header: 'State',
            accessorKey: 'state',
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
            accessorKey: 'division',
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
            accessorKey: 'parliament',
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
            accessorKey: 'assembly',
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
            accessorKey: 'block',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="error"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Booth Number',
            accessorKey: 'booth',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.booth_number || 'N/A'}
                    color="error"
                    size="small"
                />
            )
        },
        {
            header: 'Panchayat',
            accessorKey: 'panchayat',
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
            accessorKey: 'village',
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
            accessorKey: 'falliya',
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
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
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
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>

                        <IconButton
                            color="info"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/Coding/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedCoding(row.original); setOpenModal(true); }}>
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
        data: codingList,
        columns,
        state: {
            pagination,
            globalFilter,
            columnFilters
        },
        pageCount,
        manualPagination: true,
        manualFiltering: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllCodingsForCsv = async () => {
        try {
            const token = localStorage.serviceToken;
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/codings?all=true`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all codings for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllCodingsForCsv();
        setCsvData(allData.map(item => ({
            'Name': item.name,
            'Mobile': item.mobile,
            'Email': item.email || '',
            'Facebook': item.facebook || '',
            'Instagram': item.instagram || '',
            'Twitter': item.twitter || '',
            'WhatsApp': item.whatsapp_number || '',
            'Coding Types': item.coding_types.join(', '),
            'State': item.state?.name || '',
            'Division': item.division?.name || '',
            'Parliament': item.parliament?.name || '',
            'Assembly': item.assembly?.name || '',
            'Block': item.block?.name || '',
            'Booth': item.booth?.name || '',
            'Created By': item.created_by?.username || '',
            'Created At': item.created_at
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    if (loading) {
        return <EmptyReactTable />;
    }


    return (
        <>
            <MainCard content={false}>


                <Stack spacing={2}>
                    {/* Map Section */}
                    <Box sx={{ p: 2, pb: 0 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>Coding Map</Typography>
                        {mapError && (
                            <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>
                        )}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                            <TextField
                                select
                                size="small"
                                label="Block"
                                value={blockNumberInput}
                                onChange={(e) => setBlockNumberInput(e.target.value)}
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
                                mapboxAccessToken={mapboxToken}
                                initialViewState={{ longitude: 75.8577, latitude: 22.7196, zoom: 8 }}
                                mapStyle={
                                    mapTheme === 'satellite' ? 'mapbox://styles/mapbox/satellite-v9' :
                                        mapTheme === 'light' ? 'mapbox://styles/mapbox/light-v10' :
                                            mapTheme === 'dark' ? 'mapbox://styles/mapbox/dark-v10' :
                                                'mapbox://styles/mapbox/streets-v11'
                                }
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
                                            console.log('[Coding Map] Clicked polygon properties:', props);
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || (props.properties && (props.properties.BoothNo || props.properties.booth_number));
                                            console.log('[Coding Map] Extracted boothNo:', boothNo);
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
                                        <Layer id="booth-fill" type="fill" paint={{ 'fill-color': '#1E90FF', 'fill-opacity': 0.25 }} />
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
                                {/* Coding Markers Layer */}
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
                                                
                                                const hasCoding = Array.from(boothsWithCoding).some(codingBoothId => {
                                                    const booth = booths.find(b => String(b._id) === codingBoothId);
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
                                                        hasCoding: hasCoding
                                                    }
                                                };
                                            })
                                        }}
                                    >
                                        <Layer
                                            id="booth-coding-markers"
                                            type="circle"
                                            paint={{
                                                'circle-radius': 6,
                                                'circle-color': [
                                                    'case',
                                                    ['get', 'hasCoding'],
                                                    '#22c55e',
                                                    '#ef4444'
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
                                    <Typography variant="caption">Has Coding</Typography>
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
                                    <Typography variant="caption">No Coding</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                        {/* Right-side Drawer */}
                        <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                            <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                                    <Box>
                                        <Typography variant="h6">Booth Details</Typography>
                                        <Typography variant="caption" color="text.secondary">Click a booth polygon to view coding entries</Typography>
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
                                                <Typography variant="body2"><strong>Booth No:</strong> {drawerData.details.booth?.booth_number || drawerData.boothNo || 'N/A'}</Typography>
                                                <Typography variant="body2"><strong>Block:</strong> {drawerData.details.booth?.block_id?.name || 'N/A'}</Typography>
                                                <Typography variant="body2"><strong>Assembly:</strong> {drawerData.details.booth?.assembly_id?.name || 'N/A'}</Typography>
                                                <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.booth?.parliament_id?.name || 'N/A'}</Typography>
                                            </Paper>

                                            <Paper elevation={0} sx={{ p: 1 }}>
                                                <Typography variant="subtitle2">Coding Entries ({drawerData.details.codings?.length || 0})</Typography>
                                                {drawerData.details.codings?.length ? drawerData.details.codings.slice(0, 20).map(cd => (
                                                    <Box key={cd._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{cd.name || 'N/A'} {Array.isArray(cd.coding_types) && cd.coding_types.length ? `• ${cd.coding_types.join(', ')}` : ''}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {cd.mobile || cd.whatsapp_number || ''} {cd.year ? `• ${cd.year}` : ''}
                                                        </Typography>
                                                    </Box>
                                                )) : (
                                                    <Typography variant="body2">No coding entries found for this booth.</Typography>
                                                )}
                                            </Paper>
                                        </Stack>
                                    )}
                                </Box>
                            </Box>
                        </Drawer>
                    </Box>
                    {/* Top Actions */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        sx={{ p: 2 }}
                    >
                        <DebouncedInput
                            value={globalFilter}
                            onFilterChange={setGlobalFilter}
                            placeholder={`Search ${codingList.length} coding entries...`}
                        />

                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            justifyContent="flex-end"
                        >
                            <CSVLink
                                data={csvData}
                                filename="coding_list_all.csv"
                                style={{ display: "none" }}
                                ref={csvLinkRef}
                            />
                            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                {csvLoading ? "Preparing CSV..." : "Download All CSV"}
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                onClick={() => {
                                    setSelectedCoding(null);
                                    setOpenModal(true);
                                }}
                            >
                                Add Coding Entry
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

                    {/* Filters */}
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                    >
                        <TextField
                            select
                            label="State"
                            value={filters.state}
                            onChange={(e) => handleFilterChange("state", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                        >
                            <MenuItem value="">All States</MenuItem>
                            {states.map((state) => (
                                <MenuItem key={state._id} value={state._id}>
                                    {state.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Division"
                            value={filters.division}
                            onChange={(e) => handleFilterChange("division", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.state}
                        >
                            <MenuItem value="">All Divisions</MenuItem>
                            {filteredDivisions.map((division) => (
                                <MenuItem key={division._id} value={division._id}>
                                    {division.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Parliament"
                            value={filters.parliament}
                            onChange={(e) => handleFilterChange("parliament", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.division}
                        >
                            <MenuItem value="">All Parliaments</MenuItem>
                            {filteredParliaments.map((parliament) => (
                                <MenuItem key={parliament._id} value={parliament._id}>
                                    {parliament.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Assembly"
                            value={filters.assembly}
                            onChange={(e) => handleFilterChange("assembly", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.parliament}
                        >
                            <MenuItem value="">All Assemblies</MenuItem>
                            {filteredAssemblies.map((assembly) => (
                                <MenuItem key={assembly._id} value={assembly._id}>
                                    {assembly.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Block"
                            value={filters.block}
                            onChange={(e) => handleFilterChange("block", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.assembly}
                        >
                            <MenuItem value="">All Blocks</MenuItem>
                            {filteredBlocks.map((block) => (
                                <MenuItem key={block._id} value={block._id}>
                                    {block.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <Stack direction="row" spacing={1} sx={{ minWidth: "fit-content" }}>
                            <Button variant="outlined" onClick={handleClearFilters}>
                                Clear
                            </Button>
                            <Button variant="contained" onClick={handleApplyFilters}>
                                Apply
                            </Button>
                        </Stack>
                    </Stack>
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
                                {table.getRowModel().rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} align="center">
                                            <Typography>No data available</Typography>
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
                                                        <CodingView data={row.original} />
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
            </MainCard >

            <CodingModal
                open={openModal}
                modalToggler={setOpenModal}
                codingEntry={selectedCoding}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => fetchCodingList(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertCodingDelete
                id={codingDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchCodingList(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
