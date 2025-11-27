import { memo, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Map, { Source, Layer } from 'react-map-gl';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Drawer,
  Stack,
  Paper,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import MapIcon from '@mui/icons-material/Map';
import MapControl from 'components/third-party/map/MapControl';
import ControlPanel from '../../maps/change-theme copy/control-panel';

// District colors: light blue palette for subtle map fills
const districtColors = [
  '#e6f3fb', '#ddedfb', '#d4e7fa', '#cbe1f9', '#c2dbf8',
  '#b9d5f7', '#afd0f6', '#a6c9f5', '#9cbff3', '#93b7f1',
  '#89afeF', '#80a6ee', '#77a0ec', '#6d98ea', '#6490e8',
  '#5b88e6', '#517fe2', '#4776de', '#3d6dd9', '#3564d4'
];

// Outline / label primary blue used for strokes and chip backgrounds
const OUTLINE_BLUE = '#1e73b7';

function DistrictMap({ themes, onRegionClick, ...other }) {
  const theme = useTheme();
  const [selectTheme, setSelectTheme] = useState('outdoors');
  const [districtData, setDistrictData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  // Filters removed: districts will display unfiltered (show all)
  const mapRef = useRef(null);

  // Fetch district polygon data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('serviceToken');
        if (!token) {
          console.warn('No authentication token found. Cannot fetch district data.');
          setError('Authentication required. Please log in to view district data.');
          setLoading(false);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/district-polygons?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch district data');

        const districtJson = await response.json();
        console.log('District API Response:', districtJson);

        // Process district response: support multiple shapes
        let features = [];
        // debug counters for diagnostics
        let totalProcessed = 0;
        let skippedCount = 0;
        let addedCount = 0;
        let missingLabelCount = 0;

        // convert ESRI rings -> GeoJSON MultiPolygon
        const convertEsriToGeoJSON = (geometry) => {
          if (!geometry) return null;
          if (geometry.coordinates) return geometry;
          if (geometry.rings && Array.isArray(geometry.rings)) {
            try {
              const mpCoords = geometry.rings.map((ring) => [ring.map((pt) => [pt[0], pt[1]])]);
              return { type: 'MultiPolygon', coordinates: mpCoords };
            } catch (err) {
              console.warn('Failed convert ESRI rings:', err);
              return null;
            }
          }
          return null;
        };

        const normalizeFeatureGeometry = (feature) => {
          if (!feature) return null;
          let geom = feature.geometry || null;
          if (geom && geom.coordinates) return geom;
          if (feature.geojson && feature.geojson.type && feature.geojson.coordinates) return feature.geojson;
          if (feature.geometry && feature.geometry.rings) return convertEsriToGeoJSON(feature.geometry);
          if (feature.rings) return convertEsriToGeoJSON({ rings: feature.rings });
          return null;
        };

        const pushFeature = (feature) => {
          totalProcessed++;
          // support responses that put attributes at top-level, inside `properties`, or inside `attributes` (ESRI)
          let props = {};
          if (feature.properties && Object.keys(feature.properties).length) props = { ...feature.properties };
          // some APIs put attributes under feature.attributes
          if ((!props || !Object.keys(props).length) && feature.attributes && Object.keys(feature.attributes).length) {
            props = { ...feature.attributes };
          }
          // or nested under properties.attributes
          if ((!props || !Object.keys(props).length) && feature.properties && feature.properties.attributes && Object.keys(feature.properties.attributes).length) {
            props = { ...feature.properties.attributes };
          }
          // copy common top-level fields into props if they weren't present
          const topLevelFields = ['dtname', 'district', 'name', 'District', 'DT_NAME', 'DISTRICT', 'dtcode11', 'DT_CODE', 'OBJECTID', 'id', 'stname', 'ST_NAME', 'stcode11', 'DIVISION_NAME', 'year_stat', 'displayName'];
          for (const k of topLevelFields) {
            if ((props[k] === undefined || props[k] === null || props[k] === '') && feature[k] !== undefined) {
              props[k] = feature[k];
            }
          }

          const geom = normalizeFeatureGeometry(feature) || feature.geometry || null;
          if (!geom || !geom.type || !geom.coordinates) {
            skippedCount++;
            console.warn('Skipping feature with invalid geometry', props);
            return;
          }
          // try many possible property names for district name (cover varied APIs)
          const districtName = (
            props.dtname || props.DTNAME || props.DT_NAME || props.dt_name ||
            props.district || props.District || props.districtname || props.district_name ||
            props.name || props.NAME || props.Name || props.NAME_1 || props.NAME_ENG ||
            props.displayName || props.display_name || props.label || props.LABEL || ''
          );
          // create a guaranteed label (fallback to codes/ids if name missing)
          const fallbackLabel = (props.dtcode11 || props.DT_CODE || props.OBJECTID || props.id || props.code || props.CODE || '').toString();
          const labelText = (districtName && String(districtName).trim()) || (fallbackLabel && String(fallbackLabel).trim()) || '';
          if (!labelText) {
            // helpful debug to inspect which keys exist when label is missing
            console.debug('Feature missing label - available keys:', Object.keys(props).slice(0, 20));
          }
          if (!labelText) missingLabelCount++;
          let hash = 0;
          for (let i = 0; i < districtName.length; i++) {
            hash = ((hash << 5) - hash + districtName.charCodeAt(i)) & 0xffffffff;
          }
          const colorIndex = Math.abs(hash) % districtColors.length;

          const geojsonFeature = {
            type: 'Feature',
            properties: {
              ...props,
              // normalized ids and names
              id: (districtName || '').toString().toLowerCase().replace(/\s+/g, '-') || (props.dtcode11 || props.OBJECTID || ''),
              name: districtName || props.dtname || props.District || props.Name || '',
              displayName: districtName || props.dtname || props.District || props.Name || '',
              district: districtName || props.dtname || '',
              // guaranteed label used for map text
              _label: labelText,
              state: props.stname || props.ST_NAME || 'Madhya Pradesh',
              stateCode: props.stcode11 || '23',
              districtCode: props.dtcode11 || props.DT_CODE || '',
              division: props.division || props.DIVISION_NAME || 'N/A',
              year: props.year_stat || '2011',
              color: districtColors[colorIndex]
            },
            geometry: geom
          };
          features.push(geojsonFeature);
          addedCount++;
        };

        // If API returned a FeatureCollection
        if (districtJson && districtJson.type === 'FeatureCollection' && Array.isArray(districtJson.features)) {
          districtJson.features.forEach(pushFeature);
        } else if (Array.isArray(districtJson)) {
          // array of FeatureCollections or feature docs
          districtJson.forEach(doc => {
            if (doc && doc.type === 'FeatureCollection' && Array.isArray(doc.features)) doc.features.forEach(pushFeature);
            else if (doc && Array.isArray(doc.features)) doc.features.forEach(pushFeature);
          });
        } else if (districtJson.polygons && Array.isArray(districtJson.polygons)) {
          // older shape: polygons array
          for (const polygon of districtJson.polygons) {
            const docs = Array.isArray(polygon) ? polygon : [polygon];
            for (const doc of docs) {
              const feats = doc.features || (doc.type === 'FeatureCollection' && doc.features) || [];
              feats.forEach(pushFeature);
            }
          }
        } else if (districtJson.data && Array.isArray(districtJson.data)) {
          // some endpoints return { data: [FeatureCollection,...] }
          districtJson.data.forEach(d => {
            if (d && d.type === 'FeatureCollection' && Array.isArray(d.features)) d.features.forEach(pushFeature);
            else if (d && Array.isArray(d.features)) d.features.forEach(pushFeature);
          });
        }

        // debug: summary of processing
        console.debug('District processing summary', {
          totalProcessed,
          addedCount,
          skippedCount,
          missingLabelCount
        });

        try {
          console.debug('District processed features sample:', features.slice(0, 8).map(f => ({
            id: f.properties?.id,
            _label: f.properties?._label,
            name: f.properties?.name,
            geometryType: f.geometry?.type,
            coordsCount: Array.isArray(f.geometry?.coordinates) ? (f.geometry.coordinates.flat ? f.geometry.coordinates.flat(3).length : f.geometry.coordinates.length) : 0
          })));
        } catch (err) {
          console.debug('Error while preparing features sample', err);
        }

        if (features.length > 0) setDistrictData({ type: 'FeatureCollection', features });
        else throw new Error('No district features found in response');

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFeatureClick = (e) => {
    try {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (e && e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    } catch (err) {
      console.warn('Error preventing default on map click event:', err);
    }

    if (!e.features?.length) return;

    const feature = e.features[0];
    
    // Open drawer
    setSelectedDistrict(feature.properties);
    setDrawerOpen(true);
    
    // Notify parent component
    if (onRegionClick && feature.properties) {
      try {
        onRegionClick({
          type: 'district',
          name: feature.properties.name,
          data: feature.properties
        });
      } catch (err) {
        console.warn('Error calling onRegionClick:', err);
      }
    }
  };

  const getFilteredData = () => {
    if (!districtData) return null;

    const filteredFeatures = districtData.features.filter(feature => {
          // No filtering: include all features
          return true;
    });

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
  };

  const getColorForFeature = (feature) => {
    return feature.properties?.color || '#CCCCCC';
  };

  const handleChangeTheme = useCallback((value) => setSelectTheme(value), []);

  // filters removed - no-op

  const filteredData = getFilteredData();

  // compute simple centroids for each polygon feature to place labels reliably
  const labelPoints = useMemo(() => {
    if (!filteredData || !filteredData.features) return null;
    const pts = filteredData.features.map((f) => {
      if (!f || !f.geometry) return null;
      const geom = f.geometry;
      let allCoords = [];
      try {
        if (geom.type === 'Polygon') {
          // geom.coordinates => [ [ring1], [ring2], ... ]
          allCoords = geom.coordinates.flat();
        } else if (geom.type === 'MultiPolygon') {
          // geom.coordinates => [ [ [ring] ], [ [ring] ] ]
          allCoords = geom.coordinates.flat(2);
        } else {
          return null;
        }
      } catch (err) {
        return null;
      }

      if (!allCoords || !allCoords.length) return null;
      const sum = allCoords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
      const centroid = [sum[0] / allCoords.length, sum[1] / allCoords.length];

      return {
        type: 'Feature',
        properties: {
          _label: (f.properties && (f.properties._label || f.properties.name || f.properties.displayName)) || (f._label || '')
        },
        geometry: { type: 'Point', coordinates: centroid }
      };
    }).filter(Boolean);

    return { type: 'FeatureCollection', features: pts };
  }, [filteredData]);

  // debug: print sample of labels to console so you can verify in browser devtools
  useEffect(() => {
    try {
      if (!labelPoints || !labelPoints.features) return;
      const names = labelPoints.features.slice(0, 10).map(f => f.properties? f.properties._label : '');
      console.debug('District label points sample (first 10):', names, 'total:', labelPoints.features.length);
    } catch (err) {
      // ignore
    }
  }, [labelPoints]);

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Heading row (filters removed) */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          District Map
        </Typography>
      </Box>

      <Box sx={{ width: '100%', height: 'calc(100% - 64px)', position: 'relative' }}>
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: 23.4707,
            longitude: 77.9455,
            zoom: 6.5,
            bearing: 0,
            pitch: 0
          }}
          mapStyle={themes?.[selectTheme]}
          interactiveLayerIds={['district-layer']}
          onClick={handleFeatureClick}
          {...other}
        >
          <MapControl />
          {/* India background layer */}
          <Source id="india-source-district" type="geojson" data="/india.geojson">
            <Layer
              id="india-fill-district"
              type="fill"
              paint={{
                'fill-color': '#e0e0e0',
                'fill-opacity': 0.07
              }}
            />
            <Layer
              id="india-outline-district"
              type="line"
              paint={{
                'line-color': '#003366',
                'line-width': 1
              }}
            />
          </Source>
          {filteredData && (
            <Source id="district-source" type="geojson" data={filteredData}>
              <Layer
                id="district-layer"
                type="fill"
                paint={{
                  // per-feature light blue fills and subtle opacity
                  'fill-color': ['get', 'color'],
                  'fill-opacity': 0.28,
                  // keep a stronger blue outline for visual separation
                  'fill-outline-color': OUTLINE_BLUE,
                  'fill-antialias': true
                }}
              />
              <Layer
                id="district-outline"
                type="line"
                paint={{
                  'line-color': OUTLINE_BLUE,
                  'line-width': 3.5,
                  'line-opacity': 0.95
                }}
              />
              {/* polygon label layer removed - using centroid point labels instead */}
            </Source>
          )}

          {/* centroid-based labels: one label per district placed at computed point */}
          {labelPoints && (
            <Source id="district-label-points" type="geojson" data={labelPoints}>
              <Layer
                id="district-point-labels"
                type="symbol"
                layout={{
                  'text-field': ['to-upper', ['get', '_label']],
                  'text-size': 14,
                  'text-allow-overlap': false,
                  'text-ignore-placement': false,
                  'text-anchor': 'center'
                }}
                paint={{
                  'text-color': '#ffffff',
                  'text-halo-color': '#153955',
                  'text-halo-width': 3
                }}
              />
            </Source>
          )}
        </Map>
        <ControlPanel themes={themes} selectTheme={selectTheme} onChangeTheme={handleChangeTheme} />

        {/* Loading Indicator */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" sx={{ mt: 2 }}>Loading District Data...</Typography>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              zIndex: 1000,
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              padding: 2,
              borderRadius: 1,
              maxWidth: '50%'
            }}
          >
            <Typography color="error" variant="body1">
              Error: {error}
            </Typography>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </Box>
        )}
      </Box>

      {/* District Details Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 450,
            boxSizing: 'border-box',
            p: 3,
            overflowY: 'auto'
          }
        }}
      >
        {selectedDistrict && (
          <Stack spacing={2}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight={700}>
                District Details
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />

            {/* District Basic Info */}
            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.primary.lighter }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        bgcolor: OUTLINE_BLUE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        color: 'white',
                        fontWeight: 700
                      }}
                    >
                    <LocationCityIcon sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {selectedDistrict.name || 'District'}
                    </Typography>
                    <Chip
                      label={selectedDistrict.state || 'Madhya Pradesh'}
                      sx={{
                        mt: 0.5,
                        bgcolor: OUTLINE_BLUE,
                        color: 'white'
                      }}
                      size="small"
                    />
                  </Box>
                </Box>

                {selectedDistrict.districtCode && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      District Code
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {selectedDistrict.districtCode}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>

            {/* Location Information */}
            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.info.lighter }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700} color="info.dark">
                  <MapIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Location Information
                </Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    State
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedDistrict.state || 'N/A'}
                  </Typography>
                </Box>

                {selectedDistrict.division && selectedDistrict.division !== 'N/A' && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Division
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedDistrict.division}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {selectedDistrict.stateCode && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        State Code
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedDistrict.stateCode}
                      </Typography>
                    </Box>
                  )}
                  {selectedDistrict.year && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Census Year
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedDistrict.year}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* Administrative Details */}
            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.warning.lighter }}>
              <Stack spacing={2}>
                <Typography variant="h6" fontWeight={700} color="warning.dark">
                  <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Administrative Details
                </Typography>

                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    District Name
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedDistrict.district || selectedDistrict.name || 'N/A'}
                  </Typography>
                </Box>

                {selectedDistrict.districtLGD && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      LGD Code
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {selectedDistrict.districtLGD}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}

export default memo(DistrictMap);

DistrictMap.propTypes = {
  themes: PropTypes.object.isRequired,
  onRegionClick: PropTypes.func,
  other: PropTypes.any
};
