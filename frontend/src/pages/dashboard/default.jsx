import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';

// Material-UI components
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

// Charts & Widgets
import EcommerceDataCard from 'components/cards/statistics/EcommerceDataCard';
import EcommerceDataChart from 'sections/widget/chart/EcommerceDataChart';
import RepeatCustomerRate from 'sections/widget/chart/RepeatCustomerRate';
import ProjectOverview from 'sections/widget/chart/ProjectOverview';
import ProjectRelease from 'sections/dashboard/default/ProjectRelease';
import AssignUsers from 'sections/widget/statistics/AssignUsers';
import Transactions from 'sections/widget/data/Transactions';
import TotalIncome from 'sections/widget/chart/TotalIncome';
import WelcomeBanner from 'sections/dashboard/default/WelcomeBanner';
import BoothSurveyListPage from 'pages/curd/booth survey/booth-survey';
import VisitListPage from 'pages/curd/visits/VisitListPage';
import Candidate from 'pages/curd/candidates/CandidateListPage';
import Gender from 'pages/curd/gender/Gender';
import CasteList from 'pages/curd/caste list/caste-list';
import BoothVotes from 'pages/curd/votes/BoothVotes/Booth-votes';
import WinningParty from 'pages/curd/winning-parties/WinningPartiesList';
import GovernmentSchema from 'pages/curd/Government Schema/GovernmentSchema';
import AssemblyGraph from 'sections/widget/chart/AssemblySetGrapd';
import ApexColumnChart from 'sections/charts/apexchart/ApexColumnChart copy';

import Booth from 'sections/widget/chart/BoothSetGrapd';
// Icons
import { Eye, EyeSlash } from 'iconsax-react';

// Form & validation
import * as Yup from 'yup';
import { Formik } from 'formik';

// Custom hooks and utilities
import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';
import axios from 'utils/axios';
import { fetcher } from 'utils/axios';
import { preload } from 'swr';

// Assets & Styles
// Icons
import { ArrowDown, ArrowUp, Book, Calendar, CloudChange, Wallet3 } from 'iconsax-react';
import HierarchicalMap from 'sections/dashboard/default/HierarchicalMap';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';



