import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem, Alert, Drawer, Paper
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

import GenderModal from './genderModal';
import AlertGenderDelete from './AlertGenderDelete';
import GenderView from './GenderView';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { usePermissions } from 'contexts/PermissionContext';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

export default function GenderListPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { userHierarchy, getUserHighestLevel } = usePermissions();

    const [selectedGender, setSelectedGender] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [genderDeleteId, setGenderDeleteId] = useState('');
    const [genderList, setGenderList] = useState([]);
    const [allGenderData, setAllGenderData] = useState([]);
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
        falliya: ''
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

    // Map state (similar to Work Status)
    const [blockNumberInput, setBlockNumberInput] = useState('ALL');
    const [yearFilter, setYearFilter] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithGender, setBoothsWithGender] = useState(new Set());

    // Import states
    const csvLinkRef = useRef();
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    // Build a set of booth numbers that have gender entries (for marker color)
    const genderBoothNumberSet = useMemo(() => {
        const set = new Set();
        try {
            Array.from(boothsWithGender || []).forEach((id) => {
                const booth = booths?.find((b) => String(b._id) === String(id));
                const num = booth && String(booth.booth_number).trim().toLowerCase();
                if (num) set.add(num);
            });
        } catch { }
        return set;
    }, [boothsWithGender, booths]);

    // Dedupe markers: 1 dot per booth number; fallback to quantized centroid if booth number missing
    const boothMarkersGeoJSON = useMemo(() => {
        if (!boothGeoJSON?.features) return null;
        const seen = new Set();
        const features = [];

        const centroidFromGeom = (geometry) => {
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

        for (const feature of boothGeoJSON.features) {
            const props = feature.properties || {};
            const boothNoRaw = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth;
            const coordinates = centroidFromGeom(feature.geometry);
            const coordKey = `coord:${coordinates[0].toFixed(5)},${coordinates[1].toFixed(5)}`;
            const boothKeyNorm = boothNoRaw !== undefined && boothNoRaw !== null ? `booth:${String(boothNoRaw).trim().toLowerCase()}` : '';

            const key = boothKeyNorm || coordKey;
            if (seen.has(key)) continue;
            seen.add(key);

            const hasGender = boothKeyNorm
                ? genderBoothNumberSet.has(boothKeyNorm.replace('booth:', ''))
                : genderBoothNumberSet.has(String(boothNoRaw || '').trim().toLowerCase());

            features.push({
                type: 'Feature',
                geometry: { type: 'Point', coordinates },
                properties: { ...props, hasGender, _dedupeKey: key }
            });
        }

        return { type: 'FeatureCollection', features };
    }, [boothGeoJSON, genderBoothNumberSet]);

    // Helper to add Authorization header when token exists
    const getAuthHeaders = () => {
        try {
            const token = localStorage.serviceToken || localStorage.getItem('serviceToken');
            return token ? { Authorization: `Bearer ${token}` } : {};
        } catch (err) {
            return {};
        }
    };

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
    }, [tempFilters.division, parliaments]);

    // Parliament -> Assembly
    useEffect(() => {
        if (tempFilters.parliament) {
            const filtered = assemblies?.filter(assembly => {
                const matches = assembly.parliament_id?._id === tempFilters.parliament ||
                    assembly.parliament_id === tempFilters.parliament;
                return matches;
            }) || [];

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
            const filtered = blocks?.filter(block => {
                const matches = block.assembly_id?._id === tempFilters.assembly ||
                    block.assembly_id === tempFilters.assembly;
                return matches;
            }) || [];

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
            const filtered = booths?.filter(booth => {
                const matches = booth.block_id?._id === tempFilters.block ||
                    booth.block_id === tempFilters.block;
                return matches;
            }) || [];

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
        } else {
            setFilteredFalliyas([]);
        }
    }, [tempFilters.village, falliyas]);

    const fetchAllGenderDataForFilters = async () => {
        const hierarchyFilters = {};
        if (userHierarchy?.state) hierarchyFilters.state = userHierarchy.state._id || userHierarchy.state;
        if (userHierarchy?.division) hierarchyFilters.division = userHierarchy.division._id || userHierarchy.division;
        if (userHierarchy?.parliament) hierarchyFilters.parliament = userHierarchy.parliament._id || userHierarchy.parliament;
        if (userHierarchy?.assembly) hierarchyFilters.assembly = userHierarchy.assembly._id || userHierarchy.assembly;
        if (userHierarchy?.block) hierarchyFilters.block = userHierarchy.block._id || userHierarchy.block;
        if (userHierarchy?.booth) hierarchyFilters.booth = userHierarchy.booth._id || userHierarchy.booth;

        const data = await fetchAllDataForFilters('/gender', hierarchyFilters);
        setAllGenderData(data);
    };

    const fetchReferenceData = async () => {
        try {
            const headers = getAuthHeaders();
            const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, panchayatsRes, villagesRes, falliyasRes] = await Promise.all([
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

    const fetchGenderList = async (pageIndex, pageSize, globalFilter = '') => {
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
            if (yearFilter) query += `&year=${yearFilter}`;

            // Hierarchy-based filtering is handled automatically by the backend
            // via getUserPermissionsAndHierarchy middleware, so no need to add filters here

            const headers = getAuthHeaders();
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/genders?page=${pageIndex + 1}&limit=${pageSize}${query}`, { headers });
            const json = await res.json();
            if (json.success) {
                setGenderList(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch gender list:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch booths with gender data
    const fetchBoothsWithGender = async (selectedYear = yearFilter) => {
        try {
            const headers = getAuthHeaders();
            let url = `${import.meta.env.VITE_APP_API_URL}/genders?all=true&limit=50000`;
            if (selectedYear) url += `&year=${selectedYear}`;
            const genderRes = await fetch(url, { headers });
            const genderJson = await genderRes.json();
            if (genderJson.success && Array.isArray(genderJson.data)) {
                const boothIds = new Set();
                genderJson.data.forEach(gender => {
                    if (gender.booth_id) {
                        const boothId = gender.booth_id._id || gender.booth_id;
                        boothIds.add(String(boothId));
                    }
                });
                setBoothsWithGender(boothIds);
                console.log('✅ Booths with gender data updated (Year: ' + (selectedYear || 'All') + '):', boothIds.size);
            }
        } catch (err) {
            console.warn('Failed to fetch booths with gender:', err);
        }
    };

    // Map: Load booth polygons by block (robust, like Work Status)
    const loadBoothPolygonsByBlock = async (blockVal) => {
        if (!blockVal) {
            setMapError('Please select Block');
            return;
        }
        setMapError('');
        try {
            const headers = getAuthHeaders();

            fetchBoothsWithGender(yearFilter);

            if (blockVal === 'ALL') {
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
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block/${encodeURIComponent(blockVal)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons/block-number/${encodeURIComponent(blockVal)}`,
                `${import.meta.env.VITE_APP_API_URL}/booth-polygons?block=${encodeURIComponent(blockVal)}`
            ];

            let json = null;
            for (const url of candidates) {
                try {
                    const resp = await fetch(url, { headers });
                    if (!resp.ok) {
                        continue;
                    }
                    const j = await resp.json();
                    const features = j.features || (Array.isArray(j) ? j : (j.data || null));
                    if (features && Array.isArray(features) && features.length > 0) {
                        json = { type: 'FeatureCollection', features };
                        break;
                    }
                } catch (e) { }
            }

            if (!json) {
                setMapError(`No booth polygons found for block '${blockVal}'`);
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
            loadBoothPolygonsByBlock('ALL');
        }
    }, [blocks, mapboxToken]);

    // Refresh gender markers when year filter changes
    useEffect(() => {
        if (boothGeoJSON && yearFilter !== undefined) {
            fetchBoothsWithGender(yearFilter);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }
    }, [yearFilter]);

    // On polygon click, fetch Gender details for that booth
    const fetchBoothGenderDetails = async (boothNo) => {
        try {
            const headers = getAuthHeaders();
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;
            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo).trim();
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr)
                    || json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase())
                    || json.data.find(b => String(b.booth_number).trim().includes(boothNoStr) || boothNoStr.includes(String(b.booth_number).trim()));
            }

            let gender = null;
            if (booth && booth._id) {
                try {
                    let gUrl = `${import.meta.env.VITE_APP_API_URL}/genders/booth/${encodeURIComponent(booth._id)}`;
                    if (yearFilter) gUrl += `?year=${yearFilter}`;
                    const gRes = await fetch(gUrl, { headers });
                    const gJson = await gRes.json();
                    if (gJson?.success) {
                        if (Array.isArray(gJson.data) && gJson.data.length > 0) {
                            const g = gJson.data[0];
                            gender = { male: g.male || 0, female: g.female || 0, others: g.others || 0, total: (g.male || 0) + (g.female || 0) + (g.others || 0) };
                        } else if (gJson.data && typeof gJson.data === 'object') {
                            const g = gJson.data;
                            gender = { male: g.male || 0, female: g.female || 0, others: g.others || 0, total: (g.male || 0) + (g.female || 0) + (g.others || 0) };
                        }
                    }
                } catch (e) { }
            }

            if (!gender) {
                const male = Number(booth?.Male_Count ?? booth?.male ?? 0) || 0;
                const female = Number(booth?.Female_Count ?? booth?.female ?? 0) || 0;
                const others = Number(booth?.others_Count ?? booth?.others ?? 0) || 0;
                const total = Number(booth?.Total ?? booth?.total ?? (male + female + others)) || (male + female + others);
                gender = { male, female, others, total };
            }

            // Also sync table filters to the clicked booth to avoid manual refresh
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
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }

            setDrawerData({ loading: false, boothNo, details: { booth, gender } });
            setDrawerOpen(true);
        } catch (err) {
            console.error('Failed to fetch booth gender details:', err);
            setDrawerData({ loading: false, boothNo, details: null, error: err.message });
            setDrawerOpen(true);
        }
    };

    useEffect(() => {
        fetchGenderList(pagination.pageIndex, pagination.pageSize, globalFilter);
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
        yearFilter
    ]);

    // Fetch reference data only once when component mounts
    useEffect(() => {
        fetchReferenceData();
        fetchAllGenderDataForFilters();
    }, []);

    // Extract filter options from actual gender data
    const filterOptions = useFilterOptionsFromData(allGenderData, {
        states: { field: 'state_id', nameField: 'name' },
        divisions: { field: 'division_id', nameField: 'name', parentField: 'state_id' },
        parliaments: { field: 'parliament_id', nameField: 'name', parentField: 'division_id' },
        assemblies: { field: 'assembly_id', nameField: 'name', parentField: 'parliament_id' },
        blocks: { field: 'block_id', nameField: 'name', parentField: 'assembly_id' },
        booths: { field: 'booth_id', nameField: 'name', parentField: 'block_id' },
        panchayats: { field: 'panchayat_id', nameField: 'panchayat_name' },
        villages: { field: 'village_id', nameField: 'village_name', parentField: 'panchayat_id' },
        falliyas: { field: 'falliya_id', nameField: 'falliya_name', parentField: 'village_id' }
    });

    const handleDeleteOpen = (id) => {
        setGenderDeleteId(id);
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
            header: 'Male Count',
            accessorKey: 'male',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Female Count',
            accessorKey: 'female',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'others Count',
            accessorKey: 'others',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Total',
            cell: ({ row }) => (
                <Typography fontWeight="bold">
                    {row.original.male + row.original.female + row.original.others}
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
                    color="success"
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
                    color="error"
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
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'updated At',
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
                                navigate(`/Gender/${row.original._id}`);
                            }}
                        >
                            <Eye />
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedGender(row.original); setOpenModal(true); }}>
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
        data: genderList,
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

    const fetchAllGendersForCsv = async () => {
        try {
            const token = localStorage.serviceToken;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/genders?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all genders for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllGendersForCsv();
        setCsvData(allData.map(item => ({
            'Male Count': item.male,
            'Female Count': item.female,
            'others Count': item.others,
            'Total': item.male + item.female + item.others,
            'State': item.state_id?.name || '',
            'Division': item.division_id?.name || '',
            'Parliament': item.parliament_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Block': item.block_id?.name || '',
            'Booth': item.booth_id?.name || '',
            'Booth Number': item.booth_id?.booth_number || '',
            'Created By': item.created_by?.username || '',
            'Created At': item.created_at
        })));
        //  setCsvData(allData.map(item => ({


        //     'State': item.state?.name || '',
        //     'State ID': item.state?._id || '',
        //     'Division': item.division?.name || '',
        //     'Division ID': item.division?._id || '',
        //     'Parliament': item.parliament?.name || '',
        //     'Parliament ID': item.parliament?._id || '',
        //     'Assembly': item.assembly?.name || '',
        //     'Assembly ID': item.assembly?._id || '',
        //     'Block': item.block?.name || '',
        //     'Block ID': item.block?._id || '',
        //     'Booth': item.booth?.name || '',
        //     'Booth Number': item.booth?.booth_number || '',
        //     'Booth ID': item.booth?._id || '',
        //     'Created By': item.created_by?.username || '',
        //     'Created At': item.created_at
        // })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    const handleDownloadExcelTemplate = async () => {
        const XLSX = await import('xlsx');
        const headers = ['male', 'female', 'others', 'state', 'division_code', 'parliament_no', 'assembly_no', 'block', 'booth_number'];
        const exampleData = [
            ['500', '550', '10', 'Maharashtra', '1', '5', '150', 'Block A', '1']
        ];
        const worksheetData = [headers, ...exampleData];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Genders Template');
        XLSX.writeFile(workbook, 'genders_template.xlsx');
    };

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

            const normalizedData = jsonData.map((row) => {
                const normalized = {};
                Object.keys(row).forEach((key) => {
                    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
                    normalized[normalizedKey] = row[key];
                });
                return normalized;
            });

            const filteredRows = normalizedData.filter((r) => r.male || r.female || r.others);

            const token = localStorage.getItem('serviceToken');
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/genders/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify({ rows: filteredRows })
            });

            const result = await response.json();

            if (response.ok) {
                setImportResult({
                    success: true,
                    imported: result.imported || 0,
                    total: result.total || 0,
                    errors: result.errors || []
                });
                fetchGenders(pagination.pageIndex, pagination.pageSize);
            } else {
                setImportResult({
                    success: false,
                    message: result.message || 'Import failed'
                });
            }
        } catch (error) {
            setImportResult({
                success: false,
                message: error.message || 'Import failed'
            });
        } finally {
            setImporting(false);
            if (importInputRef.current) {
                importInputRef.current.value = '';
            }
        }
    };

    // Do not replace the entire page during loading; show a loading row in the table instead

    return (
        <>
            <MainCard content={false}>
                {/* Map section above the table */}
                <Box sx={{ p: 2, pb: 0 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Booth Map</Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <TextField
                            select
                            size="small"
                            label="Block"
                            value={blockNumberInput}
                            onChange={(e) => setBlockNumberInput(e.target.value)}
                            sx={{ minWidth: 260 }}
                        >
                            <MenuItem value="">Select Block</MenuItem>
                            <MenuItem value="ALL">All Blocks</MenuItem>
                            {blocks?.map((b) => (
                                <MenuItem key={b._id} value={b.name || b.block_number || b._id}>{b.block_number ? `#${b.block_number} — ${b.name}` : b.name}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Year"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All Years</MenuItem>
                            {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </TextField>
                        <Button variant="contained" size="small" onClick={() => loadBoothPolygonsByBlock(blockNumberInput)}>Load Polygons</Button>
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
                                    let features = e.features || [];
                                    if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                        const point = e.point || { x: e.originalEvent?.clientX, y: e.originalEvent?.clientY } || { x: e.x, y: e.y };
                                        if (point) {
                                            features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                        }
                                    }
                                    const boothFeature = features.find(f => f.layer && (f.layer.id === 'booth-fill' || f.layer.id === 'booth-source')) || features[0];
                                    if (boothFeature) {
                                        const props = boothFeature.properties || {};
                                        const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || (props.properties && (props.properties.BoothNo || props.properties.booth_number)) || '';
                                        setDrawerData({ loading: true, boothNo, details: null });
                                        setDrawerOpen(true);
                                        fetchBoothGenderDetails(boothNo);
                                    }
                                } catch (err) { console.warn('Map click handler error:', err); }
                            }}
                        >
                            <MapControl />
                            {boothGeoJSON && (
                                <Source id="booth-polygons" type="geojson" data={boothGeoJSON}>
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
                                        paint={{ 'text-color': '#000000', 'text-halo-color': '#ffffff', 'text-halo-width': 1 }}
                                    />
                                </Source>
                            )}
                            {/* Gender Markers Layer (deduped) */}
                            {boothMarkersGeoJSON && (
                                <Source id="booth-markers" type="geojson" data={boothMarkersGeoJSON}>
                                    <Layer
                                        id="booth-gender-markers"
                                        type="circle"
                                        paint={{
                                            'circle-radius': 6,
                                            'circle-color': [
                                                'case',
                                                ['get', 'hasGender'],
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
                                <Typography variant="caption">Has Gender Data</Typography>
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
                                <Typography variant="caption">No Gender Data</Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                </Box>

                {/* Access Scope Information */}
                {(() => {
                    const getUserAccessScope = () => {
                        if (!userHierarchy) {
                            return { level: 'All', description: 'You have access to all gender data' };
                        }
                        const highestLevel = getUserHighestLevel();
                        if (!highestLevel) {
                            return { level: 'All', description: 'You have access to all gender data' };
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
                            description: `You have access to gender data for ${entityName} ${levelName} and all areas within it`
                        };
                    };
                    const accessScope = getUserAccessScope();
                    return (
                        <Alert severity="info" sx={{ m: 2 }}>
                            <Typography variant="body2">
                                <strong>Data Access:</strong> {accessScope.description}
                            </Typography>
                        </Alert>
                    );
                })()}

                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${genderList.length} gender entries...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="gender_list_all.csv"
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
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedGender(null); setOpenModal(true); }}>
                            Add Gender Entry
                        </Button>
                    </Stack>
                    {importResult && (
                        <Alert
                            severity={importResult.success ? 'success' : 'error'}
                            onClose={() => setImportResult(null)}
                            sx={{ mt: 1 }}
                        >
                            {importResult.success
                                ? `Imported: ${importResult.imported} / ${importResult.total} | Errors: ${importResult.errors?.length || 0}`
                                : `Import failed: ${importResult.message}`}
                        </Alert>
                    )}
                </Stack>

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
                        {filterOptions.panchayats?.map((panchayat) => (
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
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Apply
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
                                falliya: ''
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
                                                        <GenderView data={row.original} />
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
                <Box sx={{ width: { xs: 340, sm: 420 }, p: 0, height: '100%' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
                        <Box>
                            <Typography variant="h6">Booth Details</Typography>
                            <Typography variant="caption" color="text.secondary">Click a booth polygon to view gender data</Typography>
                        </Box>
                        <Button size="small" onClick={() => setDrawerOpen(false)}>Close</Button>
                    </Box>

                    <Box sx={{ p: 2, overflowY: 'auto', height: 'calc(100% - 72px)' }}>
                        {!drawerData && <Typography variant="body2">Click a booth polygon to view details.</Typography>}
                        {drawerData?.loading && <Typography variant="body2">Loading...</Typography>}

                        {drawerData?.details && (
                            <Stack spacing={2}>
                                <Paper elevation={1} sx={{ p: 2, borderRadius: 1 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Basic</Typography>
                                    <Typography variant="body2"><strong>Name:</strong> {drawerData.details.booth?.name || 'N/A'}</Typography>
                                    <Typography variant="body2"><strong>Booth No:</strong> {drawerData.details.booth?.booth_number || drawerData.boothNo || 'N/A'}</Typography>
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
                                        <Typography variant="body2">No gender data for this booth.</Typography>
                                    )}
                                </Paper>

                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => {
                                            const boothId = drawerData?.details?.booth?._id;
                                            if (!boothId) return;
                                            setSelectedBooth(boothId);
                                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                                        }}
                                    >
                                        Filter by this Booth
                                    </Button>
                                </Stack>
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

            <GenderModal
                open={openModal}
                modalToggler={setOpenModal}
                genderEntry={selectedGender}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                booths={booths}
                refresh={() => {
                    fetchGenderList(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithGender(yearFilter);
                }}
            />

            <AlertGenderDelete
                id={genderDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => {
                    fetchGenderList(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithGender(yearFilter);
                }}
            />
        </>
    );
}
