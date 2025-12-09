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
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import CloseIcon from '@mui/icons-material/Close';

import GovernmentModal from './GovernmentSchemaModal';
import AlertGovernmentDelete from './AlertGovernmentSchemaDelete';
import GovernmentView from './GovernmentSchemaView';
import { usePermissions } from 'contexts/PermissionContext';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

export default function GovernmentsListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();

    const [selectedGovernment, setSelectedGovernment] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [governmentDeleteId, setGovernmentDeleteId] = useState('');
    const [governments, setGovernments] = useState([]);
    const [allGovernments, setAllGovernments] = useState([]);
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

    // Filter states
    const [selectedState, setSelectedState] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedParliament, setSelectedParliament] = useState('');
    const [selectedAssembly, setSelectedAssembly] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedBooth, setSelectedBooth] = useState('');
    const [selectedPanchayat, setSelectedPanchayat] = useState('');
    const [selectedVillage, setSelectedVillage] = useState('');
    const [selectedFalliya, setSelectedFalliya] = useState('');

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

    // Add useRef to track if reference data has been fetched
    const referenceDataFetched = useRef(false);

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapTheme, setMapTheme] = useState('streets');
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithGovernmentScheme, setBoothsWithGovernmentScheme] = useState(new Set());
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Import states
    const csvLinkRef = useRef();
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Build booth-number set for coloring markers
    const schemeBoothNumberSet = useMemo(() => {
        const set = new Set();
        try {
            Array.from(boothsWithGovernmentScheme || []).forEach((id) => {
                const booth = booths?.find((b) => String(b._id) === String(id));
                const num = booth && String(booth.booth_number).trim().toLowerCase();
                if (num) set.add(num);
            });
        } catch { }
        return set;
    }, [boothsWithGovernmentScheme, booths]);

    // Dedupe markers: prefer booth number, else quantized coordinates
    const boothMarkersGeoJSON = useMemo(() => {
        if (!boothGeoJSON?.features) return null;
        const seen = new Set();
        const features = [];

        const centroid = (geometry) => {
            try {
                if (geometry?.type === 'Polygon' && geometry.coordinates?.[0]) {
                    const coords = geometry.coordinates[0];
                    const lngs = coords.map((c) => c[0]);
                    const lats = coords.map((c) => c[1]);
                    return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
                }
                if (geometry?.type === 'MultiPolygon' && geometry.coordinates?.[0]?.[0]) {
                    const coords = geometry.coordinates[0][0];
                    const lngs = coords.map((c) => c[0]);
                    const lats = coords.map((c) => c[1]);
                    return [lngs.reduce((a, b) => a + b, 0) / lngs.length, lats.reduce((a, b) => a + b, 0) / lats.length];
                }
            } catch { }
            return [0, 0];
        };

        for (const f of boothGeoJSON.features) {
            const props = f.properties || {};
            const boothNoRaw = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
            const pt = centroid(f.geometry);
            const coordKey = `coord:${pt[0].toFixed(5)},${pt[1].toFixed(5)}`;
            const boothKey = boothNoRaw !== undefined && boothNoRaw !== null ? `booth:${String(boothNoRaw).trim().toLowerCase()}` : '';
            const key = boothKey || coordKey;
            if (seen.has(key)) continue;
            seen.add(key);
            const hasGovernmentScheme = boothKey
                ? schemeBoothNumberSet.has(boothKey.replace('booth:', ''))
                : schemeBoothNumberSet.has(String(boothNoRaw || '').trim().toLowerCase());
            features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pt }, properties: { ...props, hasGovernmentScheme, _dedupeKey: key } });
        }
        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, schemeBoothNumberSet]);

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all government schemes data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all government schemes data' };
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
            description: `You have access to government schemes data for ${entityName} ${levelName} and all areas within it`
        };
    };

    const accessScope = getUserAccessScope();

    // State -> Division
    useEffect(() => {
        if (tempFilters.state) {
            const filtered = divisions?.filter(division =>
                division.state_id?._id === tempFilters.state ||
                division.state_id === tempFilters.state
            ) || [];
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions(divisions || []);
        }
        // Clear dependent fields when state changes
        if (tempFilters.division) {
            setTempFilters(prev => ({
                ...prev,
                division: '',
                parliament: '',
                assembly: ''
            }));
        }
    }, [tempFilters.state, divisions]);

    // Division -> Parliament
    useEffect(() => {
        if (tempFilters.division) {
            const filtered = parliaments?.filter(parliament =>
                parliament.division_id?._id === tempFilters.division ||
                parliament.division_id === tempFilters.division
            ) || [];
            setFilteredParliaments(filtered);
        } else {
            setFilteredParliaments(parliaments || []);
        }
        // Clear dependent fields when division changes
        if (tempFilters.parliament) {
            setTempFilters(prev => ({
                ...prev,
                parliament: '',
                assembly: ''
            }));
        }
    }, [tempFilters.division, parliaments]);

    // Parliament -> Assembly
    useEffect(() => {
        if (tempFilters.parliament) {
            const filtered = assemblies?.filter(assembly =>
                assembly.parliament_id?._id === tempFilters.parliament ||
                assembly.parliament_id === tempFilters.parliament
            ) || [];
            setFilteredAssemblies(filtered);
        } else {
            setFilteredAssemblies(assemblies || []);
        }
        // Clear dependent fields when parliament changes
        if (tempFilters.assembly) {
            setTempFilters(prev => ({
                ...prev,
                assembly: ''
            }));
        }
    }, [tempFilters.parliament, assemblies]);

    // Assembly -> Block
    useEffect(() => {
        if (tempFilters.assembly) {
            const filtered = blocks?.filter(block =>
                block.assembly_id?._id === tempFilters.assembly ||
                block.assembly_id === tempFilters.assembly
            ) || [];
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks(blocks || []);
        }
    }, [tempFilters.assembly, blocks]);

    // Block -> Booth and Panchayat
    useEffect(() => {
        if (tempFilters.block) {
            const filteredBths = booths?.filter(booth =>
                booth.block_id?._id === tempFilters.block ||
                booth.block_id === tempFilters.block
            ) || [];
            setFilteredBooths(filteredBths);

            const filteredPanch = panchayats?.filter(panchayat =>
                panchayat.block_id?._id === tempFilters.block ||
                panchayat.block_id === tempFilters.block
            ) || [];
            setFilteredPanchayats(filteredPanch);
        } else {
            setFilteredBooths(booths || []);
            setFilteredPanchayats(panchayats || []);
        }
    }, [tempFilters.block, booths, panchayats]);

    // Panchayat -> Village
    useEffect(() => {
        if (tempFilters.panchayat) {
            const filtered = villages?.filter(village =>
                village.panchayat_id?._id === tempFilters.panchayat ||
                village.panchayat_id === tempFilters.panchayat
            ) || [];
            setFilteredVillages(filtered);
        } else {
            setFilteredVillages(villages || []);
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
        } else {
            setFilteredFalliyas(falliyas || []);
        }
    }, [tempFilters.village, falliyas]);

    const fetchAllGovernmentsForFilters = async () => {
        const query = {};
        // Scope by user hierarchy if present
        if (userHierarchy?.state?._id) query.state_id = userHierarchy.state._id;
        if (userHierarchy?.division?._id) query.division_id = userHierarchy.division._id;
        if (userHierarchy?.parliament?._id) query.parliament_id = userHierarchy.parliament._id;
        if (userHierarchy?.assembly?._id) query.assembly_id = userHierarchy.assembly._id;
        if (userHierarchy?.block?._id) query.block_id = userHierarchy.block._id;
        if (userHierarchy?.booth?._id) query.booth_id = userHierarchy.booth._id;
        // Apply current table filters so options reflect current dataset
        if (selectedState) query.state_id = selectedState;
        if (selectedDivision) query.division_id = selectedDivision;
        if (selectedParliament) query.parliament_id = selectedParliament;
        if (selectedAssembly) query.assembly_id = selectedAssembly;
        if (selectedBlock) query.block_id = selectedBlock;
        if (selectedBooth) query.booth_id = selectedBooth;
        if (selectedPanchayat) query.panchayat_id = selectedPanchayat;
        if (selectedVillage) query.village_id = selectedVillage;
        if (selectedFalliya) query.falliya_id = selectedFalliya;
        if (selectedType) query.type = selectedType;
        if (yearFilter) query.year = yearFilter;
        if (globalFilter) query.search = globalFilter;

        const data = await fetchAllDataForFilters('/governments', query);
        setAllGovernments(data);
    };

    const filterOptions = useFilterOptionsFromData(allGovernments, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
        booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
        panchayats: { field: 'panchayat_id', nameField: 'panchayat_name', parentField: 'block_id' },
        villages: { field: 'village_id', nameField: 'village_name', parentField: 'panchayat_id' },
        falliyas: { field: 'falliya_id', nameField: 'falliya_name', parentField: 'village_id' }
    });

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const [
                statesRes,
                divisionsRes,
                parliamentsRes,
                assembliesRes,
                blocksRes,
                boothsRes,
                panchayatsRes,
                villagesRes,
                falliyasRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/panchayats`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/villages`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/falliyas`, { headers })
            ]);

            const [
                statesData,
                divisionsData,
                parliamentsData,
                assembliesData,
                blocksData,
                boothsData,
                panchayatsData,
                villagesData,
                falliyasData
            ] = await Promise.all([
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
            if (blocksData?.success) setBlocks(blocksData.data);
            if (boothsData?.success) setBooths(boothsData.data);
            if (panchayatsData?.success) setPanchayats(panchayatsData.data);
            if (villagesData?.success) setVillages(villagesData.data);
            if (falliyasData?.success) setFalliyas(falliyasData.data);
            if (boothsData?.success) setBooths(boothsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Fetch booths with government schemes
    const fetchBoothsWithGovernmentScheme = async (selectedYear = yearFilter) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            let url = `${import.meta.env.VITE_APP_API_URL}/governments?all=true&limit=50000`;
            if (selectedYear) url += `&year=${selectedYear}`;
            const schemesRes = await fetch(url, { headers });
            const schemesJson = await schemesRes.json();
            if (schemesJson.success && Array.isArray(schemesJson.data)) {
                const boothIds = new Set();
                schemesJson.data.forEach(scheme => {
                    if (scheme.booth_id) {
                        const boothId = scheme.booth_id._id || scheme.booth_id;
                        boothIds.add(String(boothId));
                    }
                });
                setBoothsWithGovernmentScheme(boothIds);
                console.log('✅ Booths with government schemes updated (Year: ' + (selectedYear || 'All') + '):', boothIds.size);
            }
        } catch (err) {
            console.warn('Failed to fetch booths with schemes:', err);
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

            fetchBoothsWithGovernmentScheme(yearFilter);

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

    // Refresh scheme markers when year filter changes
    useEffect(() => {
        if (boothGeoJSON && yearFilter !== undefined) {
            fetchBoothsWithGovernmentScheme(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    // Fetch booth details and government schemes when a polygon is clicked
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

            // Get government schemes for this booth
            let governmentSchemes = [];
            if (booth && booth._id) {
                try {
                    let schemesUrl = `${import.meta.env.VITE_APP_API_URL}/governments?booth=${encodeURIComponent(booth._id)}&all=true`;
                    if (yearFilter) schemesUrl += `&year=${yearFilter}`;
                    const schemesRes = await fetch(schemesUrl, { headers });
                    const schemesJson = await schemesRes.json();
                    if (schemesJson.success && Array.isArray(schemesJson.data)) {
                        governmentSchemes = schemesJson.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch government schemes for booth:', e);
                }
            }

            // Also filter the table to this booth without full-page refresh
            if (booth && booth._id) {
                setSelectedBooth(booth._id);
                setTempFilters((prev) => ({
                    ...prev,
                    state: booth.state_id?._id || booth.state_id || prev.state,
                    division: booth.division_id?._id || booth.division_id || prev.division,
                    parliament: booth.parliament_id?._id || booth.parliament_id || prev.parliament,
                    assembly: booth.assembly_id?._id || booth.assembly_id || prev.assembly,
                    block: booth.block_id?._id || booth.block_id || prev.block,
                    booth: booth._id,
                }));
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }

            setDrawerData({
                loading: false,
                boothNo,
                details: {
                    booth,
                    governmentSchemes
                }
            });
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, governmentSchemes: [] }, error: e.message });
        }
    };

    // Assembly -> Blocks
    useEffect(() => {
        if (tempFilters.assembly) {
            const filtered = blocks?.filter(block => (block.assembly_id?._id || block.assembly_id) === tempFilters.assembly) || [];
            setFilteredBlocks(filtered);
            // clear dependent fields
            if (tempFilters.block && !filtered.find(b => b._id === tempFilters.block)) {
                setTempFilters(prev => ({ ...prev, block: '', booth: '' }));
            }
        } else {
            setFilteredBlocks([]);
            setTempFilters(prev => ({ ...prev, block: '', booth: '' }));
        }
    }, [tempFilters.assembly, blocks]);

    // Block -> Booths
    useEffect(() => {
        if (tempFilters.block) {
            const filtered = booths?.filter(booth => (booth.block_id?._id || booth.block_id) === tempFilters.block) || [];
            setFilteredBooths(filtered);
            if (tempFilters.booth && !filtered.find(b => b._id === tempFilters.booth)) {
                setTempFilters(prev => ({ ...prev, booth: '' }));
            }
        } else {
            setFilteredBooths([]);
            setTempFilters(prev => ({ ...prev, booth: '' }));
        }
    }, [tempFilters.block, booths]);

    const fetchGovernments = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            if (selectedState) query += `&state=${selectedState}`;
            if (selectedDivision) query += `&division=${selectedDivision}`;
            if (selectedParliament) query += `&parliament=${selectedParliament}`;
            if (selectedAssembly) query += `&assembly=${selectedAssembly}`;
            if (selectedBlock) query += `&block=${selectedBlock}`;
            if (selectedBooth) query += `&booth=${selectedBooth}`;
            if (selectedPanchayat) query += `&panchayat_id=${selectedPanchayat}`;
            if (selectedVillage) query += `&village_id=${selectedVillage}`;
            if (selectedFalliya) query += `&falliya_id=${selectedFalliya}`;
            if (selectedType) query += `&type=${selectedType}`;
            if (yearFilter) query += `&year=${yearFilter}`;

            // Hierarchy-based filtering is handled automatically by the backend
            // via getUserPermissionsAndHierarchy middleware, so no need to add filters here

            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/governments?page=${pageIndex + 1}&limit=${pageSize}${query}`, { headers });
            const json = await res.json();
            if (json.success) {
                setGovernments(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch governments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!referenceDataFetched.current) {
            fetchReferenceData();
            fetchAllGovernmentsForFilters();
            referenceDataFetched.current = true;
        }
    }, []);

    useEffect(() => {
        fetchGovernments(pagination.pageIndex, pagination.pageSize, globalFilter);
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
        selectedType,
        yearFilter
    ]);

    // Keep filter options in sync with current filters (globalFilter/yearFilter handled above)
    useEffect(() => {
        fetchAllGovernmentsForFilters();
    }, [
        selectedState,
        selectedDivision,
        selectedParliament,
        selectedAssembly,
        selectedBlock,
        selectedBooth,
        selectedPanchayat,
        selectedVillage,
        selectedFalliya,
        selectedType
    ]);

    const handleDeleteOpen = (id) => {
        setGovernmentDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
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
            header: 'Name',
            accessorKey: 'name',
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
            header: 'Type',
            accessorKey: 'type',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() === 'new' ? 'New' : 'Old'}
                    color={getValue() === 'new' ? 'success' : 'warning'}
                    size="small"
                />
            )
        },
        {
            header: 'Amount',
            accessorKey: 'amount',
            cell: ({ getValue }) => (
                <Typography fontWeight="500">
                    {formatCurrency(getValue())}
                </Typography>
            )
        },
        {
            header: 'Project Date',
            accessorKey: 'project_complete_date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
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
            cell: ({ getValue, row }) => {
                const val = getValue();
                // If populated object
                if (val && typeof val === 'object') return <Chip label={val.name || 'N/A'} color="default" size="small" variant="outlined" />;
                // If id string, lookup in local blocks
                const blockId = val || row.original.block_id;
                const found = blocks.find(b => (b._id === blockId) || (b._id === (blockId?._id))) || null;
                return <Chip label={found?.name || 'N/A'} color="default" size="small" variant="outlined" />;
            }
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue, row }) => {
                const val = getValue();
                if (val && typeof val === 'object') return <Chip label={val.name || val.booth_number || 'N/A'} color="success" size="small" variant="outlined" />;
                const boothId = val || row.original.booth_id;
                const found = booths.find(b => (b._id === boothId) || (b._id === (boothId?._id))) || null;
                return <Chip label={found?.name || found?.booth_number || 'N/A'} color="success" size="small" variant="outlined" />;
            }
        },
        {
            header: 'Panchayat',
            accessorKey: 'panchayat_id',
            cell: ({ getValue }) => {
                const val = getValue();
                return <Chip label={val?.panchayat_name || 'N/A'} color="info" size="small" variant="outlined" />;
            }
        },
        {
            header: 'Village',
            accessorKey: 'village_id',
            cell: ({ getValue }) => {
                const val = getValue();
                return <Chip label={val?.village_name || 'N/A'} color="success" size="small" variant="outlined" />;
            }
        },
        {
            header: 'Falliya',
            accessorKey: 'falliya_id',
            cell: ({ getValue }) => {
                const val = getValue();
                return <Chip label={val?.falliya_name || 'N/A'} color="warning" size="small" variant="outlined" />;
            }
        },
        {
            header: 'Year',
            accessorKey: 'year',
            cell: ({ getValue }) => {
                const val = getValue();
                return <Chip label={val || 'N/A'} color="primary" size="small" variant="outlined" />;
            }
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
                                navigate(`/Government-Schema/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedGovernment(row.original); setOpenModal(true); }}>
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
        data: governments,
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

    const fetchAllGovernmentsForCsv = async () => {
        try {
            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/governments?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all governments for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllGovernmentsForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            Type: item.type === 'new' ? 'New' : 'Old',
            Amount: item.amount,
            'Project Date': item.project_complete_date,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            Block: item.block_id?.name || '',
            Booth: item.booth_id?.name || '',
            Booth_Number: item.booth_id?.booth_number || '',

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

    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    name: 'PM Awas Yojana',
                    type: 'new',
                    amount: '50000',
                    project_complete_date: '2024-12-31',
                    state_no: '23',
                    division_code: '1',
                    parliament_no: '101',
                    AC_NO: '1',
                    block: 'Block Name',
                    booth_number: '1',
                    panchayat_name: 'Gram Panchayat',
                    village_name: 'Village Name',
                    falliya_name: 'Falliya Name',
                    year: '2024',
                    description: 'Housing scheme for rural areas'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'governments_import_template.xlsx');
        } catch (error) {
            console.error('Error generating template:', error);
            alert('Failed to download template. Please try again.');
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
                for (const k of Object.keys(r)) obj[k.trim().toLowerCase().replace(/\s+/g, '_')] = r[k];
                return {
                    name: obj.name ?? '',
                    type: obj.type ?? '',
                    amount: obj.amount ?? '',
                    project_complete_date: obj.project_complete_date ?? '',
                    state: obj.state_no ?? obj.state ?? '',
                    division_code: obj.division_code ?? obj.division ?? '',
                    parliament_no: obj.parliament_no ?? obj.parliament ?? '',
                    assembly_no: obj.ac_no ?? obj.assembly_no ?? obj.assembly ?? '',
                    block: obj.block ?? '',
                    booth_number: obj.booth_number ?? obj.booth ?? '',
                    panchayat_name: obj.panchayat_name ?? obj.panchayat ?? '',
                    village_name: obj.village_name ?? obj.village ?? '',
                    falliya_name: obj.falliya_name ?? obj.falliya ?? '',
                    year: obj.year ?? '',
                    description: obj.description ?? ''
                };
            });

            const filtered = rows.filter((r) => String(r.name).trim());

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/governments/import`, {
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
                fetchGovernments(pagination.pageIndex, pagination.pageSize, globalFilter);
            }
        } catch (error) {
            setImportResult({
                success: false,
                message: error?.message || String(error)
            });
        } finally {
            setImporting(false);
            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };

    // Render inline loader in table instead of replacing whole page

    return (
        <>
            <MainCard content={false}>
                {/* Mapbox Booth Polygons */}
                <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid item xs={12}>
                        <Typography variant="h5" sx={{ mb: 1 }}>Government Schemes Map</Typography>
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
                                {/* Government Scheme Markers Layer (deduped) */}
                                {boothMarkersGeoJSON && (
                                    <Source id="booth-markers" type="geojson" data={boothMarkersGeoJSON}>
                                        <Layer
                                            id="booth-government-markers"
                                            type="circle"
                                            paint={{
                                                'circle-radius': 6,
                                                'circle-color': [
                                                    'case',
                                                    ['get', 'hasGovernmentScheme'],
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
                                    <Typography variant="caption">Has Government Schemes</Typography>
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
                                    <Typography variant="caption">No Government Schemes</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${governments.length} governments...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="governments_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
                            Download Excel Template
                        </Button>
                        <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing}>
                            {importing ? 'Importing...' : 'Import Excel'}
                        </Button>
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedGovernment(null); setOpenModal(true); }}>
                            Add Government
                        </Button>
                    </Stack>
                    {importResult && (
                        <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)} sx={{ mt: 1, mx: 2 }}>
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {importResult.message || (importResult.success ? `Imported ${importResult.created ?? 0} / ${importResult.total ?? ''}` : 'Import result')}
                                </Typography>

                                {typeof importResult.created !== 'undefined' && typeof importResult.skipped !== 'undefined' && (
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {`Created: ${importResult.created} — Skipped: ${importResult.skipped}`}
                                    </Typography>
                                )}

                                {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="subtitle2">Errors (first {Math.min(10, importResult.errors.length)}):</Typography>
                                        <Box component="ul" sx={{ pl: 3, m: 0 }}>
                                            {importResult.errors.slice(0, 10).map((err, idx) => (
                                                <li key={idx}>
                                                    <Typography variant="body2">{`Row ${err.row}: ${err.message}`}</Typography>
                                                </li>
                                            ))}
                                            {importResult.errors.length > 10 && (
                                                <li>
                                                    <Typography variant="body2">{`...and ${importResult.errors.length - 10} more`}</Typography>
                                                </li>
                                            )}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        </Alert>
                    )}
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
                        <MenuItem value="new">New</MenuItem>
                        <MenuItem value="old">Old</MenuItem>
                    </TextField>

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
                        {filterOptions.states?.map((state) => (
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
                        {filterOptions.divisions?.filter(division => {
                            const stateId = division.state_id?._id || division.state_id;
                            return stateId === tempFilters.state;
                        }).map((division) => (
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
                        {filterOptions.parliaments?.filter(parliament => {
                            const divisionId = parliament.division_id?._id || parliament.division_id;
                            return divisionId === tempFilters.division;
                        }).map((parliament) => (
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
                        {filterOptions.assemblies?.filter(assembly => {
                            const parliamentId = assembly.parliament_id?._id || assembly.parliament_id;
                            return parliamentId === tempFilters.parliament;
                        }).map((assembly) => (
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
                        {filterOptions.blocks?.filter(block => {
                            const assemblyId = block.assembly_id?._id || block.assembly_id;
                            return assemblyId === tempFilters.assembly;
                        }).map((block) => (
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
                        {filterOptions.booths?.filter(booth => {
                            const blockId = booth.block_id?._id || booth.block_id;
                            return blockId === tempFilters.block;
                        }).map((booth) => (
                            <MenuItem key={booth._id} value={booth._id}>
                                {booth.name || booth.booth_number || booth._id}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Panchayat */}
                    <TextField
                        select
                        label="Panchayat"
                        value={tempFilters.panchayat}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, panchayat: e.target.value, village: '', falliya: '' }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.block}
                    >
                        <MenuItem value="">All Panchayats</MenuItem>
                        {filterOptions.panchayats?.filter(panchayat => {
                            const blockId = panchayat.block_id?._id || panchayat.block_id;
                            return blockId === tempFilters.block;
                        }).map((panchayat) => (
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
                            setTempFilters((prev) => ({ ...prev, village: e.target.value, falliya: '' }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.panchayat}
                    >
                        <MenuItem value="">All Villages</MenuItem>
                        {filterOptions.villages?.filter(village => {
                            const panchayatId = village.panchayat_id?._id || village.panchayat_id;
                            return panchayatId === tempFilters.panchayat;
                        }).map((village) => (
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
                        {filterOptions.falliyas?.filter(falliya => {
                            const villageId = falliya.village_id?._id || falliya.village_id;
                            return villageId === tempFilters.village;
                        }).map((falliya) => (
                            <MenuItem key={falliya._id} value={falliya._id}>
                                {falliya.falliya_name}
                            </MenuItem>
                        ))}
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
                            setSelectedType(tempFilters.type);
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Apply Filters
                    </Button>

                    <Button
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
                            setSelectedType('');
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Clear Filters
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
                                                        <GovernmentView data={row.original} blocks={blocks} booths={booths} />
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
                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view government schemes</Typography>
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
                                    <Typography variant="subtitle2">Government Schemes ({drawerData.details.governmentSchemes?.length || 0})</Typography>
                                    {drawerData.details.governmentSchemes?.length ? drawerData.details.governmentSchemes.slice(0, 10).map(scheme => (
                                        <Box key={scheme._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{scheme.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {scheme.type === 'new' ? 'New' : 'Old'} • {scheme.amount ? `₹${scheme.amount.toLocaleString()}` : 'N/A'}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={scheme.type === 'new' ? 'New' : 'Old'}
                                                    size="small"
                                                    color={scheme.type === 'new' ? 'success' : 'warning'}
                                                    sx={{ mr: 0.5 }}
                                                />
                                                {scheme.project_complete_date && (
                                                    <Chip
                                                        label={`Due: ${new Date(scheme.project_complete_date).toLocaleDateString()}`}
                                                        size="small"
                                                        variant="outlined"
                                                        color="info"
                                                    />
                                                )}
                                            </Box>
                                            {scheme.description && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    {scheme.description.replace(/<[^>]*>/g, '').slice(0, 100)}...
                                                </Typography>
                                            )}
                                        </Box>
                                    )) : (
                                        <Typography variant="body2">No government schemes found for this booth.</Typography>
                                    )}
                                </Paper>
                            </Stack>
                        )}
                    </Box>
                </Box>
            </Drawer>

            {/* Hidden Import Input */}
            <input
                type="file"
                accept=".xlsx,.xls,.csv"
                ref={importInputRef}
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            <GovernmentModal
                open={openModal}
                modalToggler={setOpenModal}
                government={selectedGovernment}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => {
                    fetchGovernments(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithGovernmentScheme(yearFilter);
                }}
            />

            <AlertGovernmentDelete
                id={governmentDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => {
                    fetchGovernments(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithGovernmentScheme(yearFilter);
                }}
            />
        </>
    );
}
