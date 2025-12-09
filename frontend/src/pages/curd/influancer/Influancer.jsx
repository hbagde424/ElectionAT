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

import { useCsvOtp } from 'hooks/useCsvOtp';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';
import { usePermissions } from 'contexts/PermissionContext';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import CloseIcon from '@mui/icons-material/Close';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

import InfluencerModal from './InfluancerModal';
import AlertInfluencerDelete from './AlertInfluancerDelete';
import InfluencerView from './InfluancerView';

export default function InfluencersListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();

    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [influencerDeleteId, setInfluencerDeleteId] = useState('');
    const [influencers, setInfluencers] = useState([]);
    const [allInfluencers, setAllInfluencers] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [panchayats, setPanchayats] = useState([]);
    const [villages, setVillages] = useState([]);
    const [falliyas, setFalliyas] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    // Import functionality states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    // Filter states
    const [selectedState, setSelectedState] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedParliament, setSelectedParliament] = useState('');
    const [selectedAssembly, setSelectedAssembly] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
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
        district: '',
        block: '',
        booth: '',
        panchayat: '',
        village: '',
        falliya: ''
    });

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
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
    const [boothsWithInfluencers, setBoothsWithInfluencers] = useState(new Set());
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Fetch all influencers for filters
    const fetchAllInfluencersForFilters = async () => {
        try {
            const hierarchyFilters = {};
            if (userHierarchy?.state) hierarchyFilters.state = userHierarchy.state._id;
            if (userHierarchy?.division) hierarchyFilters.division = userHierarchy.division._id;
            if (userHierarchy?.parliament) hierarchyFilters.parliament = userHierarchy.parliament._id;
            if (userHierarchy?.assembly) hierarchyFilters.assembly = userHierarchy.assembly._id;
            if (userHierarchy?.block) hierarchyFilters.block = userHierarchy.block._id;
            if (userHierarchy?.booth) hierarchyFilters.booth = userHierarchy.booth._id;
            if (userHierarchy?.panchayat) hierarchyFilters.panchayat_id = userHierarchy.panchayat._id;
            if (userHierarchy?.village) hierarchyFilters.village_id = userHierarchy.village._id;
            if (userHierarchy?.falliya) hierarchyFilters.falliya_id = userHierarchy.falliya._id;
            
            const data = await fetchAllDataForFilters('/influencers', hierarchyFilters);
            setAllInfluencers(data);
        } catch (error) {
            console.error('Error fetching all influencers for filters:', error);
        }
    };

    // Extract filter options from allInfluencers
    const filterOptions = useFilterOptionsFromData(allInfluencers, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        districts: { field: 'district_id', nameField: 'name', parentField: 'assembly_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
        booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
        panchayats: { field: 'panchayat_id', nameField: 'panchayat_name', parentField: 'block_id' },
        villages: { field: 'village_id', nameField: 'village_name', parentField: 'panchayat_id' },
        falliyas: { field: 'falliya_id', nameField: 'falliya_name', parentField: 'village_id' }
    });

    // Build booth-number set of influencers for marker color
    const influencerBoothNumberSet = useMemo(() => {
        const set = new Set();
        try {
            Array.from(boothsWithInfluencers || []).forEach((id) => {
                const booth = booths?.find((b) => String(b._id) === String(id));
                const num = booth && String(booth.booth_number).trim().toLowerCase();
                if (num) set.add(num);
            });
        } catch {}
        return set;
    }, [boothsWithInfluencers, booths]);

    // Deduped booth markers source
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
            } catch {}
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
            const hasInfluencers = boothKey
                ? influencerBoothNumberSet.has(boothKey.replace('booth:', ''))
                : influencerBoothNumberSet.has(String(boothNoRaw || '').trim().toLowerCase());
            features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: pt }, properties: { ...props, hasInfluencers, _dedupeKey: key } });
        }
        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, influencerBoothNumberSet]);

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'You have access to all influencers data' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all influencers data' };
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
            description: `You have access to influencers data for ${levelName}: ${levelValue}`
        };
    };

    const accessScope = getUserAccessScope();

    // State -> Division
    useEffect(() => {
        if (tempFilters.state) {
            const filtered = filterOptions.divisions?.filter(division =>
                (division.state_id?._id || division.state_id) === tempFilters.state
            ) || [];
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions(filterOptions.divisions || []);
        }
        // Clear dependent fields when state changes
        if (tempFilters.division) {
            setTempFilters(prev => ({
                ...prev,
                division: '',
                parliament: '',
                assembly: '',
                district: '',
                block: '',
                booth: ''
            }));
        }
    }, [tempFilters.state, filterOptions.divisions]);

    // Division -> Parliament
    useEffect(() => {
        if (tempFilters.division) {
            const filtered = filterOptions.parliaments?.filter(parliament =>
                (parliament.division_id?._id || parliament.division_id) === tempFilters.division
            ) || [];
            setFilteredParliaments(filtered);
        } else {
            setFilteredParliaments(filterOptions.parliaments || []);
        }
        // Clear dependent fields when division changes
        if (tempFilters.parliament) {
            setTempFilters(prev => ({
                ...prev,
                parliament: '',
                assembly: '',
                district: '',
                block: '',
                booth: ''
            }));
        }
    }, [tempFilters.division, filterOptions.parliaments]);

    // Parliament -> Assembly (District filtering removed as influencer model doesn't have district_id)
    useEffect(() => {
        if (tempFilters.parliament) {
            const filteredAssembliesList = filterOptions.assemblies?.filter(assembly =>
                (assembly.parliament_id?._id || assembly.parliament_id) === tempFilters.parliament
            ) || [];
            setFilteredAssemblies(filteredAssembliesList);

            // For influencers, districts are not directly linked, so show all districts for reference
            setFilteredDistricts(filterOptions.districts || []);
        } else {
            setFilteredAssemblies(filterOptions.assemblies || []);
            setFilteredDistricts(filterOptions.districts || []);
        }
        // Clear dependent fields when parliament changes
        if (tempFilters.assembly || tempFilters.district) {
            setTempFilters(prev => ({
                ...prev,
                assembly: '',
                district: '',
                block: '',
                booth: ''
            }));
        }
    }, [tempFilters.parliament, filterOptions.assemblies, filterOptions.districts]);

    // Assembly -> Block (district filtering is just for display, doesn't affect API)
    useEffect(() => {
        if (tempFilters.assembly) {
            const filtered = filterOptions.blocks?.filter(block =>
                (block.assembly_id?._id || block.assembly_id) === tempFilters.assembly
            ) || [];
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks(filterOptions.blocks || []);
        }
        // Clear dependent fields when assembly changes
        if (tempFilters.block) {
            setTempFilters(prev => ({
                ...prev,
                block: '',
                booth: ''
            }));
        }
    }, [tempFilters.assembly, filterOptions.blocks]);

    // Block -> Booth
    useEffect(() => {
        if (tempFilters.block) {
            const filtered = filterOptions.booths?.filter(booth =>
                (booth.block_id?._id || booth.block_id) === tempFilters.block
            ) || [];
            setFilteredBooths(filtered);

            // Filter panchayats based on selected block
            const filteredPanchs = filterOptions.panchayats?.filter(panchayat =>
                (panchayat.block_id?._id || panchayat.block_id) === tempFilters.block
            ) || [];
            setFilteredPanchayats(filteredPanchs);
        } else {
            setFilteredBooths(filterOptions.booths || []);
            setFilteredPanchayats([]);
        }
        // Clear booth when block changes
        if (tempFilters.booth) {
            setTempFilters(prev => ({
                ...prev,
                booth: '',
                panchayat: '',
                village: '',
                falliya: ''
            }));
        }
    }, [tempFilters.block, filterOptions.booths, filterOptions.panchayats]);

    // Panchayat -> Village
    useEffect(() => {
        if (tempFilters.panchayat) {
            const filtered = filterOptions.villages?.filter(village =>
                (village.panchayat_id?._id || village.panchayat_id) === tempFilters.panchayat
            ) || [];
            setFilteredVillages(filtered);
        } else {
            setFilteredVillages([]);
        }
    }, [tempFilters.panchayat, filterOptions.villages]);

    // Village -> Falliya
    useEffect(() => {
        if (tempFilters.village) {
            const filtered = filterOptions.falliyas?.filter(falliya =>
                (falliya.village_id?._id || falliya.village_id) === tempFilters.village
            ) || [];
            setFilteredFalliyas(filtered);
        } else {
            setFilteredFalliyas([]);
        }
    }, [tempFilters.village, filterOptions.falliyas]);

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const [
                statesRes,
                divisionsRes,
                parliamentsRes,
                assembliesRes,
                districtsRes,
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
                fetch(`${import.meta.env.VITE_APP_API_URL}/districts`, { headers }),
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
                districtsData,
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
                districtsRes.json(),
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
            if (districtsData.success) setDistricts(districtsData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);
            if (panchayatsData.success) setPanchayats(panchayatsData.data);
            if (villagesData.success) setVillages(villagesData.data);
            if (falliyasData.success) setFalliyas(falliyasData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Fetch booths with influencers
    const fetchBoothsWithInfluencers = async (selectedYear = yearFilter) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            let url = `${import.meta.env.VITE_APP_API_URL}/influencers?all=true&limit=50000`;
            if (selectedYear) url += `&year=${selectedYear}`;
            const influencersRes = await fetch(url, { headers });
            const influencersJson = await influencersRes.json();
            if (influencersJson.success && Array.isArray(influencersJson.data)) {
                const boothIds = new Set();
                influencersJson.data.forEach(influencer => {
                    if (influencer.booth_id) {
                        const boothId = influencer.booth_id._id || influencer.booth_id;
                        boothIds.add(String(boothId));
                    }
                });
                setBoothsWithInfluencers(boothIds);
                console.log('✅ Booths with influencers updated (Year: ' + (selectedYear || 'All') + '):', boothIds.size);
            }
        } catch (err) {
            console.warn('Failed to fetch booths with influencers:', err);
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

            fetchBoothsWithInfluencers(yearFilter);

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

    // Refresh influencer markers when year filter changes
    useEffect(() => {
        if (boothGeoJSON && yearFilter !== undefined) {
            fetchBoothsWithInfluencers(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    // Fetch booth details and influencers when a polygon is clicked
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

            // Get influencers for this booth
            let influencers = [];
            if (booth && booth._id) {
                try {
                    let influencersUrl = `${import.meta.env.VITE_APP_API_URL}/influencers?booth=${encodeURIComponent(booth._id)}&all=true`;
                    if (yearFilter) influencersUrl += `&year=${yearFilter}`;
                    const influencersRes = await fetch(influencersUrl, { headers });
                    const influencersJson = await influencersRes.json();
                    if (influencersJson.success && Array.isArray(influencersJson.data)) {
                        influencers = influencersJson.data;
                    }
                } catch (e) {
                    console.warn('Failed to fetch influencers for booth:', e);
                }
            }

            // Sync table filters to clicked booth (no full-page refresh)
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
                    influencers
                }
            });
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, influencers: [] }, error: e.message });
        }
    };

    const fetchInfluencers = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            if (selectedState) query += `&state=${selectedState}`;
            if (selectedDivision) query += `&division=${selectedDivision}`;
            if (selectedParliament) query += `&parliament=${selectedParliament}`;
            if (selectedAssembly) query += `&assembly=${selectedAssembly}`;
            // Note: district filter is not supported by influencer model - skipping district
            if (selectedBlock) query += `&block=${selectedBlock}`;
            if (selectedBooth) query += `&booth=${selectedBooth}`;
            if (selectedPanchayat) query += `&panchayat_id=${selectedPanchayat}`;
            if (selectedVillage) query += `&village_id=${selectedVillage}`;
            if (selectedFalliya) query += `&falliya_id=${selectedFalliya}`;
            if (yearFilter) query += `&year=${yearFilter}`;

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

            // When searching, fetch all results on first page
            let currentPage = pageIndex + 1;
            let currentLimit = pageSize;
            if (globalFilter) {
                currentPage = 1;
                currentLimit = 10000; // Get all results when searching
            }

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/influencers?page=${currentPage}&limit=${currentLimit}${query}`);
            const json = await res.json();
            if (json.success) {
                setInfluencers(json.data);
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
            console.error('Failed to fetch influencers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!referenceDataFetched.current) {
            fetchReferenceData();
            fetchAllInfluencersForFilters();
            referenceDataFetched.current = true;
        }
    }, []);

    useEffect(() => {
        fetchInfluencers(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [
        pagination.pageIndex,
        pagination.pageSize,
        globalFilter,
        selectedState,
        selectedDivision,
        selectedParliament,
        selectedAssembly,
        selectedDistrict,
        selectedBlock,
        selectedBooth,
        selectedPanchayat,
        selectedVillage,
        selectedFalliya,
        yearFilter
    ]);

    const handleDeleteOpen = (id) => {
        setInfluencerDeleteId(id);
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
            header: 'Contact Number',
            accessorKey: 'contact_number',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Alternate Number',
            accessorKey: 'alternate_number',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Email',
            accessorKey: 'email',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Full Address',
            accessorKey: 'full_address',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 250,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
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
                    color="primary"
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
                    color="primary"
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
                    color="info"
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
                    label={getValue()?.name || 'N/A'}
                    color="default"
                    size="small"
                    variant="outlined"
                />
            )
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
            header: 'Category',
            accessorKey: 'category',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    color="secondary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Caste',
            accessorKey: 'caste',
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
            header: 'Party',
            accessorKey: 'party_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() ? `${getValue().name} (${getValue().abbreviation})` : 'N/A'}
                    color="warning"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'Active'}
                    color={getValue() === 'Active' ? 'success' : 'error'}
                    size="small"
                    variant={getValue() === 'Active' ? 'filled' : 'outlined'}
                />
            )
        },
        {
            header: 'Social Media',
            accessorKey: 'social_media_links',
            cell: ({ getValue }) => {
                const links = getValue() || [];
                return (
                    <Typography>
                        {links.length > 0 ? `${links.length} link${links.length > 1 ? 's' : ''}` : 'None'}
                    </Typography>
                );
            }
        },
        {
            header: 'Created At',
            accessorKey: 'created_at',
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
                                navigate(`/Influancer/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedInfluencer(row.original); setOpenModal(true); }}>
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
        data: influencers,
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

    const fetchAllInfluencersForCsv = async () => {
        try {
            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/influencers?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all influencers for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    // OTP flow for CSV export
    const {
        otpDialogOpen,
        otpCode,
        setOtpCode,
        loading: otpLoading,
        maskedDest,
        error: otpError,
        requestOtp,
        verifyOtp,
        closeDialog
    } = useCsvOtp();

    const startCsvDownload = async () => {
        setCsvLoading(true);
        const allData = await fetchAllInfluencersForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            'Contact Number': item.contact_number,
            'Alternate Number': item.alternate_number || '',
            Email: item.email || '',
            'Full Address': item.full_address,
            Description: item.description ? item.description.replace(/<[^>]+>/g, '') : '',
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

    const handleDownloadCsv = async () => {
        await requestOtp(startCsvDownload);
    };

    const handleDownloadExcelTemplate = async () => {
        const headers = ['name', 'contact_number', 'email', 'full_address', 'category', 'caste', 'status', 'state', 'division_code', 'parliament_no', 'assembly_no', 'block', 'booth_number'];
        const exampleRow = ['John Doe', '9876543210', 'john@example.com', '123 Main St, City', 'Political Leader', 'General', 'Active', 'Maharashtra', '1', '5', '150', 'Block A', '1'];
        
        try {
            const XLSX = await import('xlsx');
            const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            XLSX.writeFile(wb, 'influencers_import_template.xlsx');
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
            a.download = 'influencers_import_template.csv';
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
                return {
                    name: obj.name ?? '',
                    contact_number: obj.contact_number ?? '',
                    email: obj.email ?? '',
                    full_address: obj.full_address ?? '',
                    category: obj.category ?? '',
                    caste: obj.caste ?? '',
                    status: obj.status ?? '',
                    state: obj.state ?? '',
                    division_code: obj.division_code ?? obj.division ?? '',
                    parliament_no: obj.parliament_no ?? obj.parliament ?? '',
                    assembly_no: obj.assembly_no ?? obj.assembly ?? '',
                    block: obj.block ?? '',
                    booth_number: obj.booth_number ?? obj.booth ?? ''
                };
            });

            const filtered = rows.filter(r => String(r.name).trim() && String(r.contact_number).trim());

            const token = localStorage.getItem('serviceToken');
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/influencers/import`, {
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
                fetchInfluencers();
            }
        } catch (err) {
            setImportResult({ success: false, message: err?.message || String(err) });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

    // Avoid replacing the full page on loading; show a loader inside the table body instead

    return (
        <>
            <MainCard content={false}>
                {/* Mapbox Booth Polygons */}
                <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid item xs={12}>
                        <Typography variant="h5" sx={{ mb: 1 }}>Influencers Map</Typography>
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
                                {/* Influencer Markers Layer (deduped) */}
                                {boothMarkersGeoJSON && (
                                    <Source id="booth-markers" type="geojson" data={boothMarkersGeoJSON}>
                                        <Layer
                                            id="booth-influencer-markers"
                                            type="circle"
                                            paint={{
                                                'circle-radius': 6,
                                                'circle-color': [
                                                    'case',
                                                    ['get', 'hasInfluencers'],
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
                                    <Typography variant="caption">Has Influencers</Typography>
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
                                    <Typography variant="caption">No Influencers</Typography>
                                </Stack>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${influencers.length} influencers...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="influencers_all.csv"
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
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedInfluencer(null); setOpenModal(true); }}>
                            Add Influencer
                        </Button>
                    </Stack>
                </Stack>
                {/* OTP Dialog for CSV export */}
                <Dialog open={otpDialogOpen} onClose={closeDialog}>
                    <DialogTitle>Enter OTP</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2">An OTP has been sent to {maskedDest}</Typography>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="OTP"
                            fullWidth
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                        />
                        {otpLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}><CircularProgress size={24} /></Box>}
                        {otpError && <Typography color="error" sx={{ mt: 1 }}>{otpError}</Typography>}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeDialog}>Cancel</Button>
                        <Button onClick={async () => { await verifyOtp(); }} disabled={otpLoading}>Verify</Button>
                    </DialogActions>
                </Dialog>

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

                    {/* District - Note: Influencer model doesn't support district filtering, kept for reference only */}
                    <TextField
                        select
                        label="District (Reference Only)"
                        value={tempFilters.district}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, district: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={true}
                        helperText="Not used for filtering"
                    >
                        <MenuItem value="">All Districts</MenuItem>
                        {filteredDistricts.map((district) => (
                            <MenuItem key={district._id} value={district._id}>
                                {district.name}
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

                    {/* Apply and Clear Buttons */}
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSelectedState(tempFilters.state);
                            setSelectedDivision(tempFilters.division);
                            setSelectedParliament(tempFilters.parliament);
                            setSelectedAssembly(tempFilters.assembly);
                            setSelectedDistrict(tempFilters.district);
                            setSelectedBlock(tempFilters.block);
                            setSelectedBooth(tempFilters.booth);
                            setSelectedPanchayat(tempFilters.panchayat);
                            setSelectedVillage(tempFilters.village);
                            setSelectedFalliya(tempFilters.falliya);
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
                                district: '',
                                block: '',
                                booth: '',
                                panchayat: '',
                                village: '',
                                falliya: ''
                            });
                            setSelectedState('');
                            setSelectedDivision('');
                            setSelectedParliament('');
                            setSelectedAssembly('');
                            setSelectedDistrict('');
                            setSelectedBlock('');
                            setSelectedBooth('');
                            setSelectedPanchayat('');
                            setSelectedVillage('');
                            setSelectedFalliya('');
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
                                                    <InfluencerView data={row.original} />
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
            </MainCard>

            {/* Right-side Drawer for clicked booth info */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: { xs: 340, sm: 480 }, p: 0, height: '100%' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                        <Box>
                            <Typography variant="h6">Booth Details</Typography>
                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view influencers</Typography>
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
                                    <Typography variant="subtitle2">Influencers ({drawerData.details.influencers?.length || 0})</Typography>
                                    {drawerData.details.influencers?.length ? drawerData.details.influencers.slice(0, 10).map(influencer => (
                                        <Box key={influencer._id} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{influencer.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {influencer.category} • {influencer.caste}
                                            </Typography>
                                            <Box sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={influencer.status || 'Active'}
                                                    size="small"
                                                    color={influencer.status === 'Active' ? 'success' : 'error'}
                                                    sx={{ mr: 0.5 }}
                                                />
                                                {influencer.party_id && (
                                                    <Chip
                                                        label={influencer.party_id.name}
                                                        size="small"
                                                        variant="outlined"
                                                        color="warning"
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                📞 {influencer.contact_number || 'N/A'} • 📧 {influencer.email || 'N/A'}
                                            </Typography>
                                            {influencer.full_address && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    📍 {influencer.full_address.slice(0, 80)}...
                                                </Typography>
                                            )}
                                        </Box>
                                    )) : (
                                        <Typography variant="body2">No influencers found for this booth.</Typography>
                                    )}
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

            <InfluencerModal
                open={openModal}
                modalToggler={setOpenModal}
                influencer={selectedInfluencer}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                districts={districts}
                blocks={blocks}
                booths={booths}
                refresh={() => {
                    fetchInfluencers(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithInfluencers(yearFilter);
                }}
            />

            <AlertInfluencerDelete
                id={influencerDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => {
                    fetchInfluencers(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithInfluencers(yearFilter);
                }}
            />
        </>
    );
}
