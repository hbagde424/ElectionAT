import PropTypes from 'prop-types';
import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import ControlPanel from './control-panel';
import MapControl from 'components/third-party/map/MapControl';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, CircularProgress } from '@mui/material';

function AssemblyConstituencyMap({ themes, ...other }) {
  const theme = useTheme();
  const [selectTheme, setSelectTheme] = useState('outdoors');
  const [assemblyData, setAssemblyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [filters, setFilters] = useState({
    pcName: 'all',
    acType: 'all'
  });
  const [pcNames, setPcNames] = useState([]);
  const [acTypes, setAcTypes] = useState([]);
  const mapRef = useRef(null);

  // Color coding for reserved constituencies
  const constituencyColors = {
    'SC': '#800080',  // Purple for SC
    'ST': '#FFA500',  // Orange for ST
    'GEN': '#CCCCCC', // Gray for General
    'default': '#00FF00' // Green for unknown
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch assembly polygons
        const response = await fetch('http://localhost:5000/api/assembly-polygons');
        if (!response.ok) throw new Error('Failed to fetch assembly data');
        const data = await response.json();

        // Normalize the API response structure
        let features = [];
        if (data.features) {
          features = data.features;
        } else if (data.data?.[0]?.features) {
          features = data.data[0].features;
        } else if (Array.isArray(data) && data[0]?.features) {
          features = data[0].features;
        }

        if (features.length === 0) {
          throw new Error('No assembly features found in response');
        }

        // Extract unique PC names and AC types for filters
        const uniquePcNames = new Set();
        const uniqueAcTypes = new Set();
        
        features.forEach(feature => {
          if (feature.properties?.PC_NAME) {
            uniquePcNames.add(feature.properties.PC_NAME);
          }
          // Detect AC type from name (SC/ST) or use GEN as default
          const acType = feature.properties?.AC_NAME?.includes('(SC)') ? 'SC' : 
                        feature.properties?.AC_NAME?.includes('(ST)') ? 'ST' : 'GEN';
          uniqueAcTypes.add(acType);
          
          // Add the detected type to properties
          feature.properties.AC_TYPE = acType;
        });

        setPcNames(Array.from(uniquePcNames).sort());
        setAcTypes(Array.from(uniqueAcTypes).sort());
        setAssemblyData({
          type: 'FeatureCollection',
          features: features
        });

      } catch (err) {
        console.error('Data loading error:', err);
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

  const getFilteredData = () => {
    if (!assemblyData) return null;

    const filteredFeatures = assemblyData.features.filter(feature => {
      const pcMatch = filters.pcName === 'all' || feature.properties?.PC_NAME === filters.pcName;
      const typeMatch = filters.acType === 'all' || feature.properties?.AC_TYPE === filters.acType;
      return pcMatch && typeMatch;
    });

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
  };

  const getColorForFeature = (feature) => {
    if (feature.properties?.AC_NAME?.includes('(SC)')) return constituencyColors['SC'];
    if (feature.properties?.AC_NAME?.includes('(ST)')) return constituencyColors['ST'];
    return constituencyColors['GEN'];
  };

  const handleChangeTheme = useCallback((value) => setSelectTheme(value), []);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const filteredData = getFilteredData();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
        interactiveLayerIds={['assembly-layer']}
        onClick={handleFeatureClick}
        {...other}
      >
        <MapControl />
        
        {filteredData && (
          <Source id="assembly-source" type="geojson" data={filteredData}>
            <Layer
              id="assembly-layer"
              type="fill"
              paint={{
                'fill-color': [
                  'case',
                  ['==', ['get', 'AC_TYPE'], 'SC'], constituencyColors['SC'],
                  ['==', ['get', 'AC_TYPE'], 'ST'], constituencyColors['ST'],
                  constituencyColors['GEN']
                ],
                'fill-opacity': 0.7,
                'fill-outline-color': '#000000',
                'fill-antialias': true
              }}
            />
            <Layer
              id="assembly-outline"
              type="line"
              paint={{
                'line-color': '#000000',
                'line-width': 1
              }}
            />
            <Layer
              id="assembly-labels"
              type="symbol"
              layout={{
                'text-field': ['get', 'AC_NO'],
                'text-size': 12,
                'text-allow-overlap': true
              }}
              paint={{
                'text-color': '#000000',
                'text-halo-color': '#FFFFFF',
                'text-halo-width': 2
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
              <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
                {popupInfo.properties.AC_NAME || 'Assembly Constituency'}
              </h4>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '8px',
                padding: '4px',
                backgroundColor: getColorForFeature({ properties: popupInfo.properties }),
                borderRadius: '4px'
              }}>
                <span style={{ color: '#FFF', padding: '0 4px' }}>
                  {popupInfo.properties.AC_TYPE || 'GEN'} Constituency
                </span>
              </div>
              <div style={{ marginTop: '8px' }}>
                <p><strong>AC Number:</strong> {popupInfo.properties.AC_NO || 'N/A'}</p>
                <p><strong>Parliament Constituency:</strong> {popupInfo.properties.PC_NAME || 'N/A'}</p>
                <p><strong>PC Number:</strong> {popupInfo.properties.PC_NO || 'N/A'}</p>
                <p><strong>State:</strong> {popupInfo.properties.ST_NAME || 'N/A'}</p>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      <ControlPanel themes={themes} selectTheme={selectTheme} onChangeTheme={handleChangeTheme} />

      {/* Filter Panel */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: 2,
          borderRadius: 1,
          minWidth: 250,
          boxShadow: 3
        }}
      >
        <Typography variant="h6" gutterBottom>
          Assembly Filters
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }} size="small">
          <InputLabel id="pc-filter-label">Parliament Constituency</InputLabel>
          <Select
            labelId="pc-filter-label"
            value={filters.pcName}
            label="Parliament Constituency"
            onChange={(e) => handleFilterChange('pcName', e.target.value)}
          >
            <MenuItem value="all">All PCs</MenuItem>
            {pcNames.map(pc => (
              <MenuItem key={pc} value={pc}>{pc}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id="acType-filter-label">Constituency Type</InputLabel>
          <Select
            labelId="acType-filter-label"
            value={filters.acType}
            label="Constituency Type"
            onChange={(e) => handleFilterChange('acType', e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            {acTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type === 'SC' ? 'Scheduled Caste' : 
                 type === 'ST' ? 'Scheduled Tribe' : 'General'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: 2,
          borderRadius: 1,
          width: 200,
          boxShadow: 3
        }}
      >
        <Typography variant="h6" gutterBottom>
          Constituency Types
        </Typography>
        {Object.entries({
          'SC': 'Scheduled Caste',
          'ST': 'Scheduled Tribe',
          'GEN': 'General'
        }).map(([type, label]) => (
          <Box key={type} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box 
              sx={{ 
                width: 16, 
                height: 16, 
                backgroundColor: constituencyColors[type], 
                mr: 1,
                border: '1px solid #000'
              }} 
            />
            <Typography variant="body2">{label}</Typography>
          </Box>
        ))}
      </Box>

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
          <Typography variant="body1" sx={{ mt: 2 }}>Loading Assembly Data...</Typography>
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
    </div>
  );
}

export default memo(AssemblyConstituencyMap);

AssemblyConstituencyMap.propTypes = {
  themes: PropTypes.object.isRequired,
  other: PropTypes.any
};