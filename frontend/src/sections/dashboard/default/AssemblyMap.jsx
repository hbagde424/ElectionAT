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
import MapControl from 'components/third-party/map/MapControl';
import ControlPanel from '../../maps/change-theme copy/control-panel';
import { usePermissions } from 'contexts/PermissionContext';
import { filterAssembliesByHierarchy } from 'utils/hierarchyUtils';

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
  'default': '#CCCCCC'
};

function AssemblyMap({ themes, selectedYear = '', onAssemblySelect, ...other }) {
  const theme = useTheme();
  const { userHierarchy, loading: hierarchyLoading } = usePermissions();
  const [selectTheme, setSelectTheme] = useState('outdoors');
  const [assemblyData, setAssemblyData] = useState(null);
  const [winningCandidates, setWinningCandidates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAssembly, setSelectedAssembly] = useState(null);
  const [filters, setFilters] = useState({
    pcName: 'all',
    party: 'all',
    year: selectedYear || 'all'
  });
  const [parties, setParties] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    console.log('🔄 AssemblyMap useEffect triggered');
    console.log('  hierarchyLoading:', hierarchyLoading);
    console.log('  userHierarchy:', userHierarchy);
    
    if (hierarchyLoading) {
      console.log('⏳ Waiting for hierarchy to load...');
      setLoading(true);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('serviceToken');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        console.log('📡 Fetching assembly data...');
        
        const [assemblyResponse, candidatesResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies?limit=10000`, { 
            headers: { Authorization: `Bearer ${token}` } 
          }),
          fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates?limit=10000`, { 
            headers: { Authorization: `Bearer ${token}` } 
          })
        ]);

        if (!assemblyResponse.ok || !candidatesResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const assemblyJson = await assemblyResponse.json();
        const candidatesJson = await candidatesResponse.json();

        let features = [];
        let assembliesToUse = [];

        if (Array.isArray(assemblyJson.data)) {
          const allAssemblies = assemblyJson.data;
          console.log('📊 Total assemblies from API:', allAssemblies.length);

          // Use utility function to filter by hierarchy
          assembliesToUse = filterAssembliesByHierarchy(allAssemblies, userHierarchy);
          console.log('✅ Assemblies after filtering:', assembliesToUse.length);

          // Extract features
          assembliesToUse.forEach(assembly => {
            if (assembly.polygon) {
              if (assembly.polygon.type === 'Feature') {
                features.push({
                  ...assembly.polygon,
                  properties: {
                    ...assembly.polygon.properties,
                    assembly_id: assembly._id
                  }
                });
              } else if (assembly.polygon.type === 'FeatureCollection' && Array.isArray(assembly.polygon.features)) {
                assembly.polygon.features.forEach(feat => {
                  features.push({
                    ...feat,
                    properties: {
                      ...feat.properties,
                      assembly_id: assembly._id
                    }
                  });
                });
              }
            }
          });
        }

        if (!features || features.length === 0) {
          throw new Error('No assembly features found');
        }

        console.log('🗺️ Total features to display:', features.length);
        setAssemblyData({ type: 'FeatureCollection', features });

        // Create a Set of AC_NOs from filtered assemblies for candidate filtering
        const filteredAcNos = new Set();
        assembliesToUse.forEach(assembly => {
          // Try multiple ways to get AC_NO from assembly
          const acNo = assembly.AC_NO || assembly.ac_no || assembly.assembly_no;
          if (acNo) {
            filteredAcNos.add(acNo);
          }
        });
        console.log('🔍 Filtered AC_NOs:', Array.from(filteredAcNos));
        console.log('🔍 Total filtered assemblies:', assembliesToUse.length);
        console.log('🔍 Sample assembly:', assembliesToUse[0]);

        // Process candidates - ONLY for filtered assemblies
        const candidates = candidatesJson.data || [];
        const winningMap = {};
        const partySet = new Set();
        const yearSet = new Set();

        console.log('📊 Processing', candidates.length, 'total candidates');
        console.log('📊 Sample candidate:', candidates[0]);

        let includedCount = 0;
        let skippedCount = 0;

        candidates.forEach((candidate, idx) => {
          // Try multiple ways to get AC_NO
          const acNo = candidate.assembly_id?.AC_NO || 
                       candidate.assembly_id?.ac_no ||
                       candidate.assembly_no || 
                       candidate.AC_NO ||
                       candidate.ac_no;
          
          // Skip candidates that are not in filtered assemblies
          // BUT only if we have a filter (i.e., not Super Admin with all assemblies)
          if (filteredAcNos.size > 0 && !filteredAcNos.has(acNo)) {
            skippedCount++;
            if (idx < 3) {
              console.log(`  ⏭️ Skipped candidate ${idx} - AC_NO ${acNo} not in filtered list`);
            }
            return; // Skip this candidate
          }
          
          // Try multiple ways to get year
          let yearVal = '';
          if (candidate.year_id) {
            if (typeof candidate.year_id === 'object') {
              yearVal = candidate.year_id.year?.toString() || candidate.year_id._id?.toString() || '';
            } else {
              yearVal = candidate.year_id.toString();
            }
          } else if (candidate.year) {
            yearVal = candidate.year.toString();
          }
          
          // Try multiple ways to get party name
          const partyName = candidate.party_id?.name || 
                           candidate.party_id?.party_name ||
                           candidate.party || 
                           'Unknown';
          
          // Try multiple ways to get candidate name
          const candidateName = candidate.candidate_id?.name || 
                               candidate.candidate_id?.candidate_name ||
                               candidate.name || 
                               'Unknown';
          
          const margin = candidate.margin || candidate.victory_margin;
          const totalVotes = candidate.total_votes || candidate.totalVotes || candidate.votes;
          const pcName = candidate.parliament_id?.name || candidate.PC_NAME || null;

          if (idx < 3) {
            console.log(`  ✅ Included candidate ${idx}:`, { acNo, yearVal, partyName, candidateName });
          }
          includedCount++;

          if (acNo && yearVal) {
            if (!winningMap[acNo]) winningMap[acNo] = {};
            winningMap[acNo][yearVal] = {
              candidate: candidateName,
              party: partyName,
              margin,
              totalVotes,
              year: yearVal,
              pcName
            };
            partySet.add(partyName);
            yearSet.add(yearVal);
          }
        });

        console.log('📊 Candidates included:', includedCount);
        console.log('📊 Candidates skipped:', skippedCount);
        console.log('📊 Filtered candidates count:', Object.keys(winningMap).length);
        console.log('📊 Parties found (filtered):', Array.from(partySet));
        console.log('📊 Years found (filtered):', Array.from(yearSet));

        setWinningCandidates(winningMap);
        setParties(Array.from(partySet).sort());
        setAvailableYears(Array.from(yearSet).sort((a, b) => b - a));
        console.log('✅ AssemblyMap data loaded successfully');

      } catch (err) {
        console.error('❌ Error loading AssemblyMap data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, userHierarchy, hierarchyLoading]);

  const enrichedAssemblyData = useMemo(() => {
    if (!assemblyData) {
      console.log('⚠️ No assembly data available');
      return null;
    }

    console.log('🔄 Enriching assembly data...');
    console.log('  Total features:', assemblyData.features.length);
    console.log('  Has winning candidates:', !!winningCandidates, 'Keys:', winningCandidates ? Object.keys(winningCandidates).length : 0);
    
    let matchedCount = 0;
    let unmatchedCount = 0;
    
    const features = assemblyData.features.map((feature, idx) => {
      const acNo = feature.properties?.AC_NO;
      const newFeature = { ...feature, properties: { ...feature.properties } };
      
      // If no winning candidates data, just set default values
      if (!winningCandidates || Object.keys(winningCandidates).length === 0) {
        // Assign a random party for demo purposes
        const demoParties = ['Bharatiya Janata Party', 'Indian National Congress', 'Aam Aadmi Party', 'Unknown'];
        const randomParty = demoParties[idx % demoParties.length];
        
        newFeature.properties.winningCandidate = 'Demo Candidate ' + (idx + 1);
        newFeature.properties.winningParty = randomParty;
        newFeature.properties.margin = Math.floor(Math.random() * 50000);
        newFeature.properties.total_votes = Math.floor(Math.random() * 500000) + 100000;
        newFeature.properties.electionYear = '2023';
        unmatchedCount++;
        return newFeature;
      }

      let yearKey = (filters?.year || '').toString();
      if (yearKey === '' || yearKey === 'all') {
        const yearsForAc = winningCandidates[acNo] ? Object.keys(winningCandidates[acNo]) : [];
        yearKey = yearsForAc.length > 0 ? yearsForAc.sort((a, b) => b - a)[0] : null;
      }
      
      let candidate = null;
      if (acNo && winningCandidates[acNo] && yearKey && winningCandidates[acNo][yearKey]) {
        candidate = winningCandidates[acNo][yearKey];
        matchedCount++;
      } else {
        unmatchedCount++;
      }

      if (candidate) {
        newFeature.properties.winningCandidate = candidate.candidate;
        newFeature.properties.winningParty = candidate.party;
        newFeature.properties.margin = candidate.margin ?? 'N/A';
        newFeature.properties.total_votes = candidate.totalVotes ?? 'N/A';
        newFeature.properties.electionYear = candidate.year;
        if (candidate.pcName) newFeature.properties.PC_NAME = candidate.pcName;
      } else {
        newFeature.properties.winningCandidate = 'No Data';
        newFeature.properties.winningParty = 'Unknown';
        newFeature.properties.margin = 'N/A';
        newFeature.properties.total_votes = 'N/A';
        newFeature.properties.electionYear = 'N/A';
      }
      return newFeature;
    });
    
    console.log('✅ Enrichment complete:', { matched: matchedCount, unmatched: unmatchedCount });
    
    // Log sample of enriched data
    if (features.length > 0) {
      console.log('📍 Sample enriched features:');
      features.slice(0, 3).forEach((f, idx) => {
        console.log(`  [${idx}]`, {
          acNo: f.properties?.AC_NO,
          party: f.properties?.winningParty,
          year: f.properties?.electionYear
        });
      });
    }
    
    return { ...assemblyData, features };
  }, [assemblyData, filters.year, winningCandidates]);

  const handleFeatureClick = (e) => {
    if (!e.features?.length) return;
    const feature = e.features[0];
    setSelectedAssembly(feature.properties);
    setDrawerOpen(true);
    if (onAssemblySelect && feature.properties) {
      onAssemblySelect(feature.properties);
    }
  };

  const filteredData = useMemo(() => {
    if (!enrichedAssemblyData) {
      console.log('⚠️ No enriched data available');
      return null;
    }
    
    console.log('🔍 Filtering data with filters:', filters);
    console.log('  Total enriched features:', enrichedAssemblyData.features.length);
    
    const filteredFeatures = enrichedAssemblyData.features.filter(feature => {
      const partyMatch = filters.party === 'all' || feature.properties?.winningParty === filters.party;
      const yearValue = feature.properties?.electionYear?.toString();
      const filterYear = filters.year?.toString();
      const yearMatch = filterYear === 'all' || yearValue === filterYear;
      return partyMatch && yearMatch;
    });
    
    console.log('✅ Filtered to', filteredFeatures.length, 'features');
    
    // Log sample of filtered data
    if (filteredFeatures.length > 0) {
      console.log('📍 Sample filtered feature:', {
        acNo: filteredFeatures[0].properties?.AC_NO,
        party: filteredFeatures[0].properties?.winningParty,
        year: filteredFeatures[0].properties?.electionYear
      });
    }
    
    return { type: 'FeatureCollection', features: filteredFeatures };
  }, [enrichedAssemblyData, filters]);

  const getColorExpression = useCallback(() => {
    const matchExpr = ['match', ['get', 'winningParty']];
    
    // Add all party colors
    Object.entries(partyColors).forEach(([party, color]) => {
      if (party !== 'default') {
        matchExpr.push(party);
        matchExpr.push(color);
      }
    });
    
    // Add default color
    matchExpr.push(partyColors['default']);
    
    return matchExpr;
  }, []);

  const getColorForFeature = (feature) => {
    return partyColors[feature.properties?.winningParty] || partyColors['default'];
  };

  const handleChangeTheme = useCallback((value) => setSelectTheme(value), []);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Assembly Constituency Map
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Winning Party</InputLabel>
            <Select
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
            <InputLabel>Election Year</InputLabel>
            <Select
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
          interactiveLayerIds={['assembly-layer-dashboard']}
          onClick={handleFeatureClick}
          {...other}
        >
          <MapControl />
          <Source id="india-source-dashboard" type="geojson" data="/india.geojson">
            <Layer
              id="india-fill-dashboard"
              type="fill"
              paint={{
                'fill-color': '#e0e0e0',
                'fill-opacity': 0.07
              }}
            />
            <Layer
              id="india-outline-dashboard"
              type="line"
              paint={{
                'line-color': '#003366',
                'line-width': 1
              }}
            />
          </Source>
          {filteredData && (
            <Source id="assembly-source-dashboard" type="geojson" data={filteredData}>
              <Layer
                id="assembly-layer-dashboard"
                type="fill"
                paint={{
                  'fill-color': getColorExpression(),
                  'fill-opacity': 0.7,
                  'fill-outline-color': '#000000',
                  'fill-antialias': true
                }}
              />
              <Layer
                id="assembly-outline-dashboard"
                type="line"
                paint={{
                  'line-color': '#000000',
                  'line-width': 1
                }}
              />
              <Layer
                id="assembly-labels-dashboard"
                type="symbol"
                layout={{
                  'text-field': ['concat', ['get', 'AC_NO'], '\n', ['get', 'AC_NAME']],
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
            </Source>
          )}
        </Map>
        <ControlPanel themes={themes} selectTheme={selectTheme} onChangeTheme={handleChangeTheme} />

        {loading && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="body1" sx={{ mt: 2 }}>Loading Data...</Typography>
          </Box>
        )}

        {error && (
          <Box sx={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            zIndex: 1000,
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            padding: 2,
            borderRadius: 1,
            maxWidth: '50%'
          }}>
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
        {selectedAssembly && (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" fontWeight={700}>
                Assembly Details
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />

            <Paper elevation={3} sx={{ p: 2.5, backgroundColor: theme.palette.primary.light }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      bgcolor: getColorForFeature({ properties: selectedAssembly }),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      color: 'white',
                      fontWeight: 700
                    }}
                  >
                    {selectedAssembly.AC_NO || '?'}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {selectedAssembly.AC_NAME || 'Assembly Constituency'}
                    </Typography>
                    {selectedAssembly.winningParty && selectedAssembly.winningParty !== 'Unknown' && (
                      <Chip
                        label={selectedAssembly.winningParty}
                        sx={{
                          mt: 0.5,
                          bgcolor: getColorForFeature({ properties: selectedAssembly }),
                          color: 'white'
                        }}
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              </Stack>
            </Paper>

            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  WINNING CANDIDATE
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedAssembly.winningCandidate || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  WINNING PARTY
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedAssembly.winningParty || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  ELECTION YEAR
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedAssembly.electionYear || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  TOTAL VOTES
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedAssembly.total_votes || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                  VICTORY MARGIN
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {selectedAssembly.margin || 'N/A'}
                </Typography>
              </Box>

              {selectedAssembly.PC_NAME && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>
                    PARLIAMENT CONSTITUENCY
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {selectedAssembly.PC_NAME}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        )}
      </Drawer>
    </Box>
  );
}

export default memo(AssemblyMap);

AssemblyMap.propTypes = {
  themes: PropTypes.object.isRequired,
  selectedYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onAssemblySelect: PropTypes.func,
  other: PropTypes.any
};
