import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem, Tooltip
    , Grid, Alert, Drawer, Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';

import BoothModal from './BoothModal';
import AlertBoothDelete from './AlertBoothDelete';
import BoothView from './BoothView';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

export default function BoothsListPage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const [selectedBooth, setSelectedBooth] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [boothDeleteId, setBoothDeleteId] = useState('');
    const [booths, setBooths] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [electionYears, setElectionYears] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState(() => {
        const saved = localStorage.getItem('boothPagination');
        return saved ? JSON.parse(saved) : { pageIndex: 0, pageSize: 10 };
    });
    // Track if currently searching
    const [isSearching, setIsSearching] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filters, setFilters] = useState({
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: ''
    });

    // Map state
    const [blockNumberInput, setBlockNumberInput] = useState('');
    const [boothGeoJSON, setBoothGeoJSON] = useState(null);
    const [mapTheme, setMapTheme] = useState('streets');
    const [mapError, setMapError] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState(null);
    const mapRef = useRef(null);
    const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

    const fetchReferenceData = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [
                statesRes,
                divisionsRes,
                parliamentsRes,
                assembliesRes,
                blocksRes,
                electionYearsRes
            ] = await Promise.all([
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, { headers }),
                fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`, { headers })
            ]);

            const [
                statesData,
                divisionsData,
                parliamentsData,
                assembliesData,
                blocksData,
                electionYearsData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json(),
                electionYearsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (electionYearsData.success) setElectionYears(electionYearsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
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

            // If user selected ALL blocks, fetch all polygons (large result)
            if (blockInput === 'ALL') {
                const apiUrl = import.meta.env.VITE_APP_API_URL || 'https://myhostmanager.co.in/backend/api';
                // Remove pagination and get all results by setting a very high limit
                const url = `${apiUrl}/booth-polygons?limit=50000&page=1`;

                const resp = await fetch(url, { headers });

                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const j = await resp.json();


                // Handle nested features structure - check if features[0] has nested features
                let features = j.features || j.data || [];
                if (features.length === 1 && features[0] && features[0].features && Array.isArray(features[0].features)) {
                    console.log('Found nested features structure, extracting:', features[0].features.length, 'features');
                    features = features[0].features;
                }

                console.log('Features count for ALL polygons:', features.length);
                if (!features || !Array.isArray(features) || features.length === 0) {
                    setMapError('No booth polygons found');
                    setBoothGeoJSON(null);
                    return;
                }
                const fc = { type: 'FeatureCollection', features };
                console.log('Setting boothGeoJSON with', features.length, 'features');
                console.log('First few features:', features.slice(0, 3).map(f => ({
                    type: f.type,
                    properties: f.properties?.BoothName || f.properties?.BoothNo || 'No name'
                })));
                setBoothGeoJSON(fc);
                // auto-fit handled below
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
                    console.log('Trying booth polygons URL:', url);
                    const resp = await fetch(url, { headers });
                    if (!resp.ok) {
                        console.warn('Non-ok response from', url, resp.status);
                        continue;
                    }
                    const j = await resp.json();
                    // Normalize response shape: either { type, features } or { features: [...] } or { success, features }
                    const features = j.features || (Array.isArray(j) ? j : (j.data || null));
                    if (features && Array.isArray(features) && features.length > 0) {
                        json = { type: 'FeatureCollection', features };
                        break;
                    }
                    // Some endpoints respond with empty features but valid structure; keep trying
                    console.log('No features from', url, 'response:', j.message || '(no message)');
                } catch (innerErr) {
                    console.warn('Error fetching booth polygons from candidate url:', innerErr);
                }
            }

            if (!json) {
                // No data found from any endpoint
                setMapError(`No booth polygons found for block '${blockInput}'`);
                setBoothGeoJSON(null);
                return;
            }

            // Normalize to a valid FeatureCollection
            const fc = { type: 'FeatureCollection', features: json.features };
            setBoothGeoJSON(fc);
            // Auto-fit on first render
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

    // Fetch booth details and recent visits when a polygon is clicked
    const fetchBoothDetailsByPolygon = async (boothNo) => {
        try {
            console.log(`🔍 Searching for booth with BoothNo: "${boothNo}"`);
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // Get all booths to find exact booth number match
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
            const json = await res.json();
            let booth = null;

            if (json.success && Array.isArray(json.data)) {
                const boothNoStr = String(boothNo).trim();
                console.log(`📊 Total booths available: ${json.data.length}`);
                console.log(`🔍 Looking for booth_number matching: "${boothNoStr}"`);

                // Try exact match first
                booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr);

                if (!booth) {
                    // Try case-insensitive match
                    booth = json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase());
                }

                if (!booth) {
                    // Try partial match if booth number is contained
                    booth = json.data.find(b => String(b.booth_number).trim().includes(boothNoStr) || boothNoStr.includes(String(b.booth_number).trim()));
                }

                if (booth) {
                    console.log(`✅ Found matching booth:`, {
                        id: booth._id,
                        booth_number: booth.booth_number,
                        name: booth.name,
                        block: booth.block_id?.name
                    });
                } else {
                    console.warn(`❌ No booth found for BoothNo: "${boothNoStr}"`);
                    console.log('Available booth numbers:', json.data.slice(0, 10).map(b => b.booth_number));
                }
            } else {
                console.error('Failed to fetch booths:', json);
            }
            // If booth found, fetch related resources in parallel
            let visits = [];
            let volunteers = [];
            let surveys = [];
            let infra = [];
            let partyPresence = [];
            let demographics = null;
            let votes = [];
            let electionStats = [];
            let workStatuses = [];
            let samitis = [];
            let gender = null;

            if (booth && booth._id) {
                console.log(`Fetching related data for booth ID: ${booth._id}, booth number: ${booth.booth_number}`);

                const fetchPromises = [
                    fetch(`${import.meta.env.VITE_APP_API_URL}/visits?booth=${encodeURIComponent(booth._id)}&all=true`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-volunteers/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-surveys/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-infrastructure?booth=${encodeURIComponent(booth._id)}&limit=100`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/party-presence/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-demographics/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    // Gender counts for this booth (preferred source)
                    fetch(`${import.meta.env.VITE_APP_API_URL}/genders/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-votes/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    fetch(`${import.meta.env.VITE_APP_API_URL}/booth-stats/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    // Work Status for this booth
                    fetch(`${import.meta.env.VITE_APP_API_URL}/work-status/booth/${encodeURIComponent(booth._id)}`, { headers }),
                    // Samiti records for this booth
                    fetch(`${import.meta.env.VITE_APP_API_URL}/samitis?booth_id=${encodeURIComponent(booth._id)}&limit=100`, { headers })
                ];

                // Note: keep order matching fetchPromises array above
                const [vRes, volRes, sRes, iRes, ppRes, dRes, genderRes, bvRes, esRes, wsRes, smRes] = await Promise.allSettled(fetchPromises);

                // Process visits
                if (vRes.status === 'fulfilled' && vRes.value.ok) {
                    try {
                        const vJson = await vRes.value.json();
                        if (vJson && vJson.success && Array.isArray(vJson.data)) {
                            visits = vJson.data;
                            console.log(`Found ${visits.length} visits for booth ${booth.booth_number}`);
                        }
                    } catch (e) { console.warn('Failed to parse visits response:', e); }
                } else {
                    console.warn('Visits fetch failed:', vRes.reason?.message || 'Unknown error');
                }

                // Process volunteers
                if (volRes.status === 'fulfilled' && volRes.value.ok) {
                    try {
                        const volJson = await volRes.value.json();
                        if (volJson && volJson.success && Array.isArray(volJson.data)) {
                            volunteers = volJson.data;
                            console.log(`Found ${volunteers.length} volunteers for booth ${booth.booth_number}`);
                        }
                    } catch (e) { console.warn('Failed to parse volunteers response:', e); }
                } else {
                    console.warn('Volunteers fetch failed:', volRes.reason?.message || 'Unknown error');
                }

                // Process surveys
                if (sRes.status === 'fulfilled' && sRes.value.ok) {
                    try {
                        const sJson = await sRes.value.json();
                        if (sJson && sJson.success && Array.isArray(sJson.data)) {
                            surveys = sJson.data;
                            console.log(`Found ${surveys.length} surveys for booth ${booth.booth_number}`);
                        }
                    } catch (e) { console.warn('Failed to parse surveys response:', e); }
                } else {
                    console.warn('Surveys fetch failed:', sRes.reason?.message || 'Unknown error');
                }

                // Process infrastructure
                if (iRes.status === 'fulfilled' && iRes.value.ok) {
                    try {
                        const iJson = await iRes.value.json();
                        if (iJson && iJson.success && Array.isArray(iJson.data)) {
                            infra = iJson.data;
                            console.log(`✅ Found ${infra.length} infrastructure records for booth ${booth.booth_number}`);
                        } else {
                            console.warn(`⚠️ Infrastructure API returned no data for booth ${booth.booth_number}:`, iJson);
                        }
                    } catch (e) {
                        console.warn('❌ Failed to parse infrastructure response:', e);
                    }
                } else {
                    console.warn(`❌ Infrastructure fetch failed for booth ${booth.booth_number}:`, {
                        status: iRes.status,
                        reason: iRes.reason?.message,
                        url: `${import.meta.env.VITE_APP_API_URL}/booth-infrastructure?booth=${encodeURIComponent(booth._id)}&limit=100`
                    });
                }

                // Process party presence
                if (ppRes.status === 'fulfilled' && ppRes.value.ok) {
                    try {
                        const ppJson = await ppRes.value.json();
                        if (ppJson && ppJson.success && Array.isArray(ppJson.data)) {
                            partyPresence = ppJson.data;
                            console.log(`✅ Found ${partyPresence.length} party presence records for booth ${booth.booth_number}`);
                        } else {
                            console.log(`ℹ️ No party presence data for booth ${booth.booth_number} (this is normal)`);
                        }
                    } catch (e) {
                        console.warn('❌ Failed to parse party presence response:', e);
                    }
                } else {
                    console.warn(`❌ Party presence fetch failed for booth ${booth.booth_number}:`, {
                        status: ppRes.status,
                        reason: ppRes.reason?.message,
                        url: `${import.meta.env.VITE_APP_API_URL}/party-presence/booth/${encodeURIComponent(booth._id)}`
                    });
                }

                // Process demographics
                if (dRes.status === 'fulfilled' && dRes.value.ok) {
                    try {
                        const dJson = await dRes.value.json();
                        if (dJson && dJson.success) {
                            demographics = dJson.data;
                            console.log(`Found demographics data for booth ${booth.booth_number}`);
                        }
                    } catch (e) { console.warn('Failed to parse demographics response:', e); }
                } else {
                    console.warn('Demographics fetch failed:', dRes.reason?.message || 'Unknown error');
                }

                // Process votes
                if (bvRes.status === 'fulfilled' && bvRes.value.ok) {
                    try {
                        const bvJson = await bvRes.value.json();
                        if (bvJson && bvJson.success && Array.isArray(bvJson.data)) {
                            votes = bvJson.data;
                            console.log(`Found ${votes.length} vote records for booth ${booth.booth_number}`);
                        }
                    } catch (e) { console.warn('Failed to parse votes response:', e); }
                } else {
                    console.warn('Votes fetch failed:', bvRes.reason?.message || 'Unknown error');
                }

                // Process election stats
                if (esRes.status === 'fulfilled' && esRes.value.ok) {
                    try {
                        const esJson = await esRes.value.json();
                        if (esJson && esJson.success && Array.isArray(esJson.data)) {
                            electionStats = esJson.data;
                            console.log(`Found ${electionStats.length} election stats for booth ${booth.booth_number}`);
                        }
                    } catch (e) { console.warn('Failed to parse election stats response:', e); }
                } else {
                    console.warn('Election stats fetch failed:', esRes.reason?.message || 'Unknown error');
                }

                // Process gender data (preferred)
                if (genderRes.status === 'fulfilled' && genderRes.value.ok) {
                    try {
                        const gJson = await genderRes.value.json();
                        // Endpoint may return { success, count, data: [...] } or { success, data: {...} }
                        if (gJson && gJson.success && Array.isArray(gJson.data) && gJson.data.length > 0) {
                            const g = gJson.data[0];
                            gender = { male: g.male || 0, female: g.female || 0, others: g.others || 0, total: (g.male || 0) + (g.female || 0) + (g.others || 0) };
                        } else if (gJson && gJson.success && typeof gJson.data === 'object') {
                            const g = gJson.data;
                            gender = { male: g.male || 0, female: g.female || 0, others: g.others || 0, total: (g.male || 0) + (g.female || 0) + (g.others || 0) };
                        }
                    } catch (e) { console.warn('Failed to parse gender response:', e); }
                } else {
                    console.warn('Gender fetch failed:', genderRes.reason?.message || 'Unknown error');
                }

                // Process work statuses
                if (wsRes.status === 'fulfilled' && wsRes.value.ok) {
                    try {
                        const wsJson = await wsRes.value.json();
                        if (wsJson && wsJson.success && Array.isArray(wsJson.data)) {
                            workStatuses = wsJson.data;
                            console.log(`Found ${workStatuses.length} work status records for booth ${booth.booth_number}`);
                        } else if (Array.isArray(wsJson)) {
                            workStatuses = wsJson;
                        }
                    } catch (e) { console.warn('Failed to parse work status response:', e); }
                } else {
                    console.warn('Work status fetch failed:', wsRes.reason?.message || 'Unknown error');
                }

                // Process samitis
                if (smRes.status === 'fulfilled' && smRes.value.ok) {
                    try {
                        const smJson = await smRes.value.json();
                        if (smJson && smJson.success && Array.isArray(smJson.data)) {
                            samitis = smJson.data;
                            console.log(`Found ${samitis.length} samiti records for booth ${booth.booth_number}`);
                        } else if (Array.isArray(smJson)) {
                            samitis = smJson;
                        }
                    } catch (e) { console.warn('Failed to parse samiti response:', e); }
                } else {
                    console.warn('Samiti fetch failed:', smRes.reason?.message || 'Unknown error');
                }

                // If genders API did not provide data, compute counts from booth fields (fallback)
                if (!gender || (gender.male === 0 && gender.female === 0 && gender.others === 0 && gender.total === 0)) {
                    const male = Number(booth?.Male_Count ?? booth?.male ?? 0) || 0;
                    const female = Number(booth?.Female_Count ?? booth?.female ?? 0) || 0;
                    const others = Number(booth?.others_Count ?? booth?.others ?? 0) || 0;
                    const total = Number(booth?.Total ?? booth?.total ?? (male + female + others)) || (male + female + others);
                    gender = { male, female, others, total };
                }
            }

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
                    workStatuses,
                    samitis,
                    gender
                }
            });
        } catch (e) {
            console.error('Failed to load booth details by polygon:', e);
            setDrawerData({ loading: false, boothNo, details: { booth: null, visits: [] }, error: e.message });
        }
    };

    // Fetch booths for table
    const fetchBooths = async (pageIndex, pageSize, globalFilter = '', currentFilters = filters) => {
        console.log('fetchBooths called with:', { pageIndex, pageSize, globalFilter, currentFilters });
        setLoading(true);
        try {
            const queryParams = [];
            let actualPageIndex = pageIndex;
            let actualPageSize = pageSize;

            // Determine if we're searching (only search, not filters)
            const isSearchingOnly = globalFilter && !currentFilters.state_id && !currentFilters.division_id &&
                !currentFilters.parliament_id && !currentFilters.assembly_id && !currentFilters.block_id;

            // If only searching (no filters), get all results to show them all at once
            if (isSearchingOnly) {
                actualPageIndex = 0;
                actualPageSize = 10000;
            }

            // Add search parameter
            if (globalFilter) {
                queryParams.push(`search=${encodeURIComponent(globalFilter)}`);
            }

            // Add filter parameters
            if (currentFilters.state_id) queryParams.push(`state=${encodeURIComponent(currentFilters.state_id)}`);
            if (currentFilters.division_id) queryParams.push(`division=${encodeURIComponent(currentFilters.division_id)}`);
            if (currentFilters.parliament_id) queryParams.push(`parliament=${encodeURIComponent(currentFilters.parliament_id)}`);
            if (currentFilters.assembly_id) queryParams.push(`assembly=${encodeURIComponent(currentFilters.assembly_id)}`);
            if (currentFilters.block_id) queryParams.push(`block=${encodeURIComponent(currentFilters.block_id)}`);

            const queryString = queryParams.length > 0 ? `&${queryParams.join('&')}` : '';
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            console.log('Token exists:', !!token);
            console.log('Headers:', headers);
            const apiUrl = import.meta.env.VITE_APP_API_URL || 'https://myhostmanager.co.in/backend/api';
            const url = `${apiUrl}/booths?page=${actualPageIndex + 1}&limit=${actualPageSize}${queryString}`;
            console.log('API URL:', apiUrl);
            console.log('Fetching booths from URL:', url);
            const res = await fetch(url, { headers });
            console.log('Response status:', res.status);
            const json = await res.json();
            console.log('Response data:', json);

            if (json.success) {
                console.log('Setting booths data:', json.data);
                setBooths(json.data);
                setIsSearching(isSearchingOnly);

                if (isSearchingOnly) {
                    // When only searching (no filters), show all results on one page
                    setPageCount(1);
                } else {
                    // Normal pagination or filtered pagination
                    setPageCount(json.pages || 1);
                }
            }
        } catch (error) {
            console.error('Failed to fetch booths:', error);
        } finally {
            console.log('Setting loading to false');
            setLoading(false);
        }
    };

    // Track previous globalFilter to detect when search is cleared
    const prevGlobalFilter = useRef('');

    // Fetch reference data only once on component mount
    useEffect(() => {
        fetchReferenceData();
        // Initial fetch of booths
        fetchBooths(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
    }, []);

    // Handle pagination changes (only when not searching/filtering)
    useEffect(() => {
        if (!isSearching) {
            fetchBooths(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
        }
    }, [pagination.pageIndex, pagination.pageSize]);

    // Handle search changes
    useEffect(() => {
        // Reset pagination when search changes
        if (prevGlobalFilter.current !== globalFilter) {
            if (globalFilter || prevGlobalFilter.current) {
                // Reset to first page when starting or ending search
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
            }
            // If search is cleared, reset isSearching state
            if (!globalFilter && prevGlobalFilter.current) {
                setIsSearching(false);
            }
            // Always fetch with current search and filters
            fetchBooths(0, pagination.pageSize, globalFilter, filters);
        }
        prevGlobalFilter.current = globalFilter;
    }, [globalFilter]);

    // Handle filter changes - filters should trigger immediate fetch
    // REMOVED: No automatic filter fetch, only on Apply button click

    // Save pagination state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('boothPagination', JSON.stringify(pagination));
    }, [pagination]);

    const handleDeleteOpen = (id) => {
        setBoothDeleteId(id);
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
            header: 'Booth Number',
            accessorKey: 'booth_number',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Election Year',
            accessorKey: 'election_year',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.year || 'N/A'}
                    color="success"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Full Address',
            accessorKey: 'full_address',
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
        // {
        //     header: 'Coordinates',
        //     accessorFn: (row) => `${row.latitude || 'N/A'}, ${row.longitude || 'N/A'}`,
        //     cell: ({ getValue }) => (
        //         <Typography>
        //             {getValue()}
        //         </Typography>
        //     )

        // },
        {
            header: 'Block',
            accessorKey: 'block_id',
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
        // {
        //     header: 'District',
        //     accessorKey: 'district_id',
        //     cell: ({ getValue }) => (
        //         <Chip
        //             label={getValue()?.name || 'N/A'}
        //             color="success"
        //             size="small"
        //             variant="outlined"
        //         />
        //     )
        // },
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
            header: 'Male Count',
            accessorKey: 'Male_Count',
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
            header: 'Female Count',
            accessorKey: 'Female_Count',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 0}
                    color="secondary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Others Count',
            accessorKey: 'others_Count',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 0}
                    color="warning"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Total Count',
            accessorKey: 'Total',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue() || 0}
                    color="success"
                    size="small"
                    variant="filled"
                />
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
        // {
        //     header: 'Updated At',
        //     accessorKey: 'updated_at',
        //     cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        // },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <Tooltip title="View Details">
                            <IconButton
                                color="secondary"
                                onClick={() => navigate(`/booth/${row.original._id}`)}
                            >
                                <Eye />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                            <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedBooth(row.original); setOpenModal(true); }}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                            <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                                <Trash />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: booths,
        columns,
        state: {
            pagination: isSearching ? { pageIndex: 0, pageSize: booths.length || 1 } : pagination,
            globalFilter
        },
        pageCount: isSearching ? 1 : pageCount,
        manualPagination: !isSearching,
        onPaginationChange: isSearching ? undefined : setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllBoothsForCsv = async () => {
        try {
            const token = localStorage.getItem('serviceToken');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true`, { headers });
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all booths for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllBoothsForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            'Booth Number': item.booth_number,
            'Full Address': item.full_address,
            Latitude: item.latitude,
            Longitude: item.longitude,
            'Male Count': item.Male_Count || 0,
            'Female Count': item.Female_Count || 0,
            'Others Count': item.others_Count || 0,
            'Total Count': item.Total || 0,
            Block: item.block_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            // District: item.district_id?.name || '',
            Division: item.division_id?.name || '',
            State: item.state_id?.name || '',
            Description: item.description ? item.description.replace(/<[^>]+>/g, '') : '',
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



    const handleFilterApply = () => {
        // Reset pagination to first page when applying filters
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
        // Manually fetch with filters
        fetchBooths(0, pagination.pageSize, globalFilter, filters);
    };

    const handleClearFilter = () => {
        const clearedFilters = {
            state_id: '',
            division_id: '',
            parliament_id: '',
            assembly_id: '',
            block_id: ''
        };
        setFilters(clearedFilters);
        // Reset searching state when clearing filters
        setIsSearching(false);
        // Reset pagination to first page and fetch data
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
        fetchBooths(0, pagination.pageSize, globalFilter, clearedFilters);
    };



    console.log('Component render - loading:', loading, 'booths:', booths?.length);

    if (loading) {
        return (
            <MainCard>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <Typography variant="h6">Loading booth data...</Typography>
                </Box>
            </MainCard>
        );
    }
    return (
        <>
            <MainCard content={false}>

                {/* Mapbox Booth Polygons */}
                <Grid container spacing={2} sx={{ p: 2 }}>
                    <Grid item xs={12}>
                        <Typography variant="h5" sx={{ mb: 1 }}>Booth Map</Typography>
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
                                        // Fallback: queryRenderedFeatures on map if e.features is empty
                                        if ((!features || features.length === 0) && map && map.queryRenderedFeatures) {
                                            const point = e.point || { x: e.x, y: e.y };
                                            if (point) {
                                                features = map.queryRenderedFeatures([point.x, point.y], { layers: ['booth-fill'] }) || [];
                                            }
                                        }

                                        const boothFeature = features.find(f => f.layer && f.layer.id === 'booth-fill') || features[0];
                                        if (boothFeature) {
                                            const props = boothFeature.properties || {};
                                            // try multiple property names and nested structures
                                            const boothNo = props.BoothNo || props.BoothNumber || props.boothNo || props.booth_number || props.id || props.booth || (props.properties && (props.properties.BoothNo || props.properties.booth_number));
                                            console.debug('Booth feature properties:', props, 'resolved boothNo:', boothNo);
                                            // Open drawer and start loading details
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
                                        {/* Symbol layer for booth labels (BoothNo and BoothName) */}
                                        <Layer
                                            id="booth-label"
                                            type="symbol"
                                            layout={{
                                                // Try various property names for booth number/name
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
                            </Map>
                        </MapContainerStyled>
                    </Grid>
                </Grid>

                {/* Search + Actions */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
                >
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={isSearching ? `Found ${booths.length} results...` : `Search booths...`}
                        style={{ minWidth: 250 }}
                    />

                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent="flex-end"
                    >
                        <CSVLink
                            data={csvData}
                            filename="booths_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button
                            variant="outlined"
                            onClick={handleDownloadCsv}
                            disabled={csvLoading}
                            size="small"
                        >
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                setSelectedBooth(null);
                                setOpenModal(true);
                            }}
                            size="small"
                        >
                            Add Booth
                        </Button>
                    </Stack>
                </Stack>

                {/* Filters */}
                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
                >
                    <TextField
                        select
                        label="State"
                        value={filters.state_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                state_id: e.target.value,
                                division_id: '',
                                parliament_id: '',
                                assembly_id: '',
                                block_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
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
                        value={filters.division_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                division_id: e.target.value,
                                parliament_id: '',
                                assembly_id: '',
                                block_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.state_id}
                    >
                        <MenuItem value="">All Divisions</MenuItem>
                        {divisions
                            .filter(d => !filters.state_id || d.state_id?._id === filters.state_id)
                            .map((division) => (
                                <MenuItem key={division._id} value={division._id}>
                                    {division.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <TextField
                        select
                        label="Parliament"
                        value={filters.parliament_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                parliament_id: e.target.value,
                                assembly_id: '',
                                block_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.division_id}
                    >
                        <MenuItem value="">All Parliaments</MenuItem>
                        {parliaments
                            .filter(p => !filters.division_id || p.division_id?._id === filters.division_id)
                            .map((parliament) => (
                                <MenuItem key={parliament._id} value={parliament._id}>
                                    {parliament.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <TextField
                        select
                        label="Assembly"
                        value={filters.assembly_id}
                        onChange={(e) => {
                            setFilters(prev => ({
                                ...prev,
                                assembly_id: e.target.value,
                                block_id: ''
                            }));
                        }}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.parliament_id}
                    >
                        <MenuItem value="">All Assemblies</MenuItem>
                        {assemblies
                            .filter(a => !filters.parliament_id || a.parliament_id?._id === filters.parliament_id)
                            .map((assembly) => (
                                <MenuItem key={assembly._id} value={assembly._id}>
                                    {assembly.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <TextField
                        select
                        label="Block"
                        value={filters.block_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, block_id: e.target.value }))}
                        sx={{ minWidth: 150 }}
                        size="small"
                        disabled={!filters.assembly_id}
                    >
                        <MenuItem value="">All Blocks</MenuItem>
                        {blocks
                            .filter(b => !filters.assembly_id || b.assembly_id?._id === filters.assembly_id)
                            .map((block) => (
                                <MenuItem key={block._id} value={block._id}>
                                    {block.name}
                                </MenuItem>
                            ))}
                    </TextField>

                    <Button variant="contained" onClick={handleFilterApply} size="small">
                        Apply
                    </Button>
                    <Button variant="outlined" onClick={handleClearFilter} size="small">
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
                                                    <BoothView data={row.original} />
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
                        {!isSearching && (
                            <TablePagination
                                setPageSize={(size) => setPagination((prev) => ({ ...prev, pageSize: size }))}
                                setPageIndex={(index) => setPagination((prev) => ({ ...prev, pageIndex: index }))}
                                getState={table.getState}
                                getPageCount={() => pageCount}
                            />
                        )}
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
                                    <Typography variant="subtitle2">Work Status ({drawerData.details.workStatuses?.length || 0})</Typography>
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
                                            <Typography variant="body2">• {sm.samiti_name || 'Samiti'} — {sm.village || ''}{sm.falia ? `, ${sm.falia}` : ''}</Typography>
                                            <Typography variant="caption" color="text.secondary">Count: {sm.count ?? 0}</Typography>
                                        </Box>
                                    )) : <Typography variant="body2">No samiti records.</Typography>}
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
                                        // election_year can be an object like { _id, year } or a plain value
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

            <BoothModal
                open={openModal}
                modalToggler={setOpenModal}
                booth={selectedBooth}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                electionYears={electionYears}
                refresh={() => fetchBooths(pagination.pageIndex, pagination.pageSize, globalFilter, filters)}
            />

            <AlertBoothDelete
                id={boothDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchBooths(pagination.pageIndex, pagination.pageSize, globalFilter, filters)}
            />
        </>
    );
}
