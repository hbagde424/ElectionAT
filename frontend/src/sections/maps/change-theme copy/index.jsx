import PropTypes from 'prop-types';
import { useState, useCallback, memo, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import ControlPanel from './control-panel';
import MapControl from 'components/third-party/map/MapControl';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, CircularProgress } from '@mui/material';

// Complete Party color mapping
const partyColors = {
  'Bharatiya Janata Party': '#FF9933', // Saffron (BJP)
  'Indian National Congress': '#19AAED', // Light Blue (INC)
  'Bahujan Samaj Party': '#004B00', // Dark Green (BSP)
  'Aam Aadmi Party': '#0072B5', // Blue (AAP)
  'Gondwana Ganatantra Party': '#800080', // Purple (GGP)
  'Independent': '#A9A9A9', // Gray (INDEPENDENT)
  'Samajwadi Party': '#FF0000', // Red (SP)
  'Azad Samaj Party': '#FFA500', // Orange (KANSHI RAM)
  'Janata Dal': '#008080', // Teal (UNITED)
  'Communist Party of India': '#FF4500', // OrangeRed (CPI)
  'Bharat Adivasi Party': '#4B0082', // Indigo (BAP)
  'All India Majlis-e-Ittehadul Muslimeen': '#006400', // DarkGreen (AIMIM)
  'Communist Party of India (Marxist)': '#8B0000', // DarkRed (CPI(M))
  'Lok Janshakti Party': '#000080', // Navy (RAM VILAS)
  'Other Registered (Unrecognised) Parties': '#696969', // DimGray (OTHER)
  'default': '#CCCCCC' // Light Gray for others
};

