import PropTypes from 'prop-types';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import ControlPanel from './control-panel';
import MapControl from 'components/third-party/map/MapControl';
import { Box, Typography, CircularProgress } from '@mui/material';

// Party color mapping
const partyColors = {
  'Bharatiya Janata Party': '#FF9933',
  'Indian National Congress': '#19AAED',
  'Bahujan Samaj Party': '#004B00',
  'Aam Aadmi Party': '#0072B5',
  'Gondwana Ganatantra Party': '#800080',
  'Independent': '#A9A9A9',
  'Samajwadi Party': '#FF0000',
  'Azad Samaj Party': '#FFA500',
  'Janata Dal': '#008080',
  'Communist Party of India': '#FF4500',
  'Bharat Adivasi Party': '#4B0082',
  'All India Majlis-e-Ittehadul Muslimeen': '#006400',
  'Communist Party of India (Marxist)': '#8B0000',
  'Lok Janshakti Party': '#000080',
  'Other Registered (Unrecognised) Parties': '#696969',
  default: '#CCCCCC'
};

// ---- Robust Feature Extractor ----
function extractFeatures(data) {
  if (!data) return [];
  if (Array.isArray(data)) {
    for (const item of data) {
      const f = extractFeatures(item);
      if (f.length) return f;
    }
  }
  if (Array.isArray(data.features)) return data.features;
  if (data.data) return extractFeatures(data.data);
  return [];
}

