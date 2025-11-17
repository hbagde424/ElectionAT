import React, { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Chip,
    Grid,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Divider,
    Alert,
    Drawer,
    Paper
} from '@mui/material';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';
import { useTheme } from '@mui/material/styles';
import {
    flexRender,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel
} from '@tanstack/react-table';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import { CSVLink } from 'react-csv';

// Project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import axiosServices from 'utils/axios';
import { usePermissions } from 'contexts/PermissionContext';

// Local imports
import SamitiModal from './SamitiModal';
import AlertSamitiDelete from './AlertSamitiDelete';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import CloseIcon from '@mui/icons-material/Close';

const SamitiListPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    
    const [samitis, setSamitis] = useState([]);
    const [allSamitis, setAllSamitis] = useState([]);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ open: false, id: null });
    const [globalFilter, setGlobalFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    
    // Reference data
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
    // Drawer state for map click
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    // Track booths that have samiti data both by booth _id and by booth_number
    const [boothsWithSamiti, setBoothsWithSamiti] = useState({ ids: new Set(), numbers: new Set() });
    
    // Filters
    const [filterValues, setFilterValues] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        village: '',
        falia: ''
    });
    const [appliedFilters, setAppliedFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        booth: '',
        village: '',
        falia: ''
    });
    
    // CSV functionality
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    // Debounce search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setGlobalFilter(searchInput);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchInput]);

    // Keep local input in sync when globalFilter changes
    useEffect(() => {
        setSearchInput(globalFilter || '');
    }, [globalFilter]);

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all samiti data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all samiti data' };
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
            description: `You have access to samiti data for ${entityName} ${levelName} and all areas within it`
        };
    };

    const accessScope = getUserAccessScope();

    // Fetch all samitis for filters
    const fetchAllSamitisForFilters = async () => {
        try {
            const hierarchyFilters = {};
            if (userHierarchy?.state) hierarchyFilters.state_id = userHierarchy.state._id;
            if (userHierarchy?.division) hierarchyFilters.division_id = userHierarchy.division._id;
            if (userHierarchy?.parliament) hierarchyFilters.parliament_id = userHierarchy.parliament._id;
            if (userHierarchy?.assembly) hierarchyFilters.assembly_id = userHierarchy.assembly._id;
            if (userHierarchy?.block) hierarchyFilters.block_id = userHierarchy.block._id;
            if (userHierarchy?.booth) hierarchyFilters.booth_id = userHierarchy.booth._id;
            
            const data = await fetchAllDataForFilters('/samitis', hierarchyFilters);
            setAllSamitis(data);
        } catch (error) {
            console.error('Error fetching all samitis for filters:', error);
        }
    };

    // Extract filter options from allSamitis
    const filterOptions = useFilterOptionsFromData(allSamitis, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
        booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' }
    });

    // Filtered data for cascading dropdowns
    const filteredDivisions = filterValues.state
        ? filterOptions.divisions?.filter(division => {
            const stateId = division.state_id?._id || division.state_id;
            return stateId === filterValues.state;
        }) || []
        : [];

    const filteredParliaments = filterValues.division
        ? filterOptions.parliaments?.filter(parliament => {
            const divisionId = parliament.division_id?._id || parliament.division_id;
            return divisionId === filterValues.division;
        }) || []
        : filterValues.state
            ? filterOptions.parliaments?.filter(parliament => {
                const stateId = parliament.state_id?._id || parliament.state_id;
                return stateId === filterValues.state;
            }) || []
            : [];

    const filteredAssemblies = filterValues.parliament
        ? filterOptions.assemblies?.filter(assembly => {
            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
            return parliamentId === filterValues.parliament;
        }) || []
        : filterValues.division
            ? filterOptions.assemblies?.filter(assembly => {
                const divisionId = assembly.division_id?._id || assembly.division_id;
                return divisionId === filterValues.division;
            }) || []
            : [];

    const filteredBlocks = filterValues.assembly
        ? filterOptions.blocks?.filter(block => {
            const assemblyId = block.assembly_id?._id || block.assembly_id;
            return assemblyId === filterValues.assembly;
        }) || []
        : [];

    const filteredBooths = filterValues.block
        ? filterOptions.booths?.filter(booth => {
            const blockId = booth.block_id?._id || booth.block_id;
            return blockId === filterValues.block;
        }) || []
        : [];

    const fetchSamitis = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let queryParams = [
                `page=${pageIndex + 1}`,
                `limit=${pageSize}`
            ];

            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            }

            // Apply filters
            if (appliedFilters.state) queryParams.push(`state_id=${appliedFilters.state}`);
            if (appliedFilters.division) queryParams.push(`division_id=${appliedFilters.division}`);
            if (appliedFilters.parliament) queryParams.push(`parliament_id=${appliedFilters.parliament}`);
            if (appliedFilters.assembly) queryParams.push(`assembly_id=${appliedFilters.assembly}`);
            if (appliedFilters.block) queryParams.push(`block_id=${appliedFilters.block}`);
            if (appliedFilters.booth) queryParams.push(`booth_id=${appliedFilters.booth}`);
            if (appliedFilters.village) queryParams.push(`village=${encodeURIComponent(appliedFilters.village)}`);
            if (appliedFilters.falia) queryParams.push(`falia=${encodeURIComponent(appliedFilters.falia)}`);
            if (yearFilter) queryParams.push(`year=${yearFilter}`);
            if (yearFilter) queryParams.push(`year=${yearFilter}`);

            const { data: json } = await axiosServices.get(`/samitis?${queryParams.join('&')}`);
            if (json.success) {
                setSamitis(json.data);
                setPageCount(json.pages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes, divisionsRes, parliamentsRes,
                assembliesRes, blocksRes, boothsRes
            ] = await Promise.all([
                axiosServices.get('/states'),
                axiosServices.get('/divisions'),
                axiosServices.get('/parliaments'),
                axiosServices.get('/assemblies'),
                axiosServices.get('/blocks'),
                axiosServices.get('/booths')
            ]);

            if (statesRes.data.success) setStates(statesRes.data.data);
            if (divisionsRes.data.success) setDivisions(divisionsRes.data.data);
            if (parliamentsRes.data.success) setParliaments(parliamentsRes.data.data);
            if (assembliesRes.data.success) setAssemblies(assembliesRes.data.data);
            if (blocksRes.data.success) setBlocks(blocksRes.data.data);
            if (boothsRes.data.success) setBooths(boothsRes.data.data);
        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    useEffect(() => {
        fetchSamitis(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
        fetchAllSamitisForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, appliedFilters, yearFilter]);

    // Fetch booths that have samiti data
    const fetchBoothsWithSamiti = async (selectedYear = yearFilter) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const apiUrl = import.meta.env.VITE_APP_API_URL || '';
            // Build query params similar to CSV/export: request all results (no pagination)
            const params = new URLSearchParams();
            params.set('all', 'true');
            // include side-panel applied filters so markers reflect currently-applied filters
            if (appliedFilters.state) params.set('state_id', appliedFilters.state);
            if (appliedFilters.division) params.set('division_id', appliedFilters.division);
            if (appliedFilters.parliament) params.set('parliament_id', appliedFilters.parliament);
            if (appliedFilters.assembly) params.set('assembly_id', appliedFilters.assembly);
            if (appliedFilters.block) params.set('block_id', appliedFilters.block);
            if (appliedFilters.booth) params.set('booth_id', appliedFilters.booth);
            if (appliedFilters.village) params.set('village', appliedFilters.village);
            if (appliedFilters.falia) params.set('falia', appliedFilters.falia);
            if (selectedYear) params.set('year', selectedYear);

            const url = `${apiUrl}/samitis?${params.toString()}`;
            const response = await fetch(url, { headers });
            if (response.ok) {
                const data = await response.json();
                const samitis = data.data || data;
                const boothIds = new Set();
                const boothNumbers = new Set();

                samitis.forEach(samiti => {
                    // collect booth id
                    if (samiti.booth_id && typeof samiti.booth_id === 'object' && samiti.booth_id._id) {
                        boothIds.add(String(samiti.booth_id._id));
                        // if booth object contains booth_number, capture it too
                        if (samiti.booth_id.booth_number !== undefined && samiti.booth_id.booth_number !== null) {
                            boothNumbers.add(String(samiti.booth_id.booth_number).trim().toLowerCase());
                        } else {
                            // try to resolve booth_number from local reference data if population didn't include it
                            const resolved = booths.find(b => String(b._id) === String(samiti.booth_id._id));
                            if (resolved && resolved.booth_number !== undefined && resolved.booth_number !== null) {
                                boothNumbers.add(String(resolved.booth_number).trim().toLowerCase());
                            }
                        }
                    } else if (samiti.booth_id) {
                        boothIds.add(String(samiti.booth_id));
                        // try to resolve booth number from local reference data if available
                        const resolved = booths.find(b => String(b._id) === String(samiti.booth_id));
                        if (resolved && resolved.booth_number !== undefined && resolved.booth_number !== null) {
                            boothNumbers.add(String(resolved.booth_number).trim().toLowerCase());
                        }
                    }

                    // Also check if samiti document itself carries a booth number field (legacy)
                    if (samiti.booth_number) {
                        boothNumbers.add(String(samiti.booth_number).trim().toLowerCase());
                    }
                });

                setBoothsWithSamiti({ ids: boothIds, numbers: boothNumbers });
                console.log('✅ Booths with samiti updated (Year: ' + (selectedYear || 'All') + '): ids=' + boothIds.size + ', numbers=' + boothNumbers.size);
            }
        } catch (error) {
            console.error('Error fetching booths with samiti:', error);
        }
    };

    // Load booth polygons by block
    const loadBoothPolygons = async (blockInput) => {
        if (!blockInput) {
            setMapError('Please select a Block');
            return;
        }
        setMapError('');
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await fetchBoothsWithSamiti(yearFilter);

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

    // Auto-load ALL polygons on mount
    useEffect(() => {
        if (mapboxToken && blocks && blocks.length > 0) {
            loadBoothPolygons('ALL');
        }
    }, [blocks, mapboxToken]);

    // Refresh samiti markers when year filter changes
    useEffect(() => {
        if (boothGeoJSON && yearFilter !== undefined) {
            fetchBoothsWithSamiti(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    // Refresh samiti markers when applied side-panel filters change
    useEffect(() => {
        if (boothGeoJSON) {
            fetchBoothsWithSamiti();
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    // Fetch booth + samitis when a polygon is clicked
    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            console.log('[Samiti Map] Clicked booth number:', boothNo);

            // Fetch all booths to find by booth_number
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;
            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo).trim();
                // Try exact match first (case-sensitive)
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr);
                
                if (!booth) {
                    // Try case-insensitive match
                    booth = json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase());
                }
                
                console.log('[Samiti Map] Matched booth:', booth ? { id: booth._id, name: booth.name, booth_number: booth.booth_number } : 'NOT FOUND');
            }

            // Fetch samitis for this booth
            let samitisForBooth = [];
            if (booth && booth._id) {
                try {
                    let apiUrl = `${import.meta.env.VITE_APP_API_URL}/samitis?booth_id=${encodeURIComponent(booth._id)}&limit=100`;
                    if (yearFilter) apiUrl += `&year=${yearFilter}`;
                    console.log('[Samiti Map] Fetching from:', apiUrl);
                    
                    const sRes = await fetch(apiUrl, { headers });
                    const sJson = await sRes.json();
                    
                    if (sJson.success && Array.isArray(sJson.data)) {
                        samitisForBooth = sJson.data;
                        console.log('[Samiti Map] Found samitis:', samitisForBooth.length);
                    }
                } catch (err) {
                    console.error('[Samiti Map] Error fetching samitis:', err);
                }
            } else {
                console.warn('[Samiti Map] No booth matched, cannot fetch samitis');
            }

            setDrawerData({ loading: false, boothNo, details: { booth, samitis: samitisForBooth } });
        } catch (e) {
            console.error('[Samiti Map] Error in fetchBoothDetailsByPolygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, samitis: [] }, error: e.message });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const handleApplyFilters = () => {
        setAppliedFilters(filterValues);
        setPagination({ pageIndex: 0, pageSize: 10 });
    };

    const handleClearFilters = () => {
        const emptyFilters = {
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: '',
            village: '',
            falia: ''
        };
        setFilterValues(emptyFilters);
        setAppliedFilters(emptyFilters);
        setPagination({ pageIndex: 0, pageSize: 10 });
    };

    // Handle cascading filter changes
    const handleStateChange = (stateValue) => {
        setFilterValues({
            ...filterValues,
            state: stateValue,
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleDivisionChange = (divisionValue) => {
        setFilterValues({
            ...filterValues,
            division: divisionValue,
            parliament: '',
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleParliamentChange = (parliamentValue) => {
        setFilterValues({
            ...filterValues,
            parliament: parliamentValue,
            assembly: '',
            block: '',
            booth: ''
        });
    };

    const handleAssemblyChange = (assemblyValue) => {
        setFilterValues({
            ...filterValues,
            assembly: assemblyValue,
            block: '',
            booth: ''
        });
    };

    const handleBlockChange = (blockValue) => {
        setFilterValues({
            ...filterValues,
            block: blockValue,
            booth: ''
        });
    };

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        try {
            let queryParams = ['all=true'];
            
            // Apply same filters for CSV export
            if (appliedFilters.state) queryParams.push(`state_id=${appliedFilters.state}`);
            if (appliedFilters.division) queryParams.push(`division_id=${appliedFilters.division}`);
            if (appliedFilters.parliament) queryParams.push(`parliament_id=${appliedFilters.parliament}`);
            if (appliedFilters.assembly) queryParams.push(`assembly_id=${appliedFilters.assembly}`);
            if (appliedFilters.block) queryParams.push(`block_id=${appliedFilters.block}`);
            if (appliedFilters.booth) queryParams.push(`booth_id=${appliedFilters.booth}`);
            if (appliedFilters.village) queryParams.push(`village=${encodeURIComponent(appliedFilters.village)}`);
            if (appliedFilters.falia) queryParams.push(`falia=${encodeURIComponent(appliedFilters.falia)}`);

            const { data: json } = await axiosServices.get(`/samitis?${queryParams.join('&')}`);

            if (json.success) {
                const csvData = json.data.map(item => ({
                    'Samiti Name': item.samiti_name || '',
                    'Village': item.village || '',
                    'Falia': item.falia || '',
                    'Count': item.count || 0,
                    'State': item.state_id?.name || '',
                    'Division': item.division_id?.name || '',
                    'Parliament': item.parliament_id?.name || '',
                    'Assembly': item.assembly_id?.name || '',
                    'Block': item.block_id?.name || '',
                    'Booth': item.booth_id?.name || '',
                    'Created By': item.created_by?.username || '',
                    'Created At': item.created_at ? new Date(item.created_at).toLocaleString('en-IN') : '',
                    'Updated At': item.updated_at ? new Date(item.updated_at).toLocaleString('en-IN') : ''
                }));

                setCsvData(csvData);
                setTimeout(() => {
                    if (csvLinkRef.current) {
                        csvLinkRef.current.link.click();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Failed to generate CSV:', error);
        } finally {
            setCsvLoading(false);
        }
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
        },
        {
            header: 'Samiti Name',
            accessorKey: 'samiti_name',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Village',
            accessorKey: 'village',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Falia',
            accessorKey: 'falia',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Count',
            accessorKey: 'count',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 0}
                    color="primary"
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
                    color="info"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue()?.name || 'N/A'}
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
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => (
                <Typography>
                    {formatDate(getValue())}
                </Typography>
            )
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton
                                color="secondary"
                                onClick={() => navigate(`/samitis/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => {
                                e.stopPropagation();
                                setEditData(row.original);
                                setOpenModal(true);
                            }}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={(e) => {
                                e.stopPropagation();
                                setDeleteAlert({ open: true, id: row.original._id });
                            }}>
                                <Trash />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            }
        }
    ], [navigate]);

    const table = useReactTable({
        data: samitis,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel()
    });

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <MainCard content={false}>
                        <Stack spacing={2} sx={{ padding: 3 }}>
                            {/* Samiti Map */}
                            <Box>
                                <Typography variant="h6" sx={{ mb: 1 }}>Samiti Map</Typography>
                                {mapError && <Alert severity="warning" sx={{ mb: 1 }}>{mapError}</Alert>}
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
                                                    console.log('[Samiti Map] Clicked polygon properties:', props);
                                                    const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || (props.properties && (props.properties.BoothNo || props.properties.booth_number));
                                                    console.log('[Samiti Map] Extracted boothNo:', boothNo);
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
                                                <Layer id="booth-fill" type="fill" paint={{ 'fill-color': '#1e88e5', 'fill-opacity': 0.25 }} />
                                                <Layer id="booth-outline" type="line" paint={{ 'line-color': '#1565c0', 'line-width': 1 }} />
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
                                        {/* Samiti Markers Layer */}
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
                                                        
                                                        // Determine if this feature's booth has samiti by checking:
                                                        // 1) If feature contains a booth id that exists in samiti ids set
                                                        // 2) Or if the booth number (from polygon props) exists in the samiti booth numbers set
                                                        const featureId = props.id || props.booth || props.BoothId || props._id || null;
                                                        const boothNoNormalized = String(boothNo || '').trim().toLowerCase();
                                                        let hasSamiti = false;
                                                        try {
                                                            if (featureId && boothsWithSamiti.ids && boothsWithSamiti.ids.has(String(featureId))) {
                                                                hasSamiti = true;
                                                            }
                                                            if (!hasSamiti && boothsWithSamiti.numbers && boothsWithSamiti.numbers.has(boothNoNormalized)) {
                                                                hasSamiti = true;
                                                            }
                                                            // As a last resort, attempt to match by resolving id -> booth and comparing booth_number
                                                            if (!hasSamiti && featureId && booths && booths.length) {
                                                                const resolvedBooth = booths.find(b => String(b._id) === String(featureId));
                                                                if (resolvedBooth && String(resolvedBooth.booth_number).trim().toLowerCase() === boothNoNormalized) {
                                                                    hasSamiti = true;
                                                                }
                                                            }
                                                        } catch (e) {
                                                            // fall back to no samiti
                                                            hasSamiti = false;
                                                        }
                                                        
                                                        return {
                                                            type: 'Feature',
                                                            geometry: {
                                                                type: 'Point',
                                                                coordinates: coordinates
                                                            },
                                                            properties: {
                                                                ...props,
                                                                hasSamiti: hasSamiti
                                                            }
                                                        };
                                                    })
                                                }}
                                            >
                                                <Layer
                                                    id="booth-samiti-markers"
                                                    type="circle"
                                                    paint={{
                                                        'circle-radius': 6,
                                                        'circle-color': [
                                                            'case',
                                                            ['get', 'hasSamiti'],
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
                                            <Typography variant="caption">Has Samiti Data</Typography>
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
                                            <Typography variant="caption">No Samiti Data</Typography>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            </Box>
                            {/* Right-side Drawer for clicked booth info */}
                            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                                <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                                    {/* Header */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                                        <Box>
                                            <Typography variant="h6">Booth Details</Typography>
                                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view samitis</Typography>
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
                                                    <Typography variant="subtitle2">Samitis ({drawerData.details.samitis?.length || 0})</Typography>
                                                    {drawerData.details.samitis?.length ? drawerData.details.samitis.slice(0, 10).map(sm => (
                                                        <Box key={sm._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sm.samiti_name || sm.name || 'N/A'}</Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {sm.village || sm.village_id?.village_name || 'N/A'} • {sm.falia || sm.faliya || sm.falliya_id?.falliya_name || 'N/A'} {sm.year ? `• ${sm.year}` : ''}
                                                            </Typography>
                                                        </Box>
                                                    )) : (
                                                        <Typography variant="body2">No samitis found for this booth.</Typography>
                                                    )}
                                                </Paper>
                                            </Stack>
                                        )}
                                    </Box>
                                </Box>
                            </Drawer>
                            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                                <TextField
                                    size="small"
                                    variant="outlined"
                                    placeholder={`Search ${samitis.length} samitis...`}
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    sx={{ minWidth: 300 }}
                                />
                                <Stack direction="row" spacing={1}>
                                    <CSVLink
                                        data={csvData}
                                        filename="samitis_all.csv"
                                        style={{ display: 'none' }}
                                        ref={csvLinkRef}
                                    />
                                    <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                        {csvLoading ? 'Preparing CSV...' : 'Download CSV'}
                                    </Button>
                                    <Button variant="contained" startIcon={<Add />} onClick={() => { setEditData(null); setOpenModal(true); }}>
                                        Add Samiti
                                    </Button>
                                </Stack>
                            </Stack>

                            {/* Access Scope Information */}
                            <Alert severity="info">
                                <Typography variant="body2">
                                    <strong>Data Access:</strong> {accessScope.description}
                                </Typography>
                            </Alert>

                            {/* Filters Section */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>State</InputLabel>
                                        <Select
                                            value={filterValues.state}
                                            onChange={(e) => handleStateChange(e.target.value)}
                                            label="State"
                                        >
                                            <MenuItem value="">All States</MenuItem>
                                            {filterOptions.states?.map((state) => (
                                                <MenuItem key={state._id} value={state._id}>
                                                    {state.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Division</InputLabel>
                                        <Select
                                            value={filterValues.division}
                                            onChange={(e) => handleDivisionChange(e.target.value)}
                                            label="Division"
                                            disabled={!filterValues.state}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.state ? "Select State First" : "All Divisions"}
                                            </MenuItem>
                                            {filteredDivisions.map((division) => (
                                                <MenuItem key={division._id} value={division._id}>
                                                    {division.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Parliament</InputLabel>
                                        <Select
                                            value={filterValues.parliament}
                                            onChange={(e) => handleParliamentChange(e.target.value)}
                                            label="Parliament"
                                            disabled={!filterValues.division}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.division ? "Select Division First" : "All Parliaments"}
                                            </MenuItem>
                                            {filteredParliaments.map((parliament) => (
                                                <MenuItem key={parliament._id} value={parliament._id}>
                                                    {parliament.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Assembly</InputLabel>
                                        <Select
                                            value={filterValues.assembly}
                                            onChange={(e) => handleAssemblyChange(e.target.value)}
                                            label="Assembly"
                                            disabled={!filterValues.parliament}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.parliament ? "Select Parliament First" : "All Assemblies"}
                                            </MenuItem>
                                            {filteredAssemblies.map((assembly) => (
                                                <MenuItem key={assembly._id} value={assembly._id}>
                                                    {assembly.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Block</InputLabel>
                                        <Select
                                            value={filterValues.block}
                                            onChange={(e) => handleBlockChange(e.target.value)}
                                            label="Block"
                                            disabled={!filterValues.assembly}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.assembly ? "Select Assembly First" : "All Blocks"}
                                            </MenuItem>
                                            {filteredBlocks.map((block) => (
                                                <MenuItem key={block._id} value={block._id}>
                                                    {block.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Booth</InputLabel>
                                        <Select
                                            value={filterValues.booth}
                                            onChange={(e) => setFilterValues(prev => ({ ...prev, booth: e.target.value }))}
                                            label="Booth"
                                            disabled={!filterValues.block}
                                        >
                                            <MenuItem value="">
                                                {!filterValues.block ? "Select Block First" : "All Booths"}
                                            </MenuItem>
                                            {filteredBooths.map((booth) => (
                                                <MenuItem key={booth._id} value={booth._id}>
                                                    {booth.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Village"
                                        value={filterValues.village}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, village: e.target.value }))}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Falia"
                                        value={filterValues.falia}
                                        onChange={(e) => setFilterValues(prev => ({ ...prev, falia: e.target.value }))}
                                    />
                                </Grid>

                                {/* Filter Buttons */}
                                <Grid item xs={12}>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Button
                                            variant="contained"
                                            onClick={handleApplyFilters}
                                            size="small"
                                            color="primary"
                                        >
                                            Apply Filters
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={handleClearFilters}
                                            size="small"
                                        >
                                            Clear Filters
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
                                            <Fragment key={row.id}>
                                                <TableRow>
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
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
                    </MainCard>
                </Grid>
            </Grid>

            <SamitiModal
                open={openModal}
                modalToggler={setOpenModal}
                samiti={editData}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => {
                    fetchSamitis(pagination.pageIndex, pagination.pageSize, globalFilter);
                    fetchBoothsWithSamiti();
                }}
            />

            <AlertSamitiDelete
                open={deleteAlert.open}
                handleClose={() => setDeleteAlert({ open: false, id: null })}
                id={deleteAlert.id}
                refresh={() => {
                    fetchSamitis(pagination.pageIndex, pagination.pageSize, globalFilter);
                    fetchBoothsWithSamiti();
                }}
            />
        </>
    );
};

export default SamitiListPage;