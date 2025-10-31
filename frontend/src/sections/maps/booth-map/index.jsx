import PropTypes from 'prop-types';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import MapControl from 'components/third-party/map/MapControl';
import { Box, Typography, CircularProgress, Select, MenuItem, FormControl, InputLabel, Drawer, Paper, Stack, Divider, Autocomplete, TextField } from '@mui/material';

function BoothMap({ themes, onRegionClick, ...other }) {
  const theme = useTheme();
  const [selectTheme, setSelectTheme] = useState('outdoors');
  const [allBoothsData, setAllBoothsData] = useState(null); // All booths
  const [boothData, setBoothData] = useState(null); // Filtered booth for display
  const [boothsList, setBoothsList] = useState([]); // List of booths for dropdown
  const [selectedBoothNo, setSelectedBoothNo] = useState(''); // Selected booth number
  const [selectedBoothDetails, setSelectedBoothDetails] = useState(null); // Details of selected booth
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
        const resp = await fetch(`${import.meta.env.VITE_APP_API_URL}/booths?search=${encodeURIComponent(boothNo)}`);
        if (resp.ok) {
          const body = await resp.json();
          const arr = Array.isArray(body.data) ? body.data : [];
          // Find exact match by booth_number
          const exact = arr.find(b => String(b.booth_number) === String(boothNo)) || arr[0];
          
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
            
            // Trigger onRegionClick for external filtering
            if (onRegionClick) {
              onRegionClick({ level: 'booth', id: exact._id });
            }
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