function AssemblyConstituencyMap({ themes, selectedYear = '', ...other }) {
  const theme = useTheme();
  const [selectTheme, setSelectTheme] = useState('outdoors');
  const [assemblyData, setAssemblyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [assemblyResponse, predictionResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_APP_API_URL}/assembly-polygons`),
          fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates/predict/2028`)
        ]);

        if (!assemblyResponse.ok) throw new Error('Failed to fetch assembly data');
        if (!predictionResponse.ok) throw new Error('Failed to fetch predictions');

        const assemblyDataJson = await assemblyResponse.json();
        const predictionData = await predictionResponse.json();

        const features = extractFeatures(assemblyDataJson);
        if (!features.length) throw new Error('No assembly features found');

        // Map predictions by assembly_id (lowercase, trimmed)
        const predictionsByAssemblyId = {};
        (predictionData.predictions || []).forEach(pred => {
          if (pred.assembly_id) {
            predictionsByAssemblyId[String(pred.assembly_id).toLowerCase().trim()] = pred;
          }
        });

        // Try to match polygons to predictions by _id, ASSEMBLY_ID, or AC_NO (preferred), fallback to AC_NAME
        features.forEach(feature => {
          let pred = null;
          // 1. Try to match by _id or ASSEMBLY_ID
          let assemblyId = '';
          if (feature.properties?._id) {
            assemblyId = String(feature.properties._id).toLowerCase().trim();
            pred = predictionsByAssemblyId[assemblyId];
          } else if (feature.properties?.ASSEMBLY_ID) {
            assemblyId = String(feature.properties.ASSEMBLY_ID).toLowerCase().trim();
            pred = predictionsByAssemblyId[assemblyId];
          }

          // 2. Try to match by AC_NO (from polygon) and assembly_no (from prediction)
          if (!pred && feature.properties?.AC_NO != null) {
            const acNo = String(feature.properties.AC_NO).toLowerCase().trim();
            pred = Object.values(predictionsByAssemblyId).find(p =>
              p.assembly_no != null && String(p.assembly_no).toLowerCase().trim() === acNo
            );
          }

          // 3. Fallback: try to match by AC_NAME (case-insensitive, trimmed)
          if (!pred && feature.properties?.AC_NAME) {
            const acName = String(feature.properties.AC_NAME).toLowerCase().trim();
            pred = Object.values(predictionsByAssemblyId).find(p =>
              p.assembly_name && String(p.assembly_name).toLowerCase().trim() === acName
            );
          }

          if (pred?.predicted_party) {
            feature.properties.winningParty = pred.predicted_party.name || 'Unknown';
            feature.properties.margin = `Predicted (${pred.win_count} wins)`;
            feature.properties.electionYear = predictionData.year || '2028';
            feature.properties.AC_NAME = pred.assembly_name || feature.properties.AC_NAME;
          } else {
            feature.properties.winningParty = 'Unknown';
            feature.properties.margin = 'N/A';
            feature.properties.electionYear = predictionData.year || '2028';
          }
        });

        setAssemblyData({ type: 'FeatureCollection', features });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFeatureClick = (e) => {
    if (!e.features?.length) return;
    const feature = e.features[0];
    setPopupInfo({
      longitude: e.lngLat.lng,
      latitude: e.lngLat.lat,
      properties: feature.properties
    });
  };

  const getColorForFeature = (feature) => {
    return partyColors[feature.properties?.winningParty] || partyColors.default;
  };

  const handleChangeTheme = useCallback((value) => setSelectTheme(value), []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 23.4707,
          longitude: 77.9455,
          zoom: 6.5
        }}
        mapStyle={themes?.[selectTheme]}
        interactiveLayerIds={['assembly-layer']}
        onClick={handleFeatureClick}
        {...other}
      >
        <MapControl />

        {assemblyData && (
          <Source id="assembly-source" type="geojson" data={assemblyData}>
            <Layer
              id="assembly-layer"
              type="fill"
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'winningParty'],
                  ...Object.entries(partyColors)
                    .filter(([party]) => party !== 'default')
                    .flatMap(([party, color]) => [party, color]),
                  partyColors.default
                ],
                'fill-opacity': 0.7,
                'fill-outline-color': '#000'
              }}
            />
            <Layer
              id="assembly-outline"
              type="line"
              paint={{
                'line-color': '#000',
                'line-width': 1
              }}
            />
          </Source>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            closeButton={true}
            onClose={() => setPopupInfo(null)}
            anchor="bottom"
            closeOnClick={false}
          >
            <div style={{ minWidth: '220px', padding: '8px' }}>
              <h4>{popupInfo.properties.AC_NAME || 'Assembly Constituency'}</h4>
              <div style={{
                backgroundColor: getColorForFeature({ properties: popupInfo.properties }),
                padding: '4px',
                color: '#fff',
                borderRadius: '4px',
                marginBottom: '8px'
              }}>
                {popupInfo.properties.winningParty || 'Unknown Party'}
              </div>
              <p><strong>Margin:</strong> {popupInfo.properties.margin}</p>
              <p><strong>Election Year:</strong> {popupInfo.properties.electionYear}</p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Theme control */}
      <ControlPanel themes={themes} selectTheme={selectTheme} onChangeTheme={handleChangeTheme} />

      {/* Legend */}
      <Box sx={{
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 2,
        borderRadius: 1,
        boxShadow: 3
      }}>
        <Typography variant="h6">Party Colors</Typography>
        {/* {Object.entries(partyColors).map(([party, color]) => {
          if (party === 'default') return null;
          return (
            <Box key={party} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{
                width: 16, height: 16,
                backgroundColor: color,
                mr: 1, border: '1px solid #000'
              }} />
              <Typography variant="body2">{party}</Typography>
            </Box>
          );
        })} */}
      </Box>

      {/* Loader */}
      {loading && (
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <CircularProgress />
          <Typography>Loading Data...</Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Box sx={{
          position: 'absolute', bottom: 20, left: 20,
          backgroundColor: 'rgba(255,0,0,0.2)', padding: 2, borderRadius: 1
        }}>
          <Typography color="error">Error: {error}</Typography>
          <button onClick={() => window.location.reload()}>Reload</button>
        </Box>
      )}
    </div>
  );
}

AssemblyConstituencyMap.propTypes = {
  themes: PropTypes.object.isRequired,
  selectedYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  other: PropTypes.any
};

export default memo(AssemblyConstituencyMap);

