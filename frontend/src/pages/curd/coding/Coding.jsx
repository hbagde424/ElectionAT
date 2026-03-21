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
import { useCsvOtp } from 'hooks/useCsvOtp';
import { Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { useFilterOptionsFromData, fetchAllDataForFilters } from 'hooks/useFilterOptionsFromData';

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
    const [allCodingList, setAllCodingList] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [panchayats, setPanchayats] = useState([]);
    const [villages, setVillages] = useState([]);
    const [falliyas, setFalliyas] = useState([]);
    // Map state
    const [yearFilter, setYearFilter] = useState('');
    const [selectedMapYear, setSelectedMapYear] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapTheme, setMapTheme] = useState('streets');
    const [mapError, setMapError] = useState('');
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;
    // Drawer for polygon click
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const [boothsWithCoding, setBoothsWithCoding] = useState(new Set());
    const [selectedBoothForFilter, setSelectedBoothForFilter] = useState(null);

    // Filtered dropdown data
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredPanchayats, setFilteredPanchayats] = useState([]);
    const [filteredVillages, setFilteredVillages] = useState([]);
    const [filteredFalliyas, setFilteredFalliyas] = useState([]);

    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        block: '',
        panchayat: '',
        village: '',
        falliya: ''
    });

    const fetchAllCodingListForFilters = async () => {
        try {
            const query = {};
            // Hierarchy scoping (backend accepts plain names and converts internally)
            if (userHierarchy?.state) query.state = userHierarchy.state._id || userHierarchy.state;
            if (userHierarchy?.division) query.division = userHierarchy.division._id || userHierarchy.division;
            if (userHierarchy?.parliament) query.parliament = userHierarchy.parliament._id || userHierarchy.parliament;
            if (userHierarchy?.assembly) query.assembly = userHierarchy.assembly._id || userHierarchy.assembly;
            if (userHierarchy?.block) query.block = userHierarchy.block._id || userHierarchy.block;
            if (userHierarchy?.booth) query.booth = userHierarchy.booth._id || userHierarchy.booth;

            // Apply current filters/search/year (backend accepts plain names)
            if (filters?.state) query.state = filters.state;
            if (filters?.division) query.division = filters.division;
            if (filters?.parliament) query.parliament = filters.parliament;
            if (filters?.assembly) query.assembly = filters.assembly;
            if (filters?.block) query.block = filters.block;
            if (filters?.panchayat) query.panchayat = filters.panchayat;
            if (filters?.village) query.village = filters.village;
            if (filters?.falliya) query.falliya = filters.falliya;
            if (yearFilter) query.year = yearFilter;
            if (globalFilter) query.search = globalFilter;

            const data = await fetchAllDataForFilters('/codings', query);
            setAllCodingList(data);
        } catch (error) {
            console.error('Failed to fetch all coding list for filters:', error);
        }
    };

    // Build filter options from the same dataset used in the table
    const codingFilterSource = (allCodingList && allCodingList.length > 0) ? allCodingList : codingList;
    const filterOptions = useFilterOptionsFromData(codingFilterSource, {
        states: { field: 'state', nameField: 'name' },
        divisions: { field: 'division', nameField: 'name', parentField: 'state' },
        parliaments: { field: 'parliament', nameField: 'name', parentField: 'division' },
        assemblies: { field: 'assembly', nameField: 'name', parentField: 'parliament' },
        blocks: { field: 'block', nameField: 'name', parentField: 'assembly' },
        panchayats: { field: 'panchayat', nameField: 'panchayat_name', parentField: 'block' },
        villages: { field: 'village', nameField: 'village_name', parentField: 'panchayat' },
        falliyas: { field: 'falliya', nameField: 'falliya_name', parentField: 'village' }
    });

    const handleFilterChange = (field, value) => {

        let newFilters = { ...filters, [field]: value };

        // Clear child selections when parent changes
        if (field === 'state') {
            newFilters = { ...newFilters, division: '', parliament: '', assembly: '', block: '', panchayat: '', village: '', falliya: '' };
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
            setFilteredPanchayats([]);
            setFilteredVillages([]);
            setFilteredFalliyas([]);
        } else if (field === 'division') {
            newFilters = { ...newFilters, parliament: '', assembly: '', block: '', panchayat: '', village: '', falliya: '' };
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
            setFilteredPanchayats([]);
            setFilteredVillages([]);
            setFilteredFalliyas([]);
        } else if (field === 'parliament') {
            newFilters = { ...newFilters, assembly: '', block: '', panchayat: '', village: '', falliya: '' };
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
            setFilteredPanchayats([]);
            setFilteredVillages([]);
            setFilteredFalliyas([]);
        } else if (field === 'assembly') {
            newFilters = { ...newFilters, block: '', panchayat: '', village: '', falliya: '' };
            // Update filtered blocks based on selected assembly
            if (value && blocks.length > 0) {

                const assemblyBlocks = blocks.filter(block =>
                    block.assembly_id === value || block.assembly_id?._id === value
                );

                setFilteredBlocks(assemblyBlocks);
            } else {
                setFilteredBlocks([]);
            }
            setFilteredPanchayats([]);
            setFilteredVillages([]);
            setFilteredFalliyas([]);
        } else if (field === 'block') {
            newFilters = { ...newFilters, panchayat: '', village: '', falliya: '' };
            // Update filtered panchayats based on selected block
            if (value && panchayats.length > 0) {
                const blockPanchayats = panchayats.filter(panchayat =>
                    panchayat.block_id === value || panchayat.block_id?._id === value
                );
                setFilteredPanchayats(blockPanchayats);
            } else {
                setFilteredPanchayats([]);
            }
            setFilteredVillages([]);
            setFilteredFalliyas([]);
        } else if (field === 'panchayat') {
            newFilters = { ...newFilters, village: '', falliya: '' };
            // Update filtered villages based on selected panchayat
            if (value && villages.length > 0) {
                const panchayatVillages = villages.filter(village =>
                    village.panchayat_id === value || village.panchayat_id?._id === value
                );
                setFilteredVillages(panchayatVillages);
            } else {
                setFilteredVillages([]);
            }
            setFilteredFalliyas([]);
        } else if (field === 'village') {
            newFilters = { ...newFilters, falliya: '' };
            // Update filtered falliyas based on selected village
            if (value && falliyas.length > 0) {
                const villageFalliyas = falliyas.filter(falliya =>
                    falliya.village_id === value || falliya.village_id?._id === value
                );
                setFilteredFalliyas(villageFalliyas);
            } else {
                setFilteredFalliyas([]);
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
        // Reload polygons with applied filters
        loadBoothPolygons(filters);
    };

    const handleClearFilters = () => {
        setFilters({
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            panchayat: '',
            village: '',
            falliya: ''
        });
        setColumnFilters([]);

        // Clear all filtered dropdowns
        setFilteredDivisions([]);
        setFilteredParliaments([]);
        setFilteredAssemblies([]);
        setFilteredBlocks([]);
        setFilteredPanchayats([]);
        setFilteredVillages([]);
        
        // Reload polygons with cleared filters
        loadBoothPolygons({
            state: '',
            division: '',
            parliament: '',
            assembly: '',
            block: '',
            panchayat: '',
            village: '',
            falliya: ''
        });
        setFilteredFalliyas([]);
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

        const levelName = levelNames[highestLevel] || highestLevel;
        const entity = userHierarchy[highestLevel];
        const entityName = entity?.name || (typeof entity === 'object' && entity !== null ? (entity.displayName || entity.title || String(entity._id || entity.id || '')) : String(entity || 'Unknown'));

        return {
            level: levelName,
            entity: entityName,
            description: `You have access to coding data for ${entityName} ${levelName} and all areas within it`
        };
    };

    const accessScope = getUserAccessScope();

    const fetchReferenceData = async () => {
        try {
            const getAuthHeaders = () => {
                const token = localStorage.serviceToken;
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
            if (panchayatsData.success) setPanchayats(panchayatsData.data);
            if (villagesData.success) setVillages(villagesData.data);
            if (falliyasData.success) setFalliyas(falliyasData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    // Fetch booths with coding to mark them on the map (respects selected year)
    const fetchBoothsWithCoding = async (selectedYear = '') => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const yearQuery = selectedYear ? `&year=${encodeURIComponent(selectedYear)}` : '';
            const codingRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/codings?all=true&limit=50000${yearQuery}`, { headers });
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
                console.log('✅ Booths with coding updated (year:', selectedYear || 'ALL', '):', boothIds.size);
            }
        } catch (err) {
            console.warn('Failed to fetch booths with coding:', err);
        }
    };

    // Load booth polygons by block name/id or ALL
    // Load booth polygons filtered by user access (like booth CRUD page)
    const loadBoothPolygons = async (currentFilters = filters) => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            // Fetch all booths
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?limit=10000`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            
            if (!json.success || !Array.isArray(json.data)) {
                throw new Error('Invalid response format');
            }

            // Filter booths based on user hierarchy (most specific first)
            let boothsToUse = json.data;
            if (userHierarchy?.booth) {
                boothsToUse = json.data.filter(b => String(b._id) === String(userHierarchy.booth._id || userHierarchy.booth));
            } else if (userHierarchy?.block) {
                boothsToUse = json.data.filter(b => String(b.block_id?._id || b.block_id) === String(userHierarchy.block._id || userHierarchy.block));
            } else if (userHierarchy?.assembly) {
                boothsToUse = json.data.filter(b => String(b.assembly_id?._id || b.assembly_id) === String(userHierarchy.assembly._id || userHierarchy.assembly));
            } else if (userHierarchy?.parliament) {
                boothsToUse = json.data.filter(b => String(b.parliament_id?._id || b.parliament_id) === String(userHierarchy.parliament._id || userHierarchy.parliament));
            } else if (userHierarchy?.division) {
                boothsToUse = json.data.filter(b => String(b.division_id?._id || b.division_id) === String(userHierarchy.division._id || userHierarchy.division));
            } else if (userHierarchy?.state) {
                boothsToUse = json.data.filter(b => String(b.state_id?._id || b.state_id) === String(userHierarchy.state._id || userHierarchy.state));
            }

            console.log('📍 Filtered booths for user access:', boothsToUse.length, 'out of', json.data.length);

            // Fetch codings to get list of booths with data, applying filters
            let codingsUrl = `${import.meta.env.VITE_APP_API_URL}/codings?all=true&limit=50000`;
            if (currentFilters.state) codingsUrl += `&state=${encodeURIComponent(currentFilters.state)}`;
            if (currentFilters.division) codingsUrl += `&division=${encodeURIComponent(currentFilters.division)}`;
            if (currentFilters.parliament) codingsUrl += `&parliament=${encodeURIComponent(currentFilters.parliament)}`;
            if (currentFilters.assembly) codingsUrl += `&assembly=${encodeURIComponent(currentFilters.assembly)}`;
            if (currentFilters.block) codingsUrl += `&block=${encodeURIComponent(currentFilters.block)}`;
            if (currentFilters.panchayat) codingsUrl += `&panchayat=${encodeURIComponent(currentFilters.panchayat)}`;
            if (currentFilters.village) codingsUrl += `&village=${encodeURIComponent(currentFilters.village)}`;
            if (currentFilters.falliya) codingsUrl += `&falliya=${encodeURIComponent(currentFilters.falliya)}`;
            
            const codingsRes = await fetch(codingsUrl, { headers });
            const codingsJson = await codingsRes.json();
            const boothsWithCoding = new Set();
            if (codingsJson.success && Array.isArray(codingsJson.data)) {
                codingsJson.data.forEach(coding => {
                    if (coding.booth_id) {
                        boothsWithCoding.add(String(coding.booth_id._id || coding.booth_id));
                    }
                });
            }
            console.log('📊 Booths with coding data:', boothsWithCoding.size);

            // Extract polygons from booths that have polygon data AND have coding data
            const features = [];
            boothsToUse.forEach(booth => {
                // Only include booths that have coding data
                if (booth.polygon && boothsWithCoding.has(String(booth._id))) {
                    let featureToAdd = null;
                    
                    if (booth.polygon.type === 'Feature') {
                        featureToAdd = {
                            ...booth.polygon,
                            properties: {
                                booth_id: booth._id,
                                booth_number: booth.booth_number,
                                booth_name: booth.name
                            }
                        };
                    } else if (booth.polygon.type === 'FeatureCollection' && Array.isArray(booth.polygon.features)) {
                        booth.polygon.features.forEach(feat => {
                            features.push({
                                ...feat,
                                properties: {
                                    booth_id: booth._id,
                                    booth_number: booth.booth_number,
                                    booth_name: booth.name
                                }
                            });
                        });
                        return;
                    }
                    
                    if (featureToAdd) {
                        features.push(featureToAdd);
                    }
                }
            });

            if (!features.length) {
                setMapError('No booth polygons found with coding data for your access level');
                setBoothGeoJSON(null);
                return;
            }

            const fc = { type: 'FeatureCollection', features };
            console.log('✅ Loaded booth polygons with data:', features.length);
            setBoothGeoJSON(fc);
            setMapError('');

            // Fetch booths with coding for marker colors
            fetchBoothsWithCoding(yearFilter);
        } catch (e) {
            console.error('Failed to load booth polygons:', e);
            setMapError(`Failed to load booth polygons: ${e.message}`);
            setBoothGeoJSON(null);
        }
    };

    // Auto-load polygons on component mount and when user hierarchy changes
    useEffect(() => {
        if (mapboxToken) {
            loadBoothPolygons();
        }
    }, [mapboxToken, userHierarchy]);

    // Refresh booth coding markers when year changes (without forcing polygon reload)
    useEffect(() => {
        if (boothGeoJSON) {
            fetchBoothsWithCoding(yearFilter);
        }
        // Reset to first page in table to avoid empty pages on filter change
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [yearFilter]);

    // Fit bounds when boothGeoJSON changes
    useEffect(() => {
        if (!boothGeoJSON?.features?.length) return;

        const fitMapBounds = (attempt = 0) => {
            try {
                const map = mapRef.current && (typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current);
                
                if (!map || !map.getStyle) {
                    if (attempt < 10) {
                        console.log(`⏳ Map not ready for fitBounds, retrying... (attempt ${attempt + 1}/10)`);
                        setTimeout(() => fitMapBounds(attempt + 1), 200);
                    }
                    return;
                }

                const fc = boothGeoJSON;
                const coords = [];
                fc.features.forEach(f => {
                    const geom = f.geometry;
                    if (!geom) return;
                    const collect = (arr) => arr.forEach(pt => Array.isArray(pt[0]) ? collect(pt) : coords.push(pt));
                    if (geom.type === 'Polygon') collect(geom.coordinates);
                    if (geom.type === 'MultiPolygon') geom.coordinates.forEach(poly => collect(poly));
                });

                if (!coords.length) {
                    console.warn('⚠️ No coordinates found in features');
                    return;
                }

                const lons = coords.map(c => c[0]);
                const lats = coords.map(c => c[1]);
                const bounds = [
                    [Math.min(...lons), Math.min(...lats)],
                    [Math.max(...lons), Math.max(...lats)]
                ];

                console.log('🎯 Fitting map bounds:', bounds);
                map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 1000 });
            } catch (e) {
                console.warn('Auto-fit bounds error:', e);
                if (attempt < 10) {
                    setTimeout(() => fitMapBounds(attempt + 1), 200);
                }
            }
        };

        fitMapBounds();
    }, [boothGeoJSON]);

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

            // Fetch coding entries for the booth (respect selected year)
            let codingsForBooth = [];
            if (booth && booth._id) {
                try {
                    const apiUrl = `${import.meta.env.VITE_APP_API_URL}/codings?booth_id=${encodeURIComponent(booth._id)}&limit=100${yearFilter ? `&year=${encodeURIComponent(yearFilter)}` : ''}`;
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
            
            // Filter table by selected booth
            if (booth && booth._id) {
                setSelectedBoothForFilter(booth);
                // Apply booth filter to the table
                const newColumnFilters = columnFilters.filter(f => f.id !== 'booth');
                newColumnFilters.push({ id: 'booth', value: booth._id });
                setColumnFilters(newColumnFilters);
            }
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
            if (yearFilter) {
                query += `&year=${encodeURIComponent(yearFilter)}`;
            }

            // Add column filters to the query
            columnFilters.forEach(filter => {
                if (filter.value) {
                    // Use the filter field names as expected by the backend
                    query += `&${filter.id}=${encodeURIComponent(filter.value)}`;
                }
            });

            // Hierarchy-based filtering is handled automatically by the backend
            // via getUserPermissionsAndHierarchy middleware, so no need to add filters here

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

    // Fetch reference data only once on mount
    useEffect(() => {
        fetchReferenceData();
    }, []);

    useEffect(() => {
        fetchCodingList(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchAllCodingListForFilters();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter, columnFilters, yearFilter]);

    // Keep filter options in sync with current filters (only when filters object changes)
    useEffect(() => {
        fetchAllCodingListForFilters();
    }, [JSON.stringify(filters)]);

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
            const url = `${import.meta.env.VITE_APP_API_URL}/codings?all=true${yearFilter ? `&year=${encodeURIComponent(yearFilter)}` : ''}`;
            const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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

    // Excel import states
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const importInputRef = useRef();

    const startCsvDownload = async () => {
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

    const handleDownloadCsv = async () => {
        await requestOtp(startCsvDownload);
    };

    // Excel Template Download
    const handleDownloadExcelTemplate = async () => {
        try {
            const XLSX = await import('xlsx');
            const templateData = [
                {
                    name: 'Amit Sharma',
                    mobile: '9876543210',
                    email: 'amit@example.com',
                    facebook: 'amit.sharma',
                    twitter: '@amitsharma',
                    instagram: 'amit_sharma',
                    whatsapp_number: '9876543210',
                    coding_types: 'Type A,Type B',
                    state_no: '23',
                    division_code: 'GWL',
                    parliament_no: '101',
                    AC_NO: '150',
                    block: 'Block 1',
                    panchayat_name: 'Rampur Panchayat',
                    village_name: 'Rampur',
                    falliya_name: 'North Falliya'
                }
            ];
            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
            XLSX.writeFile(workbook, 'coding-template.xlsx');
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
            const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/codings/import`, {
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
                fetchCodingList(pagination.pageIndex, pagination.pageSize, globalFilter);
            }
        } catch (err) {
            setImportResult({ success: false, message: err.message || 'Import failed' });
        } finally {
            setImporting(false);
            if (importInputRef.current) importInputRef.current.value = '';
        }
    };

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
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Map Legend {yearFilter ? `(Year: ${yearFilter})` : '(All Years)'}</Typography>
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
                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                    <Typography variant="subtitle2">Coding Entries ({drawerData.details.codings?.length || 0})</Typography>
                                                    {selectedBoothForFilter && (
                                                        <Button 
                                                            size="small" 
                                                            variant="outlined" 
                                                            onClick={() => {
                                                                setSelectedBoothForFilter(null);
                                                                const newColumnFilters = columnFilters.filter(f => f.id !== 'booth');
                                                                setColumnFilters(newColumnFilters);
                                                            }}
                                                        >
                                                            Clear Table Filter
                                                        </Button>
                                                    )}
                                                </Stack>
                                                {selectedBoothForFilter && (
                                                    <Alert severity="info" sx={{ mb: 1 }}>
                                                        Table below is filtered to show only this booth's coding entries.
                                                    </Alert>
                                                )}
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

                    {/* Booth Filter Alert */}
                    {selectedBoothForFilter && (
                        <Alert 
                            severity="success" 
                            sx={{ m: 2 }}
                            action={
                                <Button 
                                    color="inherit" 
                                    size="small"
                                    onClick={() => {
                                        setSelectedBoothForFilter(null);
                                        const newColumnFilters = columnFilters.filter(f => f.id !== 'booth');
                                        setColumnFilters(newColumnFilters);
                                    }}
                                >
                                    Clear Filter
                                </Button>
                            }
                        >
                            <Typography variant="body2">
                                <strong>Filtered by Booth:</strong> {selectedBoothForFilter.name} (Booth #{selectedBoothForFilter.booth_number})
                            </Typography>
                        </Alert>
                    )}

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
                            <Dialog open={otpDialogOpen} onClose={() => !otpLoading && closeDialog()} maxWidth="xs" fullWidth>
                                <DialogTitle>Enter OTP to Download CSV</DialogTitle>
                                <DialogContent>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        OTP sent to: <strong>{maskedDest || '**********'}</strong>
                                    </Typography>
                                    <TextField
                                        autoFocus
                                        fullWidth
                                        label="OTP"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        disabled={otpLoading}
                                        inputProps={{ maxLength: 8 }}
                                    />
                                    {otpError && (
                                        <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                                            {otpError}
                                        </Typography>
                                    )}
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={() => closeDialog()} disabled={otpLoading}>Cancel</Button>
                                    <Button onClick={() => verifyOtp()} variant="contained" disabled={otpLoading || !otpCode.trim()}>
                                        {otpLoading ? <CircularProgress size={20} /> : 'Verify & Download'}
                                    </Button>
                                </DialogActions>
                            </Dialog>
                            <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                                {csvLoading ? "Preparing CSV..." : "Download All CSV"}
                            </Button>
                            <Button variant="outlined" onClick={handleDownloadExcelTemplate}>
                                Download Excel Template
                            </Button>
                            <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing}>
                                {importing ? 'Importing...' : 'Import Excel'}
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

                    {importResult && (
                        <Alert severity={importResult.success ? 'success' : 'error'} onClose={() => setImportResult(null)} sx={{ mx: 2 }}>
                            {importResult.message || (importResult.success ? 'Import successful' : 'Import failed')}
                            {importResult.imported && ` (${importResult.imported} imported)`}
                            {importResult.failed && ` (${importResult.failed} failed)`}
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
                            {filterOptions.states?.map((state) => (
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
                            {filterOptions.divisions?.filter(division => {
                                const stateId = division.state?._id || division.state_id?._id || division.state || division.state_id;
                                return String(stateId) === String(filters.state);
                            }).map((division) => (
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
                            {filterOptions.parliaments?.filter(parliament => {
                                const divisionId = parliament.division?._id || parliament.division_id?._id || parliament.division || parliament.division_id;
                                return String(divisionId) === String(filters.division);
                            }).map((parliament) => (
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
                            {filterOptions.assemblies?.filter(assembly => {
                                const parliamentId = assembly.parliament?._id || assembly.parliament_id?._id || assembly.parliament || assembly.parliament_id;
                                return String(parliamentId) === String(filters.parliament);
                            }).map((assembly) => (
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
                            {filterOptions.blocks?.filter(block => {
                                const assemblyId = block.assembly?._id || block.assembly_id?._id || block.assembly || block.assembly_id;
                                return String(assemblyId) === String(filters.assembly);
                            }).map((block) => (
                                <MenuItem key={block._id} value={block._id}>
                                    {block.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Panchayat"
                            value={filters.panchayat}
                            onChange={(e) => handleFilterChange("panchayat", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.block}
                        >
                            <MenuItem value="">All Panchayats</MenuItem>
                            {filterOptions.panchayats?.filter(panchayat => {
                                const blockId = panchayat.block?._id || panchayat.block_id?._id || panchayat.block || panchayat.block_id;
                                return String(blockId) === String(filters.block);
                            }).map((panchayat) => (
                                <MenuItem key={panchayat._id} value={panchayat._id}>
                                    {panchayat.panchayat_name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Village"
                            value={filters.village}
                            onChange={(e) => handleFilterChange("village", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.panchayat}
                        >
                            <MenuItem value="">All Villages</MenuItem>
                            {filterOptions.villages?.filter(village => {
                                const panchayatId = village.panchayat?._id || village.panchayat_id?._id || village.panchayat || village.panchayat_id;
                                return String(panchayatId) === String(filters.panchayat);
                            }).map((village) => (
                                <MenuItem key={village._id} value={village._id}>
                                    {village.village_name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Falliya"
                            value={filters.falliya}
                            onChange={(e) => handleFilterChange("falliya", e.target.value)}
                            sx={{ minWidth: 200 }}
                            size="small"
                            disabled={!filters.village}
                        >
                            <MenuItem value="">All Falliyas</MenuItem>
                            {filterOptions.falliyas?.filter(falliya => {
                                const villageId = falliya.village?._id || falliya.village_id?._id || falliya.village || falliya.village_id;
                                return String(villageId) === String(filters.village);
                            }).map((falliya) => (
                                <MenuItem key={falliya._id} value={falliya._id}>
                                    {falliya.falliya_name}
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
                        {loading ? (
                            <EmptyReactTable />
                        ) : (
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
                        )}
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
                refresh={() => {
                    fetchCodingList(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithCoding(yearFilter);
                }}
            />

            <AlertCodingDelete
                id={codingDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => {
                    fetchCodingList(pagination.pageIndex, pagination.pageSize);
                    fetchBoothsWithCoding(yearFilter);
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
