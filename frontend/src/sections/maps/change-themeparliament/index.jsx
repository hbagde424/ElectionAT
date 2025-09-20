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

  // Initial data fetch (parliament polygons and all parliament candidates)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [polyResponse, candidatesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-polygons`),
          fetch(`${import.meta.env.VITE_APP_API_URL}/parliament-candidates?all=true`)
        ]);
        if (!polyResponse.ok) throw new Error('Failed to fetch parliament polygons');
        if (!candidatesResponse.ok) throw new Error('Failed to fetch parliament candidates');
        const polyData = await polyResponse.json();
        const candidatesData = await candidatesResponse.json();
        // Normalize the parliament polygons API response structure
        let features = [];
        if (polyData.features) {
          features = polyData.features;
        } else if (polyData.data?.[0]?.features) {
          features = polyData.data[0].features;
        } else if (Array.isArray(polyData) && polyData[0]?.features) {
          features = polyData[0].features;
        }
        if (features.length === 0) {
          throw new Error('No parliament features found in response');
        }

        // Process winning candidates data by PC_NO
        const winningParties = new Set();
        const candidatesByPcNo = {}; // { [pcNo]: { [year]: candidate } }
        const yearsSet = new Set();

        candidatesData.data.forEach(candidate => {
          const pcNo = candidate.parliament_id?.PC_NO;
          let yearVal = '';
          if (candidate.election_year_id) {
            if (typeof candidate.election_year_id === 'object' && candidate.election_year_id.year) {
              yearVal = candidate.election_year_id.year.toString();
            } else if (typeof candidate.election_year_id === 'number' || typeof candidate.election_year_id === 'string') {
              yearVal = candidate.election_year_id.toString();
            }
          }
          if (pcNo && yearVal) {
            if (!candidatesByPcNo[pcNo]) candidatesByPcNo[pcNo] = {};
            candidatesByPcNo[pcNo][yearVal] = candidate;
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
        setWinningCandidates(candidatesByPcNo);
      } catch (err) {
        console.error('Data loading error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  // Update parliamentData features with winning info for selected year filter (by PC_NO)
  useEffect(() => {
    if (!assemblyData || !winningCandidates) return;
    // Deep copy features to avoid mutating state directly
    const features = assemblyData.features.map(feature => {
      const pcNo = feature.properties?.PC_NO;
      let yearKey = (filters?.year || '').toString();
      if (yearKey === '' || yearKey === 'all') {
        if (winningCandidates[pcNo]) {
          const allYears = Object.keys(winningCandidates[pcNo]);
          yearKey = allYears.length > 0 ? allYears.sort().reverse()[0] : '';
        }
      }
      let candidate = null;
      if (pcNo && winningCandidates[pcNo] && yearKey && winningCandidates[pcNo][yearKey]) {
        candidate = winningCandidates[pcNo][yearKey];
      }
      // Clone feature
      const newFeature = { ...feature, properties: { ...feature.properties } };
      if (candidate) {
        newFeature.properties.winningParty = candidate.party_id?.name || 'Unknown';
        newFeature.properties.winningCandidate = candidate.name || candidate.candidate_id?.name || 'Unknown';
        newFeature.properties.margin = candidate.margin || 'N/A';
        newFeature.properties.election_election_year_id =
          (candidate.election_year_id && typeof candidate.election_year_id === 'object' && candidate.election_year_id.year)
            ? candidate.election_year_id.year
            : (typeof candidate.election_year_id === 'number' || typeof candidate.election_year_id === 'string')
              ? candidate.election_year_id
              : 'N/A';
        newFeature.properties.margin_percentage = candidate.margin_percentage ?? null;
        newFeature.properties.candidate_votes = candidate.candidate_votes ?? null;
        newFeature.properties.total_votes_parliament = candidate.total_votes_parliament ?? null;
        newFeature.properties.position_result = candidate.position_result ?? null;
      } else {
        newFeature.properties.winningParty = 'Unknown';
        newFeature.properties.winningCandidate = 'Unknown';
        newFeature.properties.margin = 'N/A';
        newFeature.properties.election_election_year_id = 'N/A';
        newFeature.properties.margin_percentage = null;
        newFeature.properties.candidate_votes = null;
        newFeature.properties.total_votes_parliament = null;
        newFeature.properties.position_result = null;
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

  // Filter parliament polygons by PC_NAME, party, and year
  const getFilteredData = () => {
    if (!assemblyData) return null;

    const filteredFeatures = assemblyData.features.filter(feature => {
      const pcMatch = filters.pcName === 'all' || feature.properties?.PC_NAME === filters.pcName;
      const partyMatch = filters.party === 'all' || feature.properties?.winningParty === filters.party;
      // Compare year as string, and only match if filter is not 'all'
      const yearValue = feature.properties?.election_election_year_id?.toString();
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
          {/* <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="pc-filter-label">Parliament Constituency</InputLabel>
            <Select
              labelId="pc-filter-label"
              value={filters.pcName}
              label="Parliament Constituency"
              onChange={(e) => handleFilterChange('pcName', e.target.value)}
            >
              <MenuItem value="all">All PC</MenuItem>
              {pcNames.map(pc => (
                <MenuItem key={pc} value={pc}>{pc}</MenuItem>
              ))}
            </Select>
          </FormControl> */}
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
                  'text-field': [
                    'concat',
                    ['get', 'AC_NO'],
                    '\n',
                    ['get', 'AC_NAME']
                  ],
                  'text-size': 10,
                  'text-allow-overlap': true,
                  'text-anchor': 'center',
                  'text-justify': 'center'
                }}
                paint={{
                  'text-color': '#000000',
                  'text-halo-color': '#FFFFFF',
                  'text-halo-width': 2
                }}
              />
              {/* Party name labels: show which party won each polygon (hide Unknown/N/A/empty) */}
              <Layer
                id="party-labels"
                type="symbol"
                // Only show labels when winningParty is present and not Unknown/N/A
                filter={[
                  'all',
                  ['!=', ['get', 'winningParty'], 'Unknown'],
                  ['!=', ['get', 'winningParty'], 'N/A'],
                  ['!=', ['get', 'winningParty'], '']
                ]}
                layout={{
                  'text-field': ['get', 'winningParty'],
                  'text-size': 11,
                  'text-allow-overlap': true,
                  'text-anchor': 'center'
                }}
                paint={{
                  'text-color': '#ffffff',
                  'text-halo-color': '#000000',
                  'text-halo-width': 1
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
                  {popupInfo.properties.PC_NAME || 'Parliament Constituency'}
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
                  <p><strong>Margin:</strong> {popupInfo.properties.margin ?? 'N/A'}</p>
                  <p><strong>Margin %:</strong> {popupInfo.properties.margin_percentage !== undefined && popupInfo.properties.margin_percentage !== null ? `${(popupInfo.properties.margin_percentage * 100).toFixed(2)}%` : 'N/A'}</p>
                  <p><strong>Candidate Votes:</strong> {popupInfo.properties.candidate_votes ?? 'N/A'}</p>
                  <p><strong>Total Votes (PC):</strong> {popupInfo.properties.total_votes_parliament ?? 'N/A'}</p>
                  <p><strong>Election Year:</strong> {popupInfo.properties.election_election_year_id || 'N/A'}</p>
                  <p><strong>PC Number:</strong> {popupInfo.properties.PC_NO || 'N/A'}</p>
                  <p><strong>Parliament Constituency:</strong> {popupInfo.properties.PC_NAME || 'N/A'}</p>
                  <p><strong>State:</strong> {popupInfo.properties.ST_NAME || 'N/A'}</p>
                  <p><strong>Position Result:</strong> {popupInfo.properties.position_result || 'N/A'}</p>
                </div>
// NOTE: This component matches parliament candidate data to polygons by PC_NO, not AC_NO. The map and popups show winning party/candidate for each parliament constituency (PC) using PC_NO as the key. If no candidate is found for a PC_NO/year, fallback values are shown.
              </div>
            </Popup>
          )}
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
        </Map>
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