function AssemblyConstituencyMap({ themes, selectedYear = '', ...other }) {
  const theme = useTheme();
  const [selectTheme, setSelectTheme] = useState('outdoors');
  const [assemblyData, setAssemblyData] = useState(null);
  const [winningCandidates, setWinningCandidates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [filters, setFilters] = useState({
    pcName: 'all',
    party: 'all',
    year: selectedYear || 'all'
  });
  const [pcNames, setPcNames] = useState([]);
  const [parties, setParties] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const mapRef = useRef(null);

  // Initial data fetch (assembly polygons and all candidates)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [assemblyResponse, candidatesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_APP_API_URL}/assembly-polygons`),
          fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?all=true`)
        ]);
        if (!assemblyResponse.ok) throw new Error('Failed to fetch assembly data');
        if (!candidatesResponse.ok) throw new Error('Failed to fetch candidates data');
        const assemblyData = await assemblyResponse.json();
        const candidatesData = await candidatesResponse.json();

        // Normalize the assembly API response structure
        let features = [];
        if (assemblyData.features) {
          features = assemblyData.features;
        } else if (assemblyData.data?.[0]?.features) {
          features = assemblyData.data[0].features;
        } else if (Array.isArray(assemblyData) && assemblyData[0]?.features) {
          features = assemblyData[0].features;
        }
        if (features.length === 0) {
          throw new Error('No assembly features found in response');
        }

        // Process winning candidates data
        const winningParties = new Set();
        const candidatesByAcNo = {}; // { [acNo]: { [year]: candidate } }
        const yearsSet = new Set();

        candidatesData.data.forEach(candidate => {
          const acNo = candidate.assembly_id?.AC_NO;
          let yearVal = '';
          if (candidate.year_id) {
            if (typeof candidate.year_id === 'object' && candidate.year_id.year) {
              yearVal = candidate.year_id.year.toString();
            } else if (typeof candidate.year_id === 'number' || typeof candidate.year_id === 'string') {
              yearVal = candidate.year_id.toString();
            }
          }
          if (acNo && yearVal) {
            if (!candidatesByAcNo[acNo]) candidatesByAcNo[acNo] = {};
            candidatesByAcNo[acNo][yearVal] = candidate;
            if (candidate.party_id?.name) {
              winningParties.add(candidate.party_id.name);
            }
            yearsSet.add(yearVal);
          }
        });

        // Extract unique PC names for filters
        const uniquePcNames = new Set();
        features.forEach(feature => {
          if (feature.properties?.PC_NAME) {
            uniquePcNames.add(feature.properties.PC_NAME);
          }
        });

        setPcNames(Array.from(uniquePcNames).sort());
        setParties(Array.from(winningParties).sort());
        setAvailableYears(Array.from(yearsSet).sort().reverse()); // Sort years in descending order
        setAssemblyData({
          type: 'FeatureCollection',
          features: features
        });
        setWinningCandidates(candidatesByAcNo);
      } catch (err) {
        console.error('Data loading error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  // Update assemblyData features with winning info for selected year filter
  useEffect(() => {
    if (!assemblyData || !winningCandidates) return;
    // Deep copy features to avoid mutating state directly
    const features = assemblyData.features.map(feature => {
      const acNo = feature.properties?.AC_NO;
      let yearKey = (filters?.year || '').toString();
      if (yearKey === '' || yearKey === 'all') {
        if (winningCandidates[acNo]) {
          const allYears = Object.keys(winningCandidates[acNo]);
          yearKey = allYears.length > 0 ? allYears.sort().reverse()[0] : '';
        }
      }
      let candidate = null;
      if (acNo && winningCandidates[acNo] && yearKey && winningCandidates[acNo][yearKey]) {
        candidate = winningCandidates[acNo][yearKey];
      }
      // Clone feature
      const newFeature = { ...feature, properties: { ...feature.properties } };
      if (candidate) {
        newFeature.properties.winningParty = candidate.party_id?.name || 'Unknown';
        newFeature.properties.winningCandidate = candidate.name || candidate.candidate_id?.name || 'Unknown';
        newFeature.properties.margin = candidate.margin || 'N/A';
        newFeature.properties.electionYear =
          (candidate.year_id && typeof candidate.year_id === 'object' && candidate.year_id.year)
            ? candidate.year_id.year
            : (typeof candidate.year_id === 'number' || typeof candidate.year_id === 'string')
              ? candidate.year_id
              : 'N/A';
      } else {
        newFeature.properties.winningParty = 'Unknown';
        newFeature.properties.winningCandidate = 'Unknown';
        newFeature.properties.margin = 'N/A';
        newFeature.properties.electionYear = 'N/A';
      }
      return newFeature;
    });
    setAssemblyData(prev => ({ ...prev, features }));
  }, [filters.year, winningCandidates]);

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
      const partyMatch = filters.party === 'all' || feature.properties?.winningParty === filters.party;
      // Fix: Compare year as string, and only match if filter is not 'all'
      const yearValue = feature.properties?.electionYear?.toString();
      const filterYear = filters.year?.toString();
      const yearMatch = filterYear === 'all' || yearValue === filterYear;
      return pcMatch && partyMatch && yearMatch;
    });

    return {
      type: 'FeatureCollection',
      features: filteredFeatures
    };
  };

  const getColorForFeature = (feature) => {
    return partyColors[feature.properties?.winningParty] || partyColors['default'];
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
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Heading and Filters Row */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Assembly Map
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
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
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="party-filter-label">Winning Party</InputLabel>
            <Select
              labelId="party-filter-label"
              value={filters.party}
              label="Winning Party"
              onChange={(e) => handleFilterChange('party', e.target.value)}
            >
              <MenuItem value="all">All Parties</MenuItem>
              {parties.map(party => (
                <MenuItem key={party} value={party}>{party}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="year-filter-label">Election Year</InputLabel>
            <Select
              labelId="year-filter-label"
              value={filters.year}
              label="Election Year"
              onChange={(e) => handleFilterChange('year', e.target.value)}
            >
              <MenuItem value="all">All Years</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Map Section */}
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
                    'match',
                    ['get', 'winningParty'],
                    'Bharatiya Janata Party', partyColors['Bharatiya Janata Party'],
                    'Indian National Congress', partyColors['Indian National Congress'],
                    'Bahujan Samaj Party', partyColors['Bahujan Samaj Party'],
                    'Aam Aadmi Party', partyColors['Aam Aadmi Party'],
                    'Gondwana Ganatantra Party', partyColors['Gondwana Ganatantra Party'],
                    'Independent', partyColors['Independent'],
                    'Samajwadi Party', partyColors['Samajwadi Party'],
                    'Azad Samaj Party', partyColors['Azad Samaj Party'],
                    'Janata Dal', partyColors['Janata Dal'],
                    'Communist Party of India', partyColors['Communist Party of India'],
                    'Bharat Adivasi Party', partyColors['Bharat Adivasi Party'],
                    'All India Majlis-e-Ittehadul Muslimeen', partyColors['All India Majlis-e-Ittehadul Muslimeen'],
                    'Communist Party of India (Marxist)', partyColors['Communist Party of India (Marxist)'],
                    'Lok Janshakti Party', partyColors['Lok Janshakti Party'],
                    'Other Registered (Unrecognised) Parties', partyColors['Other Registered (Unrecognised) Parties'],
                    partyColors['default']
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
                    {popupInfo.properties.winningParty || 'Unknown Party'}
                  </span>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <p><strong>Winning Candidate:</strong> {popupInfo.properties.winningCandidate || 'Unknown'}</p>
                  <p><strong>Margin:</strong> {popupInfo.properties.margin || 'N/A'}</p>
                  <p><strong>Election Year:</strong> {popupInfo.properties.electionYear || 'N/A'}</p>
                  <p><strong>AC Number:</strong> {popupInfo.properties.AC_NO || 'N/A'}</p>
                  <p><strong>Parliament Constituency:</strong> {popupInfo.properties.PC_NAME || 'N/A'}</p>
                  <p><strong>State:</strong> {popupInfo.properties.ST_NAME || 'N/A'}</p>
                </div>
              </div>
            </Popup>
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
            <Typography variant="body1" sx={{ mt: 2 }}>Loading Data...</Typography>
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
    </Box>
  );
}

export default memo(AssemblyConstituencyMap);

AssemblyConstituencyMap.propTypes = {
  themes: PropTypes.object.isRequired,
  selectedYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  other: PropTypes.any
};
