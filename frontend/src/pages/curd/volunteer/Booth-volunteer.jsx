import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Avatar, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, TextField, MenuItem, Alert, Drawer, Paper
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from 'contexts/PermissionContext';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import Map, { Source, Layer } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';

// third-party
import {
  getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
  useReactTable, flexRender
} from '@tanstack/react-table';
import { CSVLink } from 'react-csv';

// project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { useCsvOtp } from 'hooks/useCsvOtp';
import OtpDialog from 'components/OtpDialog';

// custom views and modals
import BoothVolunteerModal from 'pages/curd/volunteer/VolunteerModal';
import AlertBoothVolunteerDelete from 'pages/curd/volunteer/AlertVolunteerDelete';
import BoothVolunteerView from 'pages/curd/volunteer/VolunteerView';
import { Tooltip } from '@mui/material';

export default function BoothVolunteerListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();

  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [volunteerDeleteId, setVolunteerDeleteId] = useState('');
  const [volunteers, setVolunteers] = useState([]);
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
  
  // Individual filter states (like Events)
  const [selectedState, setSelectedState] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedParliament, setSelectedParliament] = useState('');
  const [selectedAssembly, setSelectedAssembly] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedBooth, setSelectedBooth] = useState('');
  
  const [filters, setFilters] = useState({
    state_id: '',
    division_id: '',
    parliament_id: '',
    assembly_id: '',
    block_id: '',
    booth_id: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const searchDebounceRef = useRef(null);

  // Map state (similar to Gender component)
  const [blockNumberInput, setBlockNumberInput] = useState('ALL');
  const [boothGeoJSON, setBoothGeoJSON] = useState(null);
  const [mapError, setMapError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState(null);
  const [boothsWithVolunteers, setBoothsWithVolunteers] = useState(new Set());
  const mapRef = useRef(null);
  const mapboxToken = import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN;

  // Year filter state
  const [yearFilter, setYearFilter] = useState('');

  // Temporary filter states
  const [tempFilters, setTempFilters] = useState({
    state: '',
    division: '',
    parliament: '',
    assembly: '',
    block: '',
    booth: ''
  });

  // Filtered arrays for cascading dropdowns
  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [filteredParliaments, setFilteredParliaments] = useState([]);
  const [filteredAssemblies, setFilteredAssemblies] = useState([]);
  const [filteredBlocks, setFilteredBlocks] = useState([]);
  const [filteredBooths, setFilteredBooths] = useState([]);

  // Previous values to detect changes
  const prevStateRef = useRef('');
  const prevDivisionRef = useRef('');
  const prevParliamentRef = useRef('');
  const prevAssemblyRef = useRef('');
  const prevBlockRef = useRef('');

  // Keep local input in sync when globalFilter changes from outside (clear, pagination, etc.)
  useEffect(() => {
    setSearchInput(globalFilter || '');
  }, [globalFilter]);

  // Build a set of booth numbers that have volunteer entries (for marker color)
  const volunteerBoothNumberSet = useMemo(() => {
    const set = new Set();
    try {
      Array.from(boothsWithVolunteers || []).forEach((id) => {
        const booth = booths?.find((b) => String(b._id) === String(id));
        const num = booth && String(booth.booth_number).trim().toLowerCase();
        if (num) set.add(num);
      });
    } catch {}
    return set;
  }, [boothsWithVolunteers, booths]);

  // Dedupe markers: 1 dot per booth number
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
      } catch {}
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

      const hasVolunteer = boothKeyNorm
        ? volunteerBoothNumberSet.has(boothKeyNorm.replace('booth:', ''))
        : volunteerBoothNumberSet.has(String(boothNoRaw || '').trim().toLowerCase());

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: { ...props, hasVolunteer, _dedupeKey: key }
      });
    }

    return { type: 'FeatureCollection', features };
  }, [boothGeoJSON, volunteerBoothNumberSet]);

  // Helper to add Authorization header when token exists
  const getAuthHeaders = () => {
    try {
      const token = localStorage.serviceToken || localStorage.getItem('serviceToken');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (err) {
      return {};
    }
  };

  // Cascading filter effects
  // State -> Division
  useEffect(() => {
    if (tempFilters.state) {
      const filtered = divisions?.filter(division => {
        const matches = division.state_id?._id === tempFilters.state ||
          division.state_id === tempFilters.state;
        return matches;
      }) || [];

      setFilteredDivisions(filtered);

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

      if (prevBlockRef.current !== tempFilters.block) {
        setTempFilters(prev => ({
          ...prev,
          booth: ''
        }));
      }
    } else {
      setFilteredBooths(booths || []);
    }
    prevBlockRef.current = tempFilters.block;
  }, [tempFilters.block, booths]);

  // Get user's access scope information
  const getUserAccessScope = () => {
    if (!userHierarchy) {
      return { level: 'All', description: 'You have access to all booth volunteer data' };
    }

    const highestLevel = getUserHighestLevel();
    if (!highestLevel) {
      return { level: 'All', description: 'You have access to all booth volunteer data' };
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
      description: `You have access to booth volunteer data for ${levelName}: ${levelValue}`
    };
  };

  const accessScope = getUserAccessScope();

  // Fetch booths with volunteer data
  const fetchBoothsWithVolunteers = async (selectedYear = yearFilter) => {
    try {
      const headers = getAuthHeaders();
      let url = `${import.meta.env.VITE_APP_API_URL}/booth-volunteers?all=true&limit=50000`;
      if (selectedYear) {
        url += `&year=${encodeURIComponent(selectedYear)}`;
      }
      const volunteerRes = await fetch(url, { headers });
      const volunteerJson = await volunteerRes.json();
      if (volunteerJson.success && Array.isArray(volunteerJson.data)) {
        const boothIds = new Set();
        volunteerJson.data.forEach(volunteer => {
          if (volunteer.booth) {
            const boothId = volunteer.booth._id || volunteer.booth;
            boothIds.add(String(boothId));
          }
        });
        setBoothsWithVolunteers(boothIds);
        console.log('✅ Booths with volunteers updated:', boothIds.size);
      }
    } catch (err) {
      console.error('Failed to fetch booths with volunteers:', err);
    }
  };

  const fetchVolunteers = async (pageIndex, pageSize, globalFilter = '', override = {}) => {
    setLoading(true);
    try {
      const effState = override.state_id ?? selectedState;
      const effDivision = override.division_id ?? selectedDivision;
      const effParliament = override.parliament_id ?? selectedParliament;
      const effAssembly = override.assembly_id ?? selectedAssembly;
      const effBlock = override.block_id ?? selectedBlock;
      const effBooth = override.booth_id ?? override.booth ?? selectedBooth;

      const token = localStorage.getItem('serviceToken');

      if (effBooth) {
        // Use the query endpoint with booth=<id>&all=true so backend runs the
        // same population logic as the paginated list (returns populated refs
        // like state/division/assembly/block). Do NOT add userHierarchy or
        // other higher-level filters when using booth filter.
        let url = `${import.meta.env.VITE_APP_API_URL}/booth-volunteers?booth=${encodeURIComponent(effBooth)}&all=true`;
        // include page/limit for consistent behavior (all=true usually returns all)
        url += `&page=${pageIndex + 1}&limit=${pageSize}`;
  const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  const json = await res.json();
        if (json.success) {
          setVolunteers(json.data || []);
          setPageCount(json.pages || 1);
        } else {
          console.error('fetchVolunteers booth query returned success:false', json);
          setVolunteers([]);
          setPageCount(0);
        }
      } else {
        let url = `${import.meta.env.VITE_APP_API_URL}/booth-volunteers?page=${pageIndex + 1}&limit=${pageSize}`;
        if (globalFilter) url += `&search=${encodeURIComponent(globalFilter)}`;
        if (effState) url += `&state_id=${effState}`;
        if (effDivision) url += `&division_id=${effDivision}`;
        if (effParliament) url += `&parliament_id=${effParliament}`;
        if (effAssembly) url += `&assembly_id=${effAssembly}`;
        if (effBlock) url += `&block_id=${effBlock}`;
        if (yearFilter) url += `&year=${encodeURIComponent(yearFilter)}`;

        // Add hierarchy-based filtering
        if (userHierarchy) {
          const highestLevel = getUserHighestLevel();
          if (highestLevel) {
            switch (highestLevel.level) {
              case 'state':
                url += `&state_id=${highestLevel.value}`;
                break;
              case 'division':
                url += `&division_id=${highestLevel.value}`;
                break;
              case 'parliament':
                url += `&parliament_id=${highestLevel.value}`;
                break;
              case 'assembly':
                url += `&assembly_id=${highestLevel.value}`;
                break;
              case 'block':
                url += `&block_id=${highestLevel.value}`;
                break;
              case 'booth':
                url += `&booth_id=${highestLevel.value}`;
                break;
            }
          }
        }

        const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
        const json = await res.json();
        if (json.success) {
          setVolunteers(json.data);
          setPageCount(json.pages);
        }
      }
    } catch (error) {
      console.error('Failed to fetch booth volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Map: Load booth polygons by block (similar to Gender component)
  const loadBoothPolygonsByBlock = async (blockVal) => {
    if (!blockVal) {
      setMapError('Please select Block');
      return;
    }
    setMapError('');
    try {
      const headers = getAuthHeaders();

      fetchBoothsWithVolunteers();

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
        } catch (e) {}
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

  // Auto-load ALL blocks map on component mount (only once)
  const mapLoadedRef = useRef(false);
  useEffect(() => {
    if (mapboxToken && blocks && blocks.length > 0 && !mapLoadedRef.current) {
      loadBoothPolygonsByBlock('ALL');
      mapLoadedRef.current = true;
    }
  }, [blocks, mapboxToken]);

  // TEMP: capture-phase document click listener to block and log navigation-causing clicks inside the map
  // This helps find & prevent the element triggering the full-page refresh. Remove after debugging.
  useEffect(() => {
    const docClickCapture = (e) => {
      try {
        const tgt = e.target || e.srcElement;
        if (!tgt) return;

        // Try to locate the actual map container DOM node (Mapbox uses different refs)
        let mapNode = null;
        if (mapRef.current) {
          try {
            // react-map-gl exposes getMap() which has getContainer()
            const maybeMap = typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current;
            mapNode = maybeMap && (maybeMap.getContainer ? maybeMap.getContainer() : maybeMap._container || maybeMap.getCanvasContainer && maybeMap.getCanvasContainer());
          } catch {}
          // fallback: if mapRef is a DOM node
          if (!mapNode && mapRef.current instanceof Element) mapNode = mapRef.current;
        }

        if (!mapNode) return;

        if (mapNode.contains(tgt)) {
          const anchor = tgt.closest && tgt.closest('a');
          const form = tgt.closest && tgt.closest('form');
          if (anchor || form) {
            try { e.preventDefault && e.preventDefault(); } catch {}
            try { e.stopPropagation && e.stopPropagation(); } catch {}
            // Log helpful debug info about the offending element
            const info = {
              tag: tgt.tagName,
              id: tgt.id || null,
              class: tgt.className || null,
              href: anchor && anchor.getAttribute ? anchor.getAttribute('href') : null,
              outer: (tgt.outerHTML || '').slice(0, 800)
            };
            console.error('Blocked navigation click inside map (capture):', info);
          }
        }
      } catch (err) {
        // ignore
      }
    };

    document.addEventListener('click', docClickCapture, true);
    return () => document.removeEventListener('click', docClickCapture, true);
  }, []);

  // TEMP: intercept pointerdown early (capture) to preempt navigation triggered
  // by anchors or forms inside the map. This runs before click and should stop
  // navigation-causing default behavior at the earliest phase.
  useEffect(() => {
    const onPointerDownCapture = (e) => {
      try {
        const tgt = e.target || e.srcElement;
        if (!tgt) return;

        let mapNode = null;
        if (mapRef.current) {
          try {
            const maybeMap = typeof mapRef.current.getMap === 'function' ? mapRef.current.getMap() : mapRef.current;
            mapNode = maybeMap && (maybeMap.getContainer ? maybeMap.getContainer() : maybeMap._container || maybeMap.getCanvasContainer && maybeMap.getCanvasContainer());
          } catch {}
          if (!mapNode && mapRef.current instanceof Element) mapNode = mapRef.current;
        }

        if (!mapNode) return;

        if (mapNode.contains(tgt)) {
          const anchor = tgt.closest && tgt.closest('a');
          const form = tgt.closest && tgt.closest('form');
          if (anchor || form) {
            try { e.preventDefault && e.preventDefault(); } catch {}
            try { e.stopPropagation && e.stopPropagation(); } catch {}
            // Minimal logging so we can later remove this block
            console.error('pointerdown blocked inside map for anchor/form', { tag: tgt.tagName, href: anchor && anchor.getAttribute ? anchor.getAttribute('href') : null });
          }
        }
      } catch (err) {}
    };

    document.addEventListener('pointerdown', onPointerDownCapture, true);
    return () => document.removeEventListener('pointerdown', onPointerDownCapture, true);
  }, []);

  // TEMP: record last click details (capture) and log them if the page visibility/unload changes
  useEffect(() => {
    const lastClick = { current: null };
    const clickRecorder = (e) => {
      try {
        const tgt = e.target || e.srcElement;
        if (!tgt) return;
        const path = e.composedPath ? e.composedPath() : (e.path || []);
        const stack = (new Error()).stack;
        const info = {
          time: new Date().toISOString(),
          tag: tgt.tagName,
          id: tgt.id || null,
          class: tgt.className || null,
          href: (tgt.closest && tgt.closest('a') && tgt.closest('a').getAttribute) ? tgt.closest('a').getAttribute('href') : null,
          outerHTML: (tgt.outerHTML || '').slice(0, 1000),
          path: Array.isArray(path) ? path.map(p => (p && p.tagName) ? `${p.tagName}${p.id ? `#${p.id}` : (p.className ? `.${p.className}` : '')}` : String(p)).slice(0, 12) : [],
          stack
        };
        lastClick.current = info;
        try { window.__lastClickDebug = info; } catch {}
      } catch (err) {}
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        try { console.error('visibilitychange:hidden — last click info:', lastClick.current); } catch {}
      }
    };

    const onBeforeUnload = (e) => {
      try { console.error('beforeunload — last click info:', lastClick.current); } catch {}
      // don't block unload here; we only log
    };

    const onHashChange = () => {
      try { console.error('hashchange — last click info:', lastClick.current); } catch {}
    };

    document.addEventListener('click', clickRecorder, true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('hashchange', onHashChange);

    return () => {
      document.removeEventListener('click', clickRecorder, true);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  // On polygon click, fetch Volunteer details for that booth
  const fetchBoothVolunteerDetails = async (boothNo) => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
      const json = await res.json();      let booth = null;
      if (json.success && Array.isArray(json.data)) {
  const boothNoStr = String(boothNo).trim();
        
        // Try exact match first
        booth = json.data.find(b => String(b.booth_number).trim() === boothNoStr);
        
        // Try case-insensitive match
        if (!booth) {
          booth = json.data.find(b => String(b.booth_number).trim().toLowerCase() === boothNoStr.toLowerCase());
        }
        
        // Try partial match
        if (!booth) {
          booth = json.data.find(b => String(b.booth_number).trim().includes(boothNoStr) || boothNoStr.includes(String(b.booth_number).trim()));
        }
        
        
      }

      let volunteersList = [];
      if (booth && booth._id) {
        try {
          const yearParam = yearFilter ? `&year=${encodeURIComponent(yearFilter)}` : '';
          
          // Try multiple API parameter variations
          const apiUrls = [
            `${import.meta.env.VITE_APP_API_URL}/booth-volunteers?booth_id=${encodeURIComponent(booth._id)}&all=true${yearParam}`,
            `${import.meta.env.VITE_APP_API_URL}/booth-volunteers?booth=${encodeURIComponent(booth._id)}&all=true${yearParam}`,
            `${import.meta.env.VITE_APP_API_URL}/booth-volunteers/booth/${encodeURIComponent(booth._id)}${yearParam ? `?${yearParam.substring(1)}` : ''}`
          ];

          for (const apiUrl of apiUrls) {
            try {
              const vRes = await fetch(apiUrl, { headers });
              const vJson = await vRes.json();
              
              if (vJson?.success && vJson.data) {
                if (Array.isArray(vJson.data)) {
                  volunteersList = vJson.data;
                } else if (typeof vJson.data === 'object') {
                  // If single object returned, wrap in array
                  volunteersList = [vJson.data];
                }
                
                if (volunteersList.length > 0) {
                  break; // Exit loop if we found volunteers
                }
              }
            } catch (e) {
              console.error('API URL failed:', apiUrl, e && e.message);
            }
          }
          
        } catch (e) {
          console.error('Error fetching volunteers:', e);
        }
      } else {
        // no booth found
      }

      // Sync table filters to the clicked booth (like Events does)
      if (booth && booth._id) {
        const stateId = booth.state_id?._id || booth.state_id || '';
        const divisionId = booth.division_id?._id || booth.division_id || '';
        const parliamentId = booth.parliament_id?._id || booth.parliament_id || '';
        const assemblyId = booth.assembly_id?._id || booth.assembly_id || '';
        const blockId = booth.block_id?._id || booth.block_id || '';
        const boothId = booth._id;

        // Update both selected filters and temp filters
        setSelectedState(stateId);
        setSelectedDivision(divisionId);
        setSelectedParliament(parliamentId);
        setSelectedAssembly(assemblyId);
        setSelectedBlock(blockId);
        setSelectedBooth(boothId);
        
        setTempFilters({
          state: stateId,
          division: divisionId,
          parliament: parliamentId,
          assembly: assemblyId,
          block: blockId,
          booth: boothId
        });
        
        // Reset to first page so user sees results immediately
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
      }

      setDrawerData({ loading: false, boothNo, details: { booth, volunteers: volunteersList } });
      setDrawerOpen(true);
    } catch (err) {
      console.error('Failed to fetch booth volunteer details:', err);
      setDrawerData({ loading: false, boothNo, details: null, error: err.message });
      setDrawerOpen(true);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const token = localStorage.getItem('serviceToken');
      const fetchOpts = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      const [statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes, boothsRes, partiesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_APP_API_URL}/states`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, fetchOpts),
        // Request all parties so dropdowns can show the complete list
        fetch(`${import.meta.env.VITE_APP_API_URL}/parties?all=true`, fetchOpts)
      ]);

      const [usersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_APP_API_URL}/users`, fetchOpts)
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

  useEffect(() => {
    fetchVolunteers(pagination.pageIndex, pagination.pageSize, globalFilter);
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
    yearFilter
  ]);

  // Refresh map markers when year filter changes
  useEffect(() => {
    if (boothGeoJSON && yearFilter !== undefined) {
      fetchBoothsWithVolunteers(yearFilter);
      setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }
  }, [yearFilter]);

  // Fetch reference data only once when component mounts
  useEffect(() => {
    fetchReferenceData();
  }, []);

  const handleDeleteOpen = (id) => {
    setVolunteerDeleteId(id);
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
          maxWidth: 150,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {getValue()}
        </Typography>
      )
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: ({ getValue }) => <Typography>{getValue()}</Typography>
    },
    {
      header: 'Email',
      accessorKey: 'email',
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
      header: 'Role',
      accessorKey: 'role',
      cell: ({ getValue }) => (
        <Chip
          label={getValue() || 'N/A'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Area Responsibility',
      accessorKey: 'area_responsibility',
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
      header: 'Post',
      accessorKey: 'post',
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
      header: 'Activity Level',
      accessorKey: 'activity_level',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()}
          color={
            getValue() === 'High' ? 'success' :
              getValue() === 'Medium' ? 'warning' : 'error'
          }
          size="small"
        />
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
          color="primary"
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
          label={getValue() ? `${getValue().name} (${getValue().booth_number})` : 'N/A'}
          color="success"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Party',
      accessorKey: 'party',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name || 'N/A'} color="primary" size="small" /> :
          <Typography variant="caption">No party</Typography>
      )
    },
    {
      header: 'Remarks',
      accessorKey: 'remarks',
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
      header: 'Documents',
      accessorKey: 'documents',
      cell: ({ getValue }) => (
        <Chip
          label={getValue() ? `${getValue().length} files` : '0 files'}
          color={getValue() && getValue().length > 0 ? 'primary' : 'default'}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      header: 'Created By',
      accessorKey: 'created_by',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ width: 24, height: 24 }}>
            <User size={16} />
          </Avatar>
          <Typography>{getValue()?.username || 'Unknown'}</Typography>
        </Stack>
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
        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <Tooltip title="View details">
              <IconButton
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/booth-volunteer/${row.original._id}`);
                }}
              >
                <Eye />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVolunteer(row.original);
                  setOpenModal(true);
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteOpen(row.original._id);
                }}
              >
                <Trash />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      }
    }
  ], [theme]);

  const table = useReactTable({
    data: volunteers,
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

  // Helper to fetch all volunteers for CSV
  const fetchAllVolunteersForCsv = async () => {
    try {
      const token = localStorage.getItem('serviceToken');
      let url = `${import.meta.env.VITE_APP_API_URL}/booth-volunteers?all=true`;
      if (yearFilter) {
        url += `&year=${encodeURIComponent(yearFilter)}`;
      }
      const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const json = await res.json();
      if (json.success) {
        return json.data;
      }
    } catch (error) {
      console.error('Failed to fetch all volunteers for CSV:', error);
    }
    return [];
  };

  const [csvData, setCsvData] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const csvLinkRef = useRef();

  // OTP for CSV download
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

  const handleDownloadCsv = async () => {
    // Request OTP first
    requestOtp(async () => {
      // This callback runs after OTP is verified
      setCsvLoading(true);
      const allData = await fetchAllVolunteersForCsv();
      setCsvData(allData.map(item => ({
        Name: item.name,
        Phone: item.phone,
        Email: item.email || '',
        Role: item.role || '',
        'Area Responsibility': item.area_responsibility || '',
        Post: item.post || '',
        'Activity Level': item.activity_level,
        State: item.state?.name || '',
        Division: item.division?.name || '',
        Parliament: item.parliament?.name || '',
        Assembly: item.assembly?.name || '',
        Block: item.block?.name || '',
        Booth: item.booth ? `${item.booth.name} (${item.booth.booth_number})` : '',
        Party: item.party?.name || '',
        Remarks: item.remarks || '',
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
    });
  };

  if (loading) return <EmptyReactTable />;

  const handleSearch = () => {
    const searchTerm = searchInput.trim();
    setGlobalFilter(searchTerm);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const handleFilterApply = () => {
    fetchVolunteers(pagination.pageIndex, pagination.pageSize, globalFilter, filters);
  };

  return (
    <>
      <MainCard content={false}>
        {/* Map section above the table */}
        <Box sx={{ p: 2, pb: 0 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Booth Map</Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Block"
              value={blockNumberInput}
              onChange={(e) => {
                try { e.preventDefault && e.preventDefault(); } catch {};
                try { e.stopPropagation && e.stopPropagation(); } catch {};
                setBlockNumberInput(e.target.value);
              }}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Select Block</MenuItem>
              <MenuItem value="ALL">All Blocks</MenuItem>
              {blocks?.map((b) => (
                <MenuItem key={b._id} value={b.name || b.block_number || b._id}>{b.block_number ? `#${b.block_number} — ${b.name}` : b.name}</MenuItem>
              ))}
            </TextField>
            <Button variant="contained" size="small" onClick={() => loadBoothPolygonsByBlock(blockNumberInput)}>Load Polygons</Button>
            <TextField
              select
              size="small"
              label="Filter by Year"
              value={yearFilter}
              onChange={(e) => {
                try { e.preventDefault && e.preventDefault(); } catch {};
                try { e.stopPropagation && e.stopPropagation(); } catch {};
                setYearFilter(e.target.value);
              }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">All Years</MenuItem>
              {Array.from({ length: 11 }, (_, i) => 2020 + i).map((year) => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </TextField>
            {mapError && <Alert severity="warning" sx={{ ml: 2 }}>{mapError}</Alert>}
          </Stack>
          <MapContainerStyled
            onClickCapture={(e) => {
              try {
                const tgt = e.target || (e.nativeEvent && e.nativeEvent.target);
                if (tgt && typeof tgt.closest === 'function') {
                  const anchor = tgt.closest('a');
                  if (anchor && anchor.getAttribute && anchor.getAttribute('href')) {
                    // Prevent navigation caused by anchors under the map
                    try { e.preventDefault && e.preventDefault(); } catch {}
                    try { e.stopPropagation && e.stopPropagation(); } catch {}
                  }
                  const form = tgt.closest('form');
                  if (form) {
                    try { e.preventDefault && e.preventDefault(); } catch {}
                    try { e.stopPropagation && e.stopPropagation(); } catch {}
                  }
                }
              } catch (ee) {}
            }}
            // Prevent default behavior earlier in the event chain so anchors/forms
            // inside the map cannot start navigation on pointerdown/mousedown/touchstart.
            onMouseDownCapture={(e) => {
              try {
                const tgt = e.target || (e.nativeEvent && e.nativeEvent.target);
                if (tgt && typeof tgt.closest === 'function') {
                  const anchor = tgt.closest('a');
                  if (anchor && anchor.getAttribute && anchor.getAttribute('href')) {
                    try { e.preventDefault && e.preventDefault(); } catch {}
                    try { e.stopPropagation && e.stopPropagation(); } catch {}
                  }
                  const form = tgt.closest('form');
                  if (form) {
                    try { e.preventDefault && e.preventDefault(); } catch {}
                    try { e.stopPropagation && e.stopPropagation(); } catch {}
                  }
                }
              } catch (ee) {}
            }}
            onTouchStartCapture={(e) => {
              try {
                const tgt = e.target || (e.nativeEvent && e.nativeEvent.target);
                if (tgt && typeof tgt.closest === 'function') {
                  const anchor = tgt.closest('a');
                  if (anchor && anchor.getAttribute && anchor.getAttribute('href')) {
                    try { e.preventDefault && e.preventDefault(); } catch {}
                    try { e.stopPropagation && e.stopPropagation(); } catch {}
                  }
                  const form = tgt.closest('form');
                  if (form) {
                    try { e.preventDefault && e.preventDefault(); } catch {}
                    try { e.stopPropagation && e.stopPropagation(); } catch {}
                  }
                }
              } catch (ee) {}
            }}
          >
            <Map
              ref={mapRef}
              mapboxAccessToken={mapboxToken}
              initialViewState={{ longitude: 75.8577, latitude: 22.7196, zoom: 8 }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              interactiveLayerIds={boothGeoJSON ? ['booth-fill'] : []}
              onClick={(e) => {
                // Defensive: prevent default browser navigation if this originated from a DOM event
                try { e.originalEvent && e.originalEvent.preventDefault && e.originalEvent.preventDefault(); } catch {}
                try { e.originalEvent && e.originalEvent.stopPropagation && e.originalEvent.stopPropagation(); } catch {}
                // If click landed on an anchor or inside a form, proactively block it
                try {
                  const oe = e.originalEvent;
                  const tgt = oe && (oe.target || oe.srcElement);
                  if (tgt && typeof tgt.closest === 'function') {
                    const anchor = tgt.closest('a');
                    if (anchor && anchor.getAttribute && anchor.getAttribute('href')) {
                      try { anchor.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); }); } catch {}
                      try { oe.preventDefault && oe.preventDefault(); } catch {}
                      try { oe.stopPropagation && oe.stopPropagation(); } catch {}
                    }
                    const form = tgt.closest('form');
                    if (form) {
                      try { oe.preventDefault && oe.preventDefault(); } catch {}
                      try { oe.stopPropagation && oe.stopPropagation(); } catch {}
                    }
                  }
                } catch (inner) { /* ignore debug helpers */ }
                
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
                    fetchBoothVolunteerDetails(boothNo);
                  }
                } catch (err) { console.error('Map click handler error:', err); }
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
              {/* Volunteer Markers Layer (deduped) */}
              {boothMarkersGeoJSON && (
                <Source id="booth-markers" type="geojson" data={boothMarkersGeoJSON}>
                  <Layer
                    id="booth-volunteer-markers"
                    type="circle"
                    paint={{
                      'circle-radius': 6,
                      'circle-color': [
                        'case',
                        ['get', 'hasVolunteer'],
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
                <Typography variant="caption">Has Volunteer Data</Typography>
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
                <Typography variant="caption">No Volunteer Data</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ p: 2, gap: 2 }}
        >
          <TextField
            size="small"
            variant="outlined"
            placeholder={`Search all fields (name, phone, email, role, etc.) - Press Enter to search...`}
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value;
              setSearchInput(value);
              // Clear search if input is empty
              if (value.trim() === '') {
                setGlobalFilter('');
                setPagination(prev => ({ ...prev, pageIndex: 0 }));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            sx={{ width: { xs: '100%', sm: 400 } }}
          />
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <CSVLink
              data={csvData}
              filename="booth_volunteers_all.csv"
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
                setSelectedVolunteer(null);
                setOpenModal(true);
              }}
              size="small"
            >
              Add Volunteer
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

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
        >
          {/* State */}
          <TextField
            select
            label="State"
            value={tempFilters.state}
            onChange={(e) => {
              try { e.preventDefault && e.preventDefault(); } catch {};
              try { e.stopPropagation && e.stopPropagation(); } catch {};
              setTempFilters((prev) => ({ ...prev, state: e.target.value }));
            }}
            sx={{ minWidth: 180 }}
            size="small"
          >
            <MenuItem value="">All States</MenuItem>
            {states.map((state) => (
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
            onChange={(e) => {
              try { e.preventDefault && e.preventDefault(); } catch {};
              try { e.stopPropagation && e.stopPropagation(); } catch {};
              setTempFilters((prev) => ({ ...prev, division: e.target.value }));
            }}
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
            onChange={(e) => {
              try { e.preventDefault && e.preventDefault(); } catch {};
              try { e.stopPropagation && e.stopPropagation(); } catch {};
              setTempFilters((prev) => ({ ...prev, parliament: e.target.value }));
            }}
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
            onChange={(e) => {
              try { e.preventDefault && e.preventDefault(); } catch {};
              try { e.stopPropagation && e.stopPropagation(); } catch {};
              setTempFilters((prev) => ({ ...prev, assembly: e.target.value }));
            }}
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

          {/* Block */}
          <TextField
            select
            label="Block"
            value={tempFilters.block}
            onChange={(e) => {
              try { e.preventDefault && e.preventDefault(); } catch {};
              try { e.stopPropagation && e.stopPropagation(); } catch {};
              setTempFilters((prev) => ({ ...prev, block: e.target.value }));
            }}
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
            onChange={(e) => {
              try { e.preventDefault && e.preventDefault(); } catch {};
              try { e.stopPropagation && e.stopPropagation(); } catch {};
              setTempFilters((prev) => ({ ...prev, booth: e.target.value }));
            }}
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
                booth: ''
              });
              setSelectedState('');
              setSelectedDivision('');
              setSelectedParliament('');
              setSelectedAssembly('');
              setSelectedBlock('');
              setSelectedBooth('');
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
                          <BoothVolunteerView data={row.original} />
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
        <Box sx={{ width: { xs: 340, sm: 420 }, p: 0, height: '100%' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: `1px solid ${theme.palette.divider}`, background: theme.palette.background.paper }}>
            <Box>
              <Typography variant="h6">Booth Details</Typography>
              <Typography variant="caption" color="text.secondary">Click a booth polygon to view volunteer data</Typography>
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
                  <Typography variant="body2"><strong>Block:</strong> {drawerData.details.booth?.block_id?.name || drawerData.details.booth?.block?.name || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Assembly:</strong> {drawerData.details.booth?.assembly_id?.name || drawerData.details.booth?.assembly?.name || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Parliament:</strong> {drawerData.details.booth?.parliament_id?.name || drawerData.details.booth?.parliament?.name || 'N/A'}</Typography>
                </Paper>

                <Paper elevation={0} sx={{ p: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Volunteers ({drawerData.details.volunteers?.length || 0})</Typography>
                  {drawerData.details.volunteers && drawerData.details.volunteers.length > 0 ? (
                    <Stack spacing={1}>
                      {drawerData.details.volunteers.map((volunteer, idx) => (
                        <Paper key={idx} elevation={1} sx={{ p: 1.5 }}>
                          <Typography variant="body2"><strong>Name:</strong> {volunteer.name || 'N/A'}</Typography>
                          <Typography variant="body2"><strong>Phone:</strong> {volunteer.phone || 'N/A'}</Typography>
                          <Typography variant="body2"><strong>Role:</strong> {volunteer.role || 'N/A'}</Typography>
                          <Typography variant="body2"><strong>Activity Level:</strong> <Chip label={volunteer.activity_level} size="small" color={volunteer.activity_level === 'High' ? 'success' : volunteer.activity_level === 'Medium' ? 'warning' : 'error'} /></Typography>
                          {volunteer.party && <Typography variant="body2"><strong>Party:</strong> {volunteer.party.name || 'N/A'}</Typography>}
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2">No volunteers registered for this booth.</Typography>
                    </Alert>
                  )}
                </Paper>
              </Stack>
            )}
          </Box>
        </Box>
      </Drawer>

      <BoothVolunteerModal
        open={openModal}
        modalToggler={setOpenModal}
        volunteer={selectedVolunteer}
        states={states}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        booths={booths}
        parties={parties}
        users={users}
        refresh={() => {
          fetchVolunteers(pagination.pageIndex, pagination.pageSize);
          fetchBoothsWithVolunteers();
        }}
      />

      <AlertBoothVolunteerDelete
        id={volunteerDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => {
          fetchVolunteers(pagination.pageIndex, pagination.pageSize);
          fetchBoothsWithVolunteers();
        }}
      />

      {/* OTP Dialog for CSV Download */}
      <OtpDialog
        open={otpDialogOpen}
        loading={otpLoading}
        maskedDest={maskedDest}
        otpCode={otpCode}
        error={otpError}
        onOtpChange={setOtpCode}
        onVerify={verifyOtp}
        onClose={closeDialog}
      />
    </>
  );
}