export default function DashboardDefault() {
  const theme = useTheme();
  const [visits, setVisits] = useState([]);
  const [assemblyVotes, setAssemblyVotes] = useState([]);
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assemblyVotesLoading, setAssemblyVotesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [divisionsLoading, setDivisionsLoading] = useState(false);
  const [parliamentsLoading, setParliamentsLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [assemblyVotesPagination, setAssemblyVotesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [statesPagination, setStatesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [divisionsPagination, setDivisionsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [parliamentsPagination, setParliamentsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [districtsPagination, setDistrictsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [assemblyVotesPageCount, setAssemblyVotesPageCount] = useState(0);
  const [statesPageCount, setStatesPageCount] = useState(0);
  const [divisionsPageCount, setDivisionsPageCount] = useState(0);
  const [parliamentsPageCount, setParliamentsPageCount] = useState(0);
  const [districtsPageCount, setDistrictsPageCount] = useState(0);

  const fetchVisits = async (pageIndex, pageSize, region = null) => {
    setLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        params[region.level] = region.id;
      }

      const response = await axios.get('/visits', { params });

      if (response.data.success) {
        setVisits(response.data.data);
        setPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssemblyVotes = async (pageIndex, pageSize, region = null) => {
    setAssemblyVotesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'state') {
          params.state = region.id;
        } else if (region.level === 'division') {
          params.division = region.id;
        } else if (region.level === 'parliamentary') {
          params.parliament = region.id;
        } else if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        } else if (region.level === 'booth') {
          params.booth = region.id;
        }
      }

      const response = await axios.get('/assembly-votes', { params });

      if (response.data.success) {
        setAssemblyVotes(response.data.data);
        setAssemblyVotesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching assembly votes:', error);
    } finally {
      setAssemblyVotesLoading(false);
    }
  };

  const fetchStates = async (pageIndex, pageSize, region = null) => {
    setStatesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      const response = await axios.get('/states', { params });

      if (response.data.success) {
        setStates(response.data.data);
        setStatesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setStatesLoading(false);
    }
  };

  const fetchDivisions = async (pageIndex, pageSize, region = null) => {
    setDivisionsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'state') {
          params.state = region.id;
        }
      }

      const response = await axios.get('/divisions', { params });

      if (response.data.success) {
        setDivisions(response.data.data);
        setDivisionsPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching divisions:', error);
    } finally {
      setDivisionsLoading(false);
    }
  };

  const fetchParliaments = async (pageIndex, pageSize, region = null) => {
    setParliamentsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'state') {
          params.state = region.id;
        } else if (region.level === 'division') {
          params.division = region.id;
        }
      }

      const response = await axios.get('/parliaments', { params });

      if (response.data.success) {
        setParliaments(response.data.data);
        setParliamentsPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching parliaments:', error);
    } finally {
      setParliamentsLoading(false);
    }
  };

  const fetchDistricts = async (pageIndex, pageSize, region = null) => {
    setDistrictsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'state') {
          params.state = region.id;
        } else if (region.level === 'division') {
          params.division = region.id;
        }
      }

      const response = await axios.get('/districts', { params });

      if (response.data.success) {
        setDistricts(response.data.data);
        setDistrictsPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setDistrictsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits(pagination.pageIndex, pagination.pageSize);
    fetchAssemblyVotes(assemblyVotesPagination.pageIndex, assemblyVotesPagination.pageSize);
    fetchStates(statesPagination.pageIndex, statesPagination.pageSize);
    fetchDivisions(divisionsPagination.pageIndex, divisionsPagination.pageSize);
    fetchParliaments(parliamentsPagination.pageIndex, parliamentsPagination.pageSize);
    fetchDistricts(districtsPagination.pageIndex, districtsPagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, assemblyVotesPagination.pageIndex, assemblyVotesPagination.pageSize, statesPagination.pageIndex, statesPagination.pageSize, divisionsPagination.pageIndex, divisionsPagination.pageSize, parliamentsPagination.pageIndex, parliamentsPagination.pageSize, districtsPagination.pageIndex, districtsPagination.pageSize]);

  const handleMapClick = (regionData) => {
    if (regionData) {
      fetchVisits(pagination.pageIndex, pagination.pageSize, regionData);
      fetchAssemblyVotes(assemblyVotesPagination.pageIndex, assemblyVotesPagination.pageSize, regionData);
      fetchStates(statesPagination.pageIndex, statesPagination.pageSize, regionData);
      fetchDivisions(divisionsPagination.pageIndex, divisionsPagination.pageSize, regionData);
      fetchParliaments(parliamentsPagination.pageIndex, parliamentsPagination.pageSize, regionData);
      fetchDistricts(districtsPagination.pageIndex, districtsPagination.pageSize, regionData);
    } else {
      // If no region is selected, fetch all data
      fetchVisits(pagination.pageIndex, pagination.pageSize);
      fetchAssemblyVotes(assemblyVotesPagination.pageIndex, assemblyVotesPagination.pageSize);
      fetchStates(statesPagination.pageIndex, statesPagination.pageSize);
      fetchDivisions(divisionsPagination.pageIndex, divisionsPagination.pageSize);
      fetchParliaments(parliamentsPagination.pageIndex, parliamentsPagination.pageSize);
      fetchDistricts(districtsPagination.pageIndex, districtsPagination.pageSize);
    }
  };

  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const scriptedRef = useScriptRef();

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* <Grid item xs={12}>
        <WelcomeBanner />
      </Grid> */}

      <Grid item xs={12}>
        <HierarchicalMap onRegionClick={handleMapClick} />
      </Grid>

      <Grid item xs={12} md={6}>
        <AssemblyGraph />
      </Grid>
      {/* <Grid item xs={12} md={6}>
              <TotalIncome />
            </Grid> */}
      <Grid item xs={12} md={6}>
        <Booth />
      </Grid>

      <Grid item xs={12} md={6}>
        <MainCard title="average Voter Turnout">
          <ApexColumnChart />
        </MainCard>
      </Grid>


      <Grid item xs={12} sm={6} >
        <BoothSurveyListPage />
      </Grid>



      {/* Row 1 */}
      <Grid item xs={12} sm={6} lg={3}>
        <EcommerceDataCard
          title="All Earnings"
          count="$3000"
          iconPrimary={<Wallet3 />}
          percentage={
            <Typography color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUp size={16} style={{ transform: 'rotate(45deg)' }} /> 30.6%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.primary.main} />
        </EcommerceDataCard>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <EcommerceDataCard
          title="Page Views"
          count="290+"
          color="warning"
          iconPrimary={<Book color={theme.palette.warning.dark} />}
          percentage={
            <Typography color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowDown size={16} style={{ transform: 'rotate(-45deg)' }} /> 30.6%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.warning.dark} />
        </EcommerceDataCard>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <EcommerceDataCard
          title="Total Task"
          count="1,568"
          color="success"
          iconPrimary={<Calendar color={theme.palette.success.darker} />}
          percentage={
            <Typography color="success.darker" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowUp size={16} style={{ transform: 'rotate(45deg)' }} /> 30.6%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.success.darker} />
        </EcommerceDataCard>
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <EcommerceDataCard
          title="Download"
          count="$200"
          color="error"
          iconPrimary={<CloudChange color={theme.palette.error.dark} />}
          percentage={
            <Typography color="error.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ArrowDown size={16} style={{ transform: 'rotate(45deg)' }} /> 30.6%
            </Typography>
          }
        >
          <EcommerceDataChart color={theme.palette.error.dark} />
        </EcommerceDataCard>
      </Grid>
      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Recent Visits
        </Typography>
        <ScrollX>
          <TableContainer>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Post</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Booth</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visits.map((visit, index) => (
                    <TableRow key={visit._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={visit.candidate_id?.photo} sx={{ width: 32, height: 32 }} />
                          <Typography>{visit.candidate_id?.name || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{visit.post || 'N/A'}</TableCell>
                      <TableCell>{new Date(visit.date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>
                        <Chip
                          label={visit.work_status?.toUpperCase() || 'N/A'}
                          color={
                            visit.work_status === 'complete' ? 'success' :
                              visit.work_status === 'in progress' ? 'warning' :
                                visit.work_status === 'approved' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{visit.booth_id?.name || 'N/A'}</TableCell>
                      <TableCell>{visit.locationName || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>

          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Recent Assembly Votes
        </Typography>
        <ScrollX>
          <TableContainer>
            {assemblyVotesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Total Votes</TableCell>
                    <TableCell>Election Year</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Booth</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assemblyVotes.map((vote, index) => (
                    <TableRow key={vote._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={vote.candidate?.photo} sx={{ width: 32, height: 32 }} />
                          <Typography>{vote.candidate?.name || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{vote.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={vote.total_votes?.toLocaleString() || '0'}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{vote.election_year?.year || 'N/A'}</TableCell>
                      <TableCell>{vote.state?.name || 'N/A'}</TableCell>
                      <TableCell>{vote.booth?.name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>

          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          States
        </Typography>
        <ScrollX>
          <TableContainer>
            {statesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>State Name</TableCell>
                    <TableCell>State Code</TableCell>
                    <TableCell>Capital</TableCell>
                    <TableCell>Population</TableCell>
                    <TableCell>Area (sq km)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {states.map((state, index) => (
                    <TableRow key={state._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {state.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={state.code || 'N/A'}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{state.capital || 'N/A'}</TableCell>
                      <TableCell>{state.population?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>{state.area?.toLocaleString() || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>

          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Divisions
        </Typography>
        <ScrollX>
          <TableContainer>
            {divisionsLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Division Name</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Headquarters</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {divisions.map((division, index) => (
                    <TableRow key={division._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {division.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{division.state?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={division.code || 'N/A'}
                          color="info"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{division.type || 'N/A'}</TableCell>
                      <TableCell>{division.headquarters || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>

          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Parliament Constituencies
        </Typography>
        <ScrollX>
          <TableContainer>
            {parliamentsLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Parliament Name</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Division</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parliaments.map((parliament, index) => (
                    <TableRow key={parliament._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {parliament.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{parliament.state?.name || 'N/A'}</TableCell>
                      <TableCell>{parliament.division?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={parliament.code || 'N/A'}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{parliament.type || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>

          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Districts
        </Typography>
        <ScrollX>
          <TableContainer>
            {districtsLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>District Name</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Division</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Headquarters</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {districts.map((district, index) => (
                    <TableRow key={district._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {district.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{district.state?.name || 'N/A'}</TableCell>
                      <TableCell>{district.division?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={district.code || 'N/A'}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{district.headquarters || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>

          </Box>
        </ScrollX>
      </Grid>
      {/* Row 2 */}
      <Grid item xs={12} md={8} lg={9}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <RepeatCustomerRate />
          </Grid>
          <Grid item xs={12}>
            <ProjectOverview />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12} md={4} lg={3}>
        <Stack spacing={3}>
          <ProjectRelease />
          <AssignUsers />
        </Stack>
      </Grid>

      {/* Row 3 */}
      <Grid item xs={12} md={6}>
        <Transactions />
      </Grid>
      <Grid item xs={12} md={6}>
        <TotalIncome />
      </Grid>
    </Grid>
  );
}

