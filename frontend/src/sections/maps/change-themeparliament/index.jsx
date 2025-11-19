import PropTypes from 'prop-types';
import { useState, useCallback, memo, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import Map, { Source, Layer } from 'react-map-gl';
import ControlPanel from './control-panel';
import MapControl from 'components/third-party/map/MapControl';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography, CircularProgress, Drawer, Paper, IconButton, Divider, Stack, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedParliament, setSelectedParliament] = useState(null);
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

        console.log('ashok Parliament Polygons Data:', polyData);
        console.log('ashok Parliament Candidates Data:', candidatesData);

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
          const pcNo = candidate.parliament_id?.['Parliament No']; // Changed to use Parliament No
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
      const pcNo = feature.properties?.PC_NO;  // This is the number that matches with Parliament No
      let yearKey = (filters?.year || '').toString();
      if (yearKey === '' || yearKey === 'all') {
        if (winningCandidates[pcNo]) {
          const allYears = Object.keys(winningCandidates[pcNo]);
          yearKey = allYears.length > 0 ? allYears.sort().reverse()[0] : '';
        }
      }
      let candidate = null;
      // Try to find the winning candidate using the PC_NO
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
    // Prevent default browser navigation/refresh
    try {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      if (e && e.originalEvent) {
        if (typeof e.originalEvent.preventDefault === 'function') e.originalEvent.preventDefault();
        if (typeof e.originalEvent.stopPropagation === 'function') e.originalEvent.stopPropagation();
      }
    } catch (err) {
      console.warn('Error preventing default on map click event:', err);
    }

    if (!e.features?.length) return;

    const feature = e.features[0];
    setSelectedParliament(feature.properties);
    setDrawerOpen(true);
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
          Parliament Map
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
          {/* India background layer */}
          <Source id="india-source" type="geojson" data="/india.geojson">
            <Layer
              id="india-fill"
              type="fill"
              paint={{
                'fill-color': '#e0e0e0',
                'fill-opacity': 0.07
              }}
            />
            <Layer
              id="india-outline"
              type="line"
              paint={{
                'line-color': '#003366',
                'line-width': 1
              }}
            />
          </Source>
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
                    // Show Parliament number (PC_NO) on first line, fall back to AC_NO if missing
                    ['coalesce', ['get', 'PC_NO'], ['get', 'AC_NO'], ''],
                    '\n',
                    // Show constituency name (PC_NAME) on second line, fall back to AC_NAME
                    ['coalesce', ['get', 'PC_NAME'], ['get', 'AC_NAME'], '']
                  ],
                  'text-size': 10,
                  'text-allow-overlap': true,
                  'text-anchor': 'center',
                  'text-justify': 'center'
                }}
                paint={{
                  'text-color': '#000000',
                  // make halo transparent so label background appears transparent
                  'text-halo-color': 'rgba(255,255,255,0)',
                  'text-halo-width': 0
                }}
              />
              {/* party-labels removed to avoid white party text on the map */}
            </Source>
          )}

          {/* Parliament Details Drawer */}
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
            {selectedParliament && (
              <Stack spacing={2}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    Parliament Details
                  </Typography>
                  <IconButton onClick={() => setDrawerOpen(false)} size="small">
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Divider />

                {/* Parliament Basic Info */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.primary.lighter }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          bgcolor: getColorForFeature({ properties: selectedParliament }),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          color: 'white',
                          fontWeight: 700
                        }}
                      >
                        {selectedParliament.PC_NO || '?'}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700} color="primary">
                          {selectedParliament.PC_NAME || 'Parliament Constituency'}
                        </Typography>
                        {selectedParliament.winningParty && (
                          <Chip
                            label={selectedParliament.winningParty}
                            sx={{ 
                              mt: 0.5,
                              bgcolor: getColorForFeature({ properties: selectedParliament }),
                              color: 'white'
                            }}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        PC Number
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {selectedParliament.PC_NO || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Winning Candidate Info */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.success.lighter }}>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={700} color="success.dark">
                      <EmojiEventsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Winning Candidate
                    </Typography>

                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Candidate Name
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {selectedParliament.winningCandidate || 'Unknown'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Election Year
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary">
                          {selectedParliament.election_election_year_id || 'N/A'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Margin
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {selectedParliament.margin !== 'N/A' && !isNaN(selectedParliament.margin) 
                            ? Number(selectedParliament.margin).toLocaleString() 
                            : selectedParliament.margin || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Margin Percentage
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {selectedParliament.margin_percentage !== undefined && selectedParliament.margin_percentage !== null 
                          ? `${(selectedParliament.margin_percentage * 100).toFixed(2)}%` 
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Voting Statistics */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.info.lighter }}>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={700} color="info.dark">
                      <HowToVoteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Voting Statistics
                    </Typography>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Candidate Votes
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="primary">
                          {selectedParliament.candidate_votes !== undefined && selectedParliament.candidate_votes !== null
                            ? Number(selectedParliament.candidate_votes).toLocaleString()
                            : 'N/A'}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                          Total Votes
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="info.main">
                          {selectedParliament.total_votes_parliament !== undefined && selectedParliament.total_votes_parliament !== null
                            ? Number(selectedParliament.total_votes_parliament).toLocaleString()
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>

                {/* Location Information */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.warning.lighter }}>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={700} color="warning.dark">
                      <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Location Information
                    </Typography>

                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Parliament Constituency
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedParliament.PC_NAME || 'N/A'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        State
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedParliament.ST_NAME || 'N/A'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Last 3 Years Winning Parties */}
                <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.grey[100] }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Last 3 Years Winning Parties
                  </Typography>
                  <Stack spacing={1}>
                    {(() => {
                      const pcNo = selectedParliament.PC_NO;
                      let years = [];
                      if (pcNo && winningCandidates && winningCandidates[pcNo]) {
                        years = Object.keys(winningCandidates[pcNo])
                          .map(y => y.toString())
                          .sort((a, b) => b.localeCompare(a));
                      }
                      const last3Years = years.slice(0, 3);
                      return last3Years.length > 0 ? last3Years.map(year => {
                        const candidate = winningCandidates[pcNo][year];
                        const partyName = candidate?.party_id?.name || 'Unknown';
                        return (
                          <Box key={year} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                            <Typography variant="body2" fontWeight={600}>
                              {year}
                            </Typography>
                            <Chip
                              label={partyName}
                              size="small"
                              sx={{ bgcolor: partyColors[partyName] || partyColors['default'], color: 'white' }}
                            />
                          </Box>
                        );
                      }) : (
                        <Typography variant="body2" color="text.secondary">
                          No historical data available
                        </Typography>
                      );
                    })()}
                  </Stack>
                </Paper>
              </Stack>
            )}
          </Drawer>
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
