import PropTypes from 'prop-types';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { Box, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel, Drawer, Paper, Stack, Divider, Autocomplete, TextField, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemAvatar, ListItemText, Chip, Button, Avatar, Skeleton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FlagIcon from '@mui/icons-material/Flag';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ConstructionIcon from '@mui/icons-material/Construction';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function BoothMap({ themes, onRegionClick, ...other }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectTheme, setSelectTheme] = useState('outdoors');
  const [allBoothsData, setAllBoothsData] = useState(null); // All booths
  const [boothData, setBoothData] = useState(null); // Filtered booth for display
  const [boothsList, setBoothsList] = useState([]); // List of booths for dropdown
  const [selectedBoothNo, setSelectedBoothNo] = useState(''); // Selected booth number
  const [selectedBoothDetails, setSelectedBoothDetails] = useState(null); // Details of selected booth
  const [extraDataLoading, setExtraDataLoading] = useState(false);
  const [extraDataError, setExtraDataError] = useState(null);
  const [boothAggregates, setBoothAggregates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mapRef = useRef(null);

  // Helper to normalize API responses into an array of GeoJSON Features
  const extractFeatures = (obj) => {
    try {
  // normalized input
      if (!obj) return [];
      if (Array.isArray(obj?.features)) {
        // If features array contains FeatureCollection-like docs (with their own features), flatten them
        const first = obj.features[0];
        if (first && Array.isArray(first.features)) {
          return obj.features.flatMap(d => Array.isArray(d.features) ? d.features : (d.type === 'Feature' ? [d] : []));
        }
        return obj.features;
      }
      if (Array.isArray(obj?.data)) {
        // data could be an array of Feature docs or FeatureCollections
        const d0 = obj.data[0];
        if (d0 && d0.type === 'Feature') return obj.data;
        if (d0 && Array.isArray(d0.features)) {
          return obj.data.flatMap(d => Array.isArray(d.features) ? d.features : []);
        }
      }
      if (Array.isArray(obj)) {
        // Array of FeatureCollections or Features
        return obj.flatMap(x => Array.isArray(x?.features) ? x.features : (x?.type === 'Feature' ? [x] : []));
      }
      return [];
    } catch (_) {
      return [];
    }
  };

  // Load all booth polygons across the state
  useEffect(() => {
    const fetchAllBooths = async () => {
      try {
        setLoading(true);
        setError(null);
        const limit = 5000; // adjust if needed
        let page = 1;
        let pages = 1;
        const allFeatures = [];

        do {
          const url = `${import.meta.env.VITE_APP_API_URL}/booth-polygons?page=${page}&limit=${limit}`;
          const res = await fetch(url);
          const status = res.status;
          let body = null;
          try {
            body = await res.json();
          } catch (je) {
            // JSON parse error
            throw new Error(`JSON parse error on ${url}: ${je.message}`);
          }
          const feats = extractFeatures(body);
          allFeatures.push(...feats);
          pages = body?.pagination?.pages || pages || 1;
          page += 1;
          if (page > 50) break; // guardrail
        } while (page <= pages);

        const fc = { type: 'FeatureCollection', features: allFeatures };
        setAllBoothsData(fc);
        setBoothData(fc); // Initially show all booths
        
        // Create dropdown list from features
        const list = allFeatures.map((f, idx) => ({
          boothNo: f.properties?.BoothNo || f.properties?.booth_number || f.properties?.boothNo || `Booth-${idx}`,
          boothName: f.properties?.BoothName || f.properties?.name || '',
          blockName: f.properties?.BlockName || '',
          assemblyName: f.properties?.AC_NAME || '',
          feature: f
        }));
        setBoothsList(list);
        
        fitToData(fc);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllBooths();
  }, []);

  // Utility: compute bounds and fit map
  const fitToData = (fc) => {
    try {
      if (!fc || !fc.features || fc.features.length === 0) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const crawl = (coords) => {
        if (!coords) return;
        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
          const [x, y] = coords;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
          return;
        }
        for (const c of coords) crawl(c);
      };
      fc.features.forEach(f => crawl(f.geometry && f.geometry.coordinates));
      if (isFinite(minX) && isFinite(minY) && isFinite(maxX) && isFinite(maxY) && mapRef.current && mapRef.current.getMap) {
        const map = mapRef.current.getMap();
        map.fitBounds([[minX, minY], [maxX, maxY]], { padding: 40, maxZoom: 14, duration: 600 });
      }
    } catch (err) {
      // ignore
    }
  };

  // Removed block-based fetching/UI; loading all booths instead

  // Helper to add Authorization header when token exists
  const getAuthHeaders = () => {
    try {
      const token = localStorage.serviceToken;
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (err) {
      return {};
    }
  };

  // Fetch aggregated per-booth datasets in parallel
  const fetchBoothAggregates = async (booth) => {
    if (!booth || !booth._id) return;
    const base = import.meta.env.VITE_APP_API_URL;
    const headers = getAuthHeaders();
    setExtraDataLoading(true);
    setExtraDataError(null);
    setBoothAggregates(null);
    try {
      const boothId = encodeURIComponent(booth._id);

      const reqs = {
        events: fetch(`${base}/events?booth=${boothId}&all=true`, { headers }),
        partyActivities: fetch(`${base}/party-activities?booth=${boothId}&all=true`, { headers }),
        visits: fetch(`${base}/visits?booth=${boothId}&all=true`, { headers }),
        influencers: fetch(`${base}/influencers?booth=${boothId}&all=true`, { headers }),
        volunteers1: fetch(`${base}/booth-volunteers?booth_id=${boothId}&all=true`, { headers }),
        volunteers2: fetch(`${base}/booth-volunteers?booth=${boothId}&all=true`, { headers }),
        volunteers3: fetch(`${base}/booth-volunteers/booth/${boothId}`, { headers }),
        gender: fetch(`${base}/genders/booth/${boothId}`, { headers }),
        governments: fetch(`${base}/governments?booth=${boothId}&all=true`, { headers }),
        localIssues: fetch(`${base}/local-issues?booth=${boothId}&all=true`, { headers }),
        samitis: fetch(`${base}/samitis?booth_id=${boothId}&limit=100`, { headers }),
        workStatuses: fetch(`${base}/work-status/booth/${boothId}`, { headers }),
        winningParties: fetch(`${base}/winning-parties?booth=${boothId}&all=true`, { headers }),
        boothVotes: fetch(`${base}/booth-votes/booth/${boothId}`, { headers })
      };

      const settled = await Promise.allSettled(Object.values(reqs));
      const keys = Object.keys(reqs);

      const toJson = async (res) => {
        try { return await res.json(); } catch { return null; }
      };

      const out = {};
      for (let i = 0; i < settled.length; i++) {
        const key = keys[i];
        const st = settled[i];
        if (st.status === 'fulfilled' && st.value && st.value.ok) {
          const j = await toJson(st.value);
          out[key] = j;
        } else {
          out[key] = null;
        }
      }

      // Normalize volunteers (first successful variant wins)
      let volunteers = [];
      for (const vKey of ['volunteers1', 'volunteers2', 'volunteers3']) {
        const j = out[vKey];
        if (j && j.success) {
          if (Array.isArray(j.data)) { volunteers = j.data; break; }
          if (Array.isArray(j)) { volunteers = j; break; }
        }
      }

      // Normalize gender with fallback to booth counts
      let gender = null;
      const g = out.gender;
      if (g && g.success) {
        let gd = null;
        if (Array.isArray(g.data) && g.data.length) gd = g.data[0]; else if (g.data && typeof g.data === 'object') gd = g.data;
        if (gd) gender = { male: gd.male || 0, female: gd.female || 0, others: gd.others || 0, total: (gd.male||0)+(gd.female||0)+(gd.others||0) };
      }
      if (!gender) {
        const male = Number(booth?.Male_Count ?? booth?.male ?? 0) || 0;
        const female = Number(booth?.Female_Count ?? booth?.female ?? 0) || 0;
        const others = Number(booth?.others_Count ?? booth?.others ?? 0) || 0;
        const total = Number(booth?.Total ?? booth?.total ?? (male + female + others)) || (male + female + others);
        gender = { male, female, others, total };
      }

      // Simple extract helper
      const extractList = (j) => (j && j.success && Array.isArray(j.data)) ? j.data : [];

      // Compute work status summary
      const workStatuses = extractList(out.workStatuses);
      const workSummary = { total: workStatuses.length, completed: 0, in_progress: 0, in_complete: 0, announced: 0, other: 0 };
      workStatuses.forEach(ws => {
        const s = (ws.status || '').toLowerCase();
        if (s === 'completed') workSummary.completed++;
        else if (s === 'in progress') workSummary.in_progress++;
        else if (s === 'in complete') workSummary.in_complete++;
        else if (s === 'announced') workSummary.announced++;
        else workSummary.other++;
      });

      setBoothAggregates({
        events: extractList(out.events),
        partyActivities: extractList(out.partyActivities),
        visits: extractList(out.visits),
        influencers: extractList(out.influencers),
        volunteers,
        gender,
        governments: extractList(out.governments),
        localIssues: extractList(out.localIssues),
        samitis: extractList(out.samitis),
        workStatuses,
        workSummary,
        winningParties: extractList(out.winningParties),
        boothVotes: extractList(out.boothVotes)
      });
    } catch (err) {
      setExtraDataError(err.message || 'Failed to fetch booth data');
    } finally {
      setExtraDataLoading(false);
    }
  };

  // Handle booth selection from dropdown
  const handleBoothSelect = async (boothNo) => {
    if (!boothNo) {
      // Show all booths if nothing selected
      setBoothData(allBoothsData);
      setSelectedBoothNo('');
      setSelectedBoothDetails(null);
      setDrawerOpen(false);
      if (allBoothsData) fitToData(allBoothsData);
      return;
    }

    setSelectedBoothNo(boothNo);
    
    // Filter to show only selected booth
    const boothItem = boothsList.find(b => b.boothNo === boothNo);
    if (boothItem) {
      const filteredFC = {
        type: 'FeatureCollection',
        features: [boothItem.feature]
      };
      setBoothData(filteredFC);
      fitToData(filteredFC);
      
      // Fetch full booth details from API using booth_number
      try {
        // Prefer robust matching by fetching all booths and matching normalized numbers
        const headers = getAuthHeaders();
        const allRes = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?all=true&limit=10000`, { headers });
        let exact = null;
        if (allRes.ok) {
          const allJson = await allRes.json();
          const arr = Array.isArray(allJson.data) ? allJson.data : [];
          const norm = (v) => String(v ?? '').trim().toLowerCase();
          exact = arr.find(b => norm(b.booth_number) === norm(boothNo))
               || arr.find(b => norm(b.booth_number).includes(norm(boothNo)) || norm(boothNo).includes(norm(b.booth_number)));
        }
        if (!exact) {
          // Fallback to search endpoint
          const resp = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?search=${encodeURIComponent(boothNo)}`, { headers });
          if (resp.ok) {
            const body = await resp.json();
            const arr = Array.isArray(body.data) ? body.data : [];
            exact = arr.find(b => String(b.booth_number) === String(boothNo)) || arr[0];
          }
        }
        if (exact) {
            // Fetch additional related data if needed
            const boothDetails = {
              _id: exact._id,
              booth_number: exact.booth_number,
              booth_name: exact.name,
              full_address: exact.full_address,
              description: exact.description,
              latitude: exact.latitude,
              longitude: exact.longitude,
              male_voters: exact.Male_Count || 0,
              female_voters: exact.Female_Count || 0,
              other_voters: exact.others_Count || 0,
              total_voters: exact.Total || 0,
              block_name: exact.block_id?.name || 'N/A',
              assembly_name: exact.assembly_id?.name || 'N/A',
              parliament_name: exact.parliament_id?.name || 'N/A',
              district_name: exact.district_id?.name || 'N/A',
              division_name: exact.division_id?.name || 'N/A',
              state_name: exact.state_id?.name || 'N/A',
              election_year: exact.election_year?.year || 'N/A',
              created_at: exact.created_at,
              updated_at: exact.updated_at
            };
            
            setSelectedBoothDetails(boothDetails);
            setDrawerOpen(true);
            // Kick off aggregates load
            fetchBoothAggregates(exact);
            
            // Trigger onRegionClick for external filtering
            if (onRegionClick) {
              onRegionClick({ level: 'booth', id: exact._id });
            }
        }
      } catch (err) {
        setError('Failed to fetch booth details');
      }
    }
  };

  const handleFeatureClick = async (e) => {
    if (!e.features?.length) return;
    const feature = e.features[0];
    const props = feature.properties || {};
    setPopupInfo({ longitude: e.lngLat.lng, latitude: e.lngLat.lat, properties: props });

    // Auto-select clicked booth in dropdown
    const boothNo = props.BoothNo || props.boothNo || props.booth_number || props.BoothNumber || '';
    if (boothNo) {
      handleBoothSelect(boothNo);
    }
  };

  const boothFillPaint = {
    'fill-color': theme.palette.info.main,
    'fill-opacity': 0.55,
    'fill-outline-color': '#000000',
    'fill-antialias': true
  };

  const labelLayout = {
    'text-field': [
      'concat',
      ['coalesce', ['get', 'BoothNo'], ['get', 'booth_number'], ['get', 'boothNo'], ''],
      '\n',
      ['coalesce', ['get', 'BoothName'], ['get', 'name'], '']
    ],
    'text-size': 10,
    'text-allow-overlap': true,
    'text-anchor': 'center',
    'text-justify': 'center'
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Booth Dropdown with search */}
  <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, width: 360 }}>
        <Autocomplete
          value={boothsList.find(b => b.boothNo === selectedBoothNo) || null}
          onChange={(event, newValue) => {
            handleBoothSelect(newValue?.boothNo || '');
          }}
          options={boothsList}
          getOptionLabel={(option) => `${option.boothNo} - ${option.boothName || 'Booth'}`}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Select Booth" 
              variant="outlined"
              size="small"
              sx={{ backgroundColor: 'white' }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.boothNo}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {option.boothNo} - {option.boothName || 'Booth'}
                </Typography>
                {option.blockName && (
                  <Typography variant="caption" color="text.secondary">
                    Block: {option.blockName}
                  </Typography>
                )}
              </Box>
            </li>
          )}
          loading={loading}
          disabled={loading}
        />
      </Box>

      <Map
        ref={mapRef}
        initialViewState={{ latitude: 23.4707, longitude: 77.9455, zoom: 7 }}
        mapStyle={themes?.[selectTheme]}
        interactiveLayerIds={['booth-layer']}
        onClick={handleFeatureClick}
        {...other}
      >
        <MapControl />
        <Source id="india-source" type="geojson" data="/india.geojson">
          <Layer id="india-fill" type="fill" paint={{ 'fill-color': '#e0e0e0', 'fill-opacity': 0.07 }} />
          <Layer id="india-outline" type="line" paint={{ 'line-color': '#003366', 'line-width': 1 }} />
        </Source>

        {boothData && boothData.features && boothData.features.length > 0 && (
          <Source id="booth-source" type="geojson" data={boothData}>
            <Layer id="booth-layer" type="fill" paint={boothFillPaint} />
            <Layer id="booth-outline" type="line" paint={{ 'line-color': '#000000', 'line-width': 1 }} />
            <Layer id="booth-labels" type="symbol" layout={labelLayout} paint={{ 'text-color': '#000' }} />
          </Source>
        )}

        {/* Show booth count */}
        <Box sx={{ position: 'absolute', top: 80, right: 16, zIndex: 1000, backgroundColor: 'rgba(255,255,255,0.95)', p: 1, borderRadius: 1, minWidth: 120 }}>
          <Typography variant="caption">
            {selectedBoothNo ? '1 Booth Selected' : `Total Booths: ${boothsList.length || 0}`}
          </Typography>
        </Box>

        {/* Fetch logs overlay for debugging - last 6 entries */}
        {/* fetch logs removed */}

        {/* Show error overlay if present */}
        {error && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1000, backgroundColor: 'rgba(255,200,200,0.95)', p: 1, borderRadius: 1 }}>
            <Typography variant="caption" color="error">Error: {error}</Typography>
          </Box>
        )}

        {popupInfo && (
          <Popup longitude={popupInfo.longitude} latitude={popupInfo.latitude} closeButton={true} onClose={() => setPopupInfo(null)} anchor="bottom">
            <div style={{ minWidth: 240 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>{popupInfo.properties.BoothName || popupInfo.properties.name || 'Booth'}</h4>
              <p style={{ margin: 0 }}><strong>Booth No:</strong> {popupInfo.properties.BoothNo || popupInfo.properties.booth_number || popupInfo.properties.boothNo || 'N/A'}</p>
              {popupInfo.properties.BlockName && <p style={{ margin: 0 }}><strong>Block:</strong> {popupInfo.properties.BlockName}</p>}
              {popupInfo.properties.AC_NAME && <p style={{ margin: 0 }}><strong>Assembly:</strong> {popupInfo.properties.AC_NAME}</p>}
              {popupInfo.properties.Location && <p style={{ margin: 0 }}><strong>Location:</strong> {popupInfo.properties.Location}</p>}
              <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>Clicking filtered lists to this booth.</p>
            </div>
          </Popup>
        )}

        {loading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" sx={{ mt: 2 }}>Loading Booths...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ position: 'absolute', bottom: 20, left: 20, zIndex: 1000, backgroundColor: 'rgba(255,0,0,0.15)', padding: 2, borderRadius: 1 }}>
            <Typography color="error">Error: {error}</Typography>
          </Box>
        )}
      </Map>

      {/* Side Panel - Booth Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 450,
            boxSizing: 'border-box',
            p: 3
          }
        }}
      >
        {selectedBoothDetails && (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight={700}>
                Booth Details
              </Typography>
              <Typography variant="caption" color="primary" fontWeight={600}>
                ID: {selectedBoothDetails._id}
              </Typography>
            </Box>
            <Divider />
            
            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.primary.lighter }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700} color="primary">
                  Basic Information
                </Typography>
                
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Booth Number
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {selectedBoothDetails.booth_number || 'N/A'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Booth Name
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedBoothDetails.booth_name || 'N/A'}
                  </Typography>
                </Box>

                {selectedBoothDetails.full_address && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Full Address
                    </Typography>
                    <Typography variant="body2">
                      {selectedBoothDetails.full_address}
                    </Typography>
                  </Box>
                )}

                {selectedBoothDetails.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {selectedBoothDetails.description}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.success.lighter }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700} color="success.dark">
                  Location Hierarchy
                </Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    State
                  </Typography>
                  <Typography variant="body1">
                    {selectedBoothDetails.state_name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Division
                  </Typography>
                  <Typography variant="body1">
                    {selectedBoothDetails.division_name}
                  </Typography>
                </Box>

                {selectedBoothDetails.district_name && selectedBoothDetails.district_name !== 'N/A' && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      District
                    </Typography>
                    <Typography variant="body1">
                      {selectedBoothDetails.district_name}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Block
                  </Typography>
                  <Typography variant="body1">
                    {selectedBoothDetails.block_name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Assembly Constituency
                  </Typography>
                  <Typography variant="body1">
                    {selectedBoothDetails.assembly_name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Parliament Constituency
                  </Typography>
                  <Typography variant="body1">
                    {selectedBoothDetails.parliament_name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Election Year
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedBoothDetails.election_year}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.info.lighter }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700} color="info.dark">
                  Voter Statistics
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Total Voters
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="primary">
                      {selectedBoothDetails.total_voters}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Male Voters
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="info.main">
                      {selectedBoothDetails.male_voters}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Female Voters
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="secondary.main">
                      {selectedBoothDetails.female_voters}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Other Voters
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="warning.main">
                      {selectedBoothDetails.other_voters}
                    </Typography>
                  </Box>
                </Box>

                {/* Voter Distribution Percentages */}
                {selectedBoothDetails.total_voters > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                      Gender Distribution
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          Male: {((selectedBoothDetails.male_voters / selectedBoothDetails.total_voters) * 100).toFixed(1)}%
                        </Typography>
                        <Box sx={{ 
                          height: 8, 
                          backgroundColor: theme.palette.info.main, 
                          borderRadius: 1,
                          width: `${(selectedBoothDetails.male_voters / selectedBoothDetails.total_voters) * 100}%`
                        }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                          Female: {((selectedBoothDetails.female_voters / selectedBoothDetails.total_voters) * 100).toFixed(1)}%
                        </Typography>
                        <Box sx={{ 
                          height: 8, 
                          backgroundColor: theme.palette.secondary.main, 
                          borderRadius: 1,
                          width: `${(selectedBoothDetails.female_voters / selectedBoothDetails.total_voters) * 100}%`
                        }} />
                      </Box>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Paper>

            {selectedBoothDetails.latitude && selectedBoothDetails.longitude && (
              <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.warning.lighter }}>
                <Stack spacing={1.5}>
                  <Typography variant="h6" fontWeight={700} color="warning.dark">
                    GPS Coordinates
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Latitude
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedBoothDetails.latitude.toFixed(6)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Longitude
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedBoothDetails.longitude.toFixed(6)}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>
            )}

            {(selectedBoothDetails.created_at || selectedBoothDetails.updated_at) && (
              <Paper elevation={2} sx={{ p: 2, backgroundColor: theme.palette.grey[100] }}>
                <Stack spacing={1}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    Record Information
                  </Typography>
                  {selectedBoothDetails.created_at && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Created: {new Date(selectedBoothDetails.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  {selectedBoothDetails.updated_at && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated: {new Date(selectedBoothDetails.updated_at).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Aggregated Sections - nicer UI using Accordions, icons, avatars and chips */}
            {(() => {
              const getEntityId = (it) => {
                if (!it) return null;
                if (it._id) return it._id;
                if (it.id) return it.id;
                // common nested patterns
                const keys = Object.keys(it);
                for (const k of keys) {
                  if (k.endsWith('_id') && it[k]) {
                    // could be object or string
                    if (typeof it[k] === 'string') return it[k];
                    if (it[k]._id) return it[k]._id;
                    if (it[k].id) return it[k].id;
                  }
                }
                // sometimes wrapped in data or document
                if (it.data && (it.data._id || it.data.id)) return it.data._id || it.data.id;
                if (it.document && (it.document._id || it.document.id)) return it.document._id || it.document.id;
                return null;
              };

              const S = ({ title, items = [], IconComp, renderPrimary, renderSecondary, listPath, detailPath }) => (
                <Accordion key={title} sx={{ boxShadow: 'none', mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 36, height: 36 }}>
                        <IconComp style={{ color: '#fff' }} fontSize="small" />
                      </Avatar>
                      <Typography variant="subtitle2">{title}</Typography>
                      <Chip label={items?.length || 0} size="small" sx={{ ml: 'auto' }} />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {extraDataLoading && !boothAggregates ? (
                      <Skeleton variant="rectangular" height={80} />
                    ) : (items && items.length > 0) ? (
                      <List dense>
                        {items.slice(0, 5).map(it => {
                          const entityId = getEntityId(it);
                          return (
                            <ListItem 
                              key={it._id || it.id || JSON.stringify(it)} 
                              alignItems="flex-start" 
                              sx={{ py: 0.5, cursor: detailPath && entityId ? 'pointer' : 'default' }}
                              onClick={() => {
                                // debug
                                console.debug('BoothMap: item click', { title, entityId, item: it, detailPath, listPath });
                                if (detailPath && entityId) {
                                  navigate(`${detailPath}/${entityId}`);
                                } else if (listPath && selectedBoothDetails) {
                                  // fallback: open list filtered by booth
                                  navigate(listPath, { state: { boothId: selectedBoothDetails._id, boothNumber: selectedBoothDetails.booth_number, boothName: selectedBoothDetails.booth_name } });
                                }
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                                  <IconComp fontSize="small" />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={renderPrimary ? renderPrimary(it) : (it.title || it.name || it.samiti_name || it.issue_name || it.work_name || it.candidate_name || it.person_name || it.username || '—')}
                                secondary={renderSecondary ? renderSecondary(it) : (it.date ? new Date(it.date).toLocaleDateString('en-IN') : (it.status || it.locationName || ''))}
                              />
                            </ListItem>
                          );
                        })}
                      </List>
                    ) : (
                      <Typography variant="body2">No records found.</Typography>
                    )}

                    {listPath && items && items.length > 0 && selectedBoothDetails && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => {
                            // Try to navigate directly to the related detail if we can resolve an entity id from items
                            const firstEntityId = (items || []).map(getEntityId).find(x => x);
                            if (detailPath && firstEntityId) {
                              navigate(`${detailPath}/${firstEntityId}`);
                              return;
                            }
                            // Fallback: open list page filtered by booth
                            navigate(listPath, { state: { boothId: selectedBoothDetails._id, boothNumber: selectedBoothDetails.booth_number, boothName: selectedBoothDetails.booth_name } });
                          }}
                        >
                          View more
                        </Button>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              );

              return (
                <Box>
                  {/* Gender - show compact stats */}
                  <Paper elevation={0} sx={{ p: 1, mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ bgcolor: theme.palette.info.main, width: 40, height: 40 }}><GroupIcon style={{ color: '#fff' }} /></Avatar>
                      <Box>
                        <Typography variant="subtitle2">Gender</Typography>
                        {boothAggregates?.gender ? (
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip label={`M ${boothAggregates.gender.male}`} color="info" size="small" />
                            <Chip label={`F ${boothAggregates.gender.female}`} color="secondary" size="small" />
                            <Chip label={`O ${boothAggregates.gender.others}`} size="small" />
                            <Chip label={`T ${boothAggregates.gender.total}`} variant="outlined" size="small" />
                          </Stack>
                        ) : extraDataLoading ? (
                          <Skeleton variant="text" width={120} />
                        ) : (
                          <Typography variant="caption">No gender data</Typography>
                        )}
                      </Box>
                    </Stack>
                  </Paper>

                  {S({
                    title: `Events (${boothAggregates?.events?.length || 0})`,
                    items: boothAggregates?.events || [],
                    IconComp: EventIcon,
                    renderPrimary: (ev) => ev.title || ev.event_name || 'Event',
                    renderSecondary: (ev) => ev.date ? new Date(ev.date).toLocaleDateString('en-IN') : ev.location || '',
                    listPath: '/Events',
                    detailPath: '/Events'
                  })}

                  {S({
                    title: `Party Activities (${boothAggregates?.partyActivities?.length || 0})`,
                    items: boothAggregates?.partyActivities || [],
                    IconComp: FlagIcon,
                    renderPrimary: (a) => a.activity_name || a.title || 'Activity',
                    renderSecondary: (a) => a.date ? new Date(a.date).toLocaleDateString('en-IN') : a.description || '' ,
                    listPath: '/party-activities',
                    detailPath: '/party-activities'
                  })}

                  {S({
                    title: `Visits (${boothAggregates?.visits?.length || 0})`,
                    items: boothAggregates?.visits || [],
                    IconComp: VisibilityIcon,
                    renderPrimary: (v) => `${v.candidate_id?.name || v.person_name || 'Visit'}`,
                    renderSecondary: (v) => v.date ? new Date(v.date).toLocaleDateString('en-IN') : v.locationName || '',
                    listPath: '/visits',
                    detailPath: '/visits'
                  })}

                  {S({
                    title: `Influencers (${boothAggregates?.influencers?.length || 0})`,
                    items: boothAggregates?.influencers || [],
                    IconComp: AccountCircleIcon,
                    renderPrimary: (p) => p.name || p.person_name || p.phone || 'Influencer',
                    renderSecondary: (p) => p.designation || p.address || '',
                    listPath: '/Influancer',
                    detailPath: '/Influancer'
                  })}

                  {S({
                    title: `Volunteers (${boothAggregates?.volunteers?.length || 0})`,
                    items: boothAggregates?.volunteers || [],
                    IconComp: VolunteerActivismIcon,
                    renderPrimary: (p) => p.name || p.username || p.phone || 'Volunteer',
                    renderSecondary: (p) => p.party?.name || p.role || '',
                    listPath: '/booth-volunteer',
                    detailPath: '/booth-volunteer'
                  })}

                  {S({
                    title: `Government Schemes (${boothAggregates?.governments?.length || 0})`,
                    items: boothAggregates?.governments || [],
                    IconComp: LocalHospitalIcon,
                    renderPrimary: (s) => s.name || 'Scheme',
                    renderSecondary: (s) => s.amount ? `₹${Number(s.amount).toLocaleString()}` : s.type || '',
                    listPath: '/Government-Schema',
                    detailPath: '/Government-Schema'
                  })}

                  {S({
                    title: `Local Issues (${boothAggregates?.localIssues?.length || 0})`,
                    items: boothAggregates?.localIssues || [],
                    IconComp: ReportProblemIcon,
                    renderPrimary: (it) => it.issue_name || 'Issue',
                    renderSecondary: (it) => it.status || it.priority || '',
                    listPath: '/Local-Issue',
                    detailPath: '/Local-Issue'
                  })}

                  {S({
                    title: `Samiti (${boothAggregates?.samitis?.length || 0})`,
                    items: boothAggregates?.samitis || [],
                    IconComp: GroupIcon,
                    renderPrimary: (s) => s.samiti_name || 'Samiti',
                    renderSecondary: (s) => s.leader || '',
                    listPath: '/samitis',
                    detailPath: '/samitis'
                  })}

                  {S({
                    title: `Work Status (${boothAggregates?.workSummary?.total || 0})`,
                    items: boothAggregates?.workStatuses || [],
                    IconComp: ConstructionIcon,
                    renderPrimary: (w) => w.work_name || 'Work',
                    renderSecondary: (w) => w.status || w.progress || '',
                    listPath: '/Work-Status',
                    detailPath: '/Work-Status'
                  })}

                  {S({
                    title: `Winning Assembly (${boothAggregates?.winningParties?.length || 0})`,
                    items: boothAggregates?.winningParties || [],
                    IconComp: EmojiEventsIcon,
                    renderPrimary: (wp) => wp.candidate_id?.name || wp.candidate_name || 'Candidate',
                    renderSecondary: (wp) => `${wp.party_id?.name || wp.party_name || ''} • ${wp.election_year?.year || wp.election_year || ''}`,
                    listPath: '/WinningPartiesList',
                    detailPath: '/WinningPartiesList'
                  })}

                  {S({
                    title: `Booth Votes (${boothAggregates?.boothVotes?.length || 0})`,
                    items: boothAggregates?.boothVotes || [],
                    IconComp: HowToVoteIcon,
                    renderPrimary: (v) => (typeof v.candidate_name === 'string' ? v.candidate_name : (v.candidate_name?.name || v.party_name || 'Candidate')),
                    renderSecondary: (v) => `Votes: ${v.votes ?? v.vote_count ?? 'N/A'}`,
                    listPath: '/Booth-Votes',
                    detailPath: '/Booth-Votes'
                  })}
                </Box>
              );
            })()}
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}

export default memo(BoothMap);

BoothMap.propTypes = {
  themes: PropTypes.object,
  onRegionClick: PropTypes.func,
  other: PropTypes.any
};
