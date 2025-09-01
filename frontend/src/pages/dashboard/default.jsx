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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';

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
import { TablePagination } from 'components/third-party/react-table';

// Template Component for Dashboard Lists (Division Page Style)
const DashboardListTemplate = ({
  title,
  data,
  loading,
  columns,
  pagination,
  setPagination,
  pageCount
}) => {
  return (
    <MainCard content={false}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ p: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Chip
          label={`${data.length} Records`}
          color="primary"
          variant="outlined"
        />
      </Stack>

      <Divider />

      {/* Table */}
      <ScrollX>
        <TableContainer>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableCell key={index} sx={{ fontWeight: 600 }}>
                      {column.header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow
                    key={row._id || rowIndex}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {column.cell ? column.cell(row, rowIndex) : row[column.accessorKey]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        <Divider />

        <Box sx={{ p: 2 }}>
          <TablePagination
            setPageSize={(size) =>
              setPagination((prev) => ({ ...prev, pageSize: size }))
            }
            setPageIndex={(index) =>
              setPagination((prev) => ({ ...prev, pageIndex: index }))
            }
            getState={() => ({
              pagination,
              globalFilter: ''
            })}
            getPageCount={() => pageCount}
          />
        </Box>
      </ScrollX>
    </MainCard>
  );
};

export default function DashboardDefault() {
  const theme = useTheme();
  const [visits, setVisits] = useState([]);
  const [assemblyVotes, setAssemblyVotes] = useState([]);
  const [states, setStates] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [booths, setBooths] = useState([]);
  const [blockVotes, setBlockVotes] = useState([]);
  const [boothVotes, setBoothVotes] = useState([]);
  const [boothSurveys, setBoothSurveys] = useState([]);
  const [boothVolunteers, setBoothVolunteers] = useState([]);
  const [casteLists, setCasteLists] = useState([]);
  const [codings, setCodings] = useState([]);
  const [events, setEvents] = useState([]);
  const [genders, setGenders] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [localIssues, setLocalIssues] = useState([]);
  const [parliamentVotes, setParliamentVotes] = useState([]);
  const [partyActivities, setPartyActivities] = useState([]);
  const [winningParties, setWinningParties] = useState([]);
  const [workStatuses, setWorkStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assemblyVotesLoading, setAssemblyVotesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [divisionsLoading, setDivisionsLoading] = useState(false);
  const [parliamentsLoading, setParliamentsLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [boothsLoading, setBoothsLoading] = useState(false);
  const [blockVotesLoading, setBlockVotesLoading] = useState(false);
  const [boothVotesLoading, setBoothVotesLoading] = useState(false);
  const [boothSurveysLoading, setBoothSurveysLoading] = useState(false);
  const [boothVolunteersLoading, setBoothVolunteersLoading] = useState(false);
  const [casteListsLoading, setCasteListsLoading] = useState(false);
  const [codingsLoading, setCodingsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [gendersLoading, setGendersLoading] = useState(false);
  const [influencersLoading, setInfluencersLoading] = useState(false);
  const [localIssuesLoading, setLocalIssuesLoading] = useState(false);
  const [parliamentVotesLoading, setParliamentVotesLoading] = useState(false);
  const [partyActivitiesLoading, setPartyActivitiesLoading] = useState(false);
  const [winningPartiesLoading, setWinningPartiesLoading] = useState(false);
  const [workStatusesLoading, setWorkStatusesLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [assemblyVotesPagination, setAssemblyVotesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [statesPagination, setStatesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [divisionsPagination, setDivisionsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [parliamentsPagination, setParliamentsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [districtsPagination, setDistrictsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [blocksPagination, setBlocksPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [boothsPagination, setBoothsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [blockVotesPagination, setBlockVotesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [boothVotesPagination, setBoothVotesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [boothSurveysPagination, setBoothSurveysPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [boothVolunteersPagination, setBoothVolunteersPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [casteListsPagination, setCasteListsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [codingsPagination, setCodingsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [eventsPagination, setEventsPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [gendersPagination, setGendersPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [influencersPagination, setInfluencersPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [localIssuesPagination, setLocalIssuesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [parliamentVotesPagination, setParliamentVotesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [partyActivitiesPagination, setPartyActivitiesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [winningPartiesPagination, setWinningPartiesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [workStatusesPagination, setWorkStatusesPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [assemblyVotesPageCount, setAssemblyVotesPageCount] = useState(0);
  const [statesPageCount, setStatesPageCount] = useState(0);
  const [divisionsPageCount, setDivisionsPageCount] = useState(0);
  const [parliamentsPageCount, setParliamentsPageCount] = useState(0);
  const [districtsPageCount, setDistrictsPageCount] = useState(0);
  const [blocksPageCount, setBlocksPageCount] = useState(0);
  const [boothsPageCount, setBoothsPageCount] = useState(0);
  const [blockVotesPageCount, setBlockVotesPageCount] = useState(0);
  const [boothVotesPageCount, setBoothVotesPageCount] = useState(0);
  const [boothSurveysPageCount, setBoothSurveysPageCount] = useState(0);
  const [boothVolunteersPageCount, setBoothVolunteersPageCount] = useState(0);
  const [casteListsPageCount, setCasteListsPageCount] = useState(0);
  const [codingsPageCount, setCodingsPageCount] = useState(0);
  const [eventsPageCount, setEventsPageCount] = useState(0);
  const [gendersPageCount, setGendersPageCount] = useState(0);
  const [influencersPageCount, setInfluencersPageCount] = useState(0);
  const [localIssuesPageCount, setLocalIssuesPageCount] = useState(0);
  const [parliamentVotesPageCount, setParliamentVotesPageCount] = useState(0);
  const [partyActivitiesPageCount, setPartyActivitiesPageCount] = useState(0);
  const [winningPartiesPageCount, setWinningPartiesPageCount] = useState(0);
  const [workStatusesPageCount, setWorkStatusesPageCount] = useState(0);

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

  const fetchBlocks = async (pageIndex, pageSize, region = null) => {
    setBlocksLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'parliamentary') {
          params.parliament = region.id;
        }
      }

      const response = await axios.get('/blocks', { params });

      if (response.data.success) {
        setBlocks(response.data.data);
        setBlocksPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setBlocksLoading(false);
    }
  };

  const fetchBooths = async (pageIndex, pageSize, region = null) => {
    setBoothsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        }
      }

      const response = await axios.get('/booths', { params });

      if (response.data.success) {
        setBooths(response.data.data);
        setBoothsPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching booths:', error);
    } finally {
      setBoothsLoading(false);
    }
  };

  const fetchBlockVotes = async (pageIndex, pageSize, region = null) => {
    setBlockVotesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'state') {
          params.state = region.id;
        } else if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        }
      }

      const response = await axios.get('/block-votes', { params });

      if (response.data.success) {
        setBlockVotes(response.data.data);
        setBlockVotesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching block votes:', error);
    } finally {
      setBlockVotesLoading(false);
    }
  };

  const fetchBoothVotes = async (pageIndex, pageSize, region = null) => {
    setBoothVotesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        } else if (region.level === 'booth') {
          params.booth = region.id;
        }
      }

      const response = await axios.get('/booth-votes', { params });

      if (response.data.success) {
        setBoothVotes(response.data.data);
        setBoothVotesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching booth votes:', error);
    } finally {
      setBoothVotesLoading(false);
    }
  };

  const fetchBoothSurveys = async (pageIndex, pageSize, region = null) => {
    setBoothSurveysLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        } else if (region.level === 'booth') {
          params.booth = region.id;
        }
      }

      const response = await axios.get('/booth-surveys', { params });

      if (response.data.success) {
        setBoothSurveys(response.data.data);
        setBoothSurveysPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching booth surveys:', error);
    } finally {
      setBoothSurveysLoading(false);
    }
  };

  const fetchBoothVolunteers = async (pageIndex, pageSize, region = null) => {
    setBoothVolunteersLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        } else if (region.level === 'booth') {
          params.booth = region.id;
        }
      }

      const response = await axios.get('/booth-volunteers', { params });

      if (response.data.success) {
        setBoothVolunteers(response.data.data);
        setBoothVolunteersPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching booth volunteers:', error);
    } finally {
      setBoothVolunteersLoading(false);
    }
  };

  const fetchCasteLists = async (pageIndex, pageSize, region = null) => {
    setCasteListsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      const response = await axios.get('/caste-lists', { params });

      if (response.data.success) {
        setCasteLists(response.data.data);
        setCasteListsPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching caste lists:', error);
    } finally {
      setCasteListsLoading(false);
    }
  };

  const fetchCodings = async (pageIndex, pageSize, region = null) => {
    setCodingsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      const response = await axios.get('/codings', { params });

      if (response.data.success) {
        setCodings(response.data.data);
        setCodingsPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching codings:', error);
    } finally {
      setCodingsLoading(false);
    }
  };

  const fetchEvents = async (pageIndex, pageSize, region = null) => {
    setEventsLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        } else if (region.level === 'booth') {
          params.booth = region.id;
        }
      }

      const response = await axios.get('/events', { params });

      if (response.data.success) {
        setEvents(response.data.data);
        setEventsPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchGenders = async (pageIndex, pageSize, region = null) => {
    setGendersLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      const response = await axios.get('/genders', { params });

      if (response.data.success) {
        setGenders(response.data.data);
        setGendersPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching genders:', error);
    } finally {
      setGendersLoading(false);
    }
  };

  const fetchInfluencers = async (pageIndex, pageSize, region = null) => {
    setInfluencersLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        } else if (region.level === 'booth') {
          params.booth = region.id;
        }
      }

      const response = await axios.get('/influencers', { params });

      if (response.data.success) {
        setInfluencers(response.data.data);
        setInfluencersPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching influencers:', error);
    } finally {
      setInfluencersLoading(false);
    }
  };

  const fetchLocalIssues = async (pageIndex, pageSize, region = null) => {
    setLocalIssuesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        } else if (region.level === 'booth') {
          params.booth = region.id;
        }
      }

      const response = await axios.get('/local-issues', { params });

      if (response.data.success) {
        setLocalIssues(response.data.data);
        setLocalIssuesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching local issues:', error);
    } finally {
      setLocalIssuesLoading(false);
    }
  };

  const fetchParliamentVotes = async (pageIndex, pageSize, region = null) => {
    setParliamentVotesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'state') {
          params.state = region.id;
        } else if (region.level === 'parliamentary') {
          params.parliament = region.id;
        }
      }

      const response = await axios.get('/parliament-votes', { params });

      if (response.data.success) {
        setParliamentVotes(response.data.data);
        setParliamentVotesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching parliament votes:', error);
    } finally {
      setParliamentVotesLoading(false);
    }
  };

  const fetchPartyActivities = async (pageIndex, pageSize, region = null) => {
    setPartyActivitiesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'block') {
          params.block = region.id;
        } else if (region.level === 'booth') {
          params.booth = region.id;
        }
      }

      const response = await axios.get('/party-activities', { params });

      if (response.data.success) {
        setPartyActivities(response.data.data);
        setPartyActivitiesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching party activities:', error);
    } finally {
      setPartyActivitiesLoading(false);
    }
  };

  const fetchWinningParties = async (pageIndex, pageSize, region = null) => {
    setWinningPartiesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      // Add region parameters if available
      if (region) {
        if (region.level === 'state') {
          params.state = region.id;
        } else if (region.level === 'assembly') {
          params.assembly = region.id;
        } else if (region.level === 'parliamentary') {
          params.parliament = region.id;
        }
      }

      const response = await axios.get('/winning-parties', { params });

      if (response.data.success) {
        setWinningParties(response.data.data);
        setWinningPartiesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching winning parties:', error);
    } finally {
      setWinningPartiesLoading(false);
    }
  };

  const fetchWorkStatuses = async (pageIndex, pageSize, region = null) => {
    setWorkStatusesLoading(true);
    try {
      const params = {
        page: pageIndex + 1,
        limit: pageSize
      };

      const response = await axios.get('/work-status', { params });

      if (response.data.success) {
        setWorkStatuses(response.data.data);
        setWorkStatusesPageCount(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Error fetching work statuses:', error);
    } finally {
      setWorkStatusesLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits(pagination.pageIndex, pagination.pageSize);
    fetchAssemblyVotes(assemblyVotesPagination.pageIndex, assemblyVotesPagination.pageSize);
    fetchStates(statesPagination.pageIndex, statesPagination.pageSize);
    fetchDivisions(divisionsPagination.pageIndex, divisionsPagination.pageSize);
    fetchParliaments(parliamentsPagination.pageIndex, parliamentsPagination.pageSize);
    fetchDistricts(districtsPagination.pageIndex, districtsPagination.pageSize);
    fetchBlocks(blocksPagination.pageIndex, blocksPagination.pageSize);
    fetchBooths(boothsPagination.pageIndex, boothsPagination.pageSize);
    fetchBlockVotes(blockVotesPagination.pageIndex, blockVotesPagination.pageSize);
    fetchBoothVotes(boothVotesPagination.pageIndex, boothVotesPagination.pageSize);
    fetchBoothSurveys(boothSurveysPagination.pageIndex, boothSurveysPagination.pageSize);
    fetchBoothVolunteers(boothVolunteersPagination.pageIndex, boothVolunteersPagination.pageSize);
    fetchCasteLists(casteListsPagination.pageIndex, casteListsPagination.pageSize);
    fetchCodings(codingsPagination.pageIndex, codingsPagination.pageSize);
    fetchEvents(eventsPagination.pageIndex, eventsPagination.pageSize);
    fetchGenders(gendersPagination.pageIndex, gendersPagination.pageSize);
    fetchInfluencers(influencersPagination.pageIndex, influencersPagination.pageSize);
    fetchLocalIssues(localIssuesPagination.pageIndex, localIssuesPagination.pageSize);
    fetchParliamentVotes(parliamentVotesPagination.pageIndex, parliamentVotesPagination.pageSize);
    fetchPartyActivities(partyActivitiesPagination.pageIndex, partyActivitiesPagination.pageSize);
    fetchWinningParties(winningPartiesPagination.pageIndex, winningPartiesPagination.pageSize);
    fetchWorkStatuses(workStatusesPagination.pageIndex, workStatusesPagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize, assemblyVotesPagination.pageIndex, assemblyVotesPagination.pageSize, statesPagination.pageIndex, statesPagination.pageSize, divisionsPagination.pageIndex, divisionsPagination.pageSize, parliamentsPagination.pageIndex, parliamentsPagination.pageSize, districtsPagination.pageIndex, districtsPagination.pageSize, blocksPagination.pageIndex, blocksPagination.pageSize, boothsPagination.pageIndex, boothsPagination.pageSize, blockVotesPagination.pageIndex, blockVotesPagination.pageSize, boothVotesPagination.pageIndex, boothVotesPagination.pageSize, boothSurveysPagination.pageIndex, boothSurveysPagination.pageSize, boothVolunteersPagination.pageIndex, boothVolunteersPagination.pageSize, casteListsPagination.pageIndex, casteListsPagination.pageSize, codingsPagination.pageIndex, codingsPagination.pageSize, eventsPagination.pageIndex, eventsPagination.pageSize, gendersPagination.pageIndex, gendersPagination.pageSize, influencersPagination.pageIndex, influencersPagination.pageSize, localIssuesPagination.pageIndex, localIssuesPagination.pageSize, parliamentVotesPagination.pageIndex, parliamentVotesPagination.pageSize, partyActivitiesPagination.pageIndex, partyActivitiesPagination.pageSize, winningPartiesPagination.pageIndex, winningPartiesPagination.pageSize, workStatusesPagination.pageIndex, workStatusesPagination.pageSize]);

  const handleMapClick = (regionData) => {
    if (regionData) {
      fetchVisits(pagination.pageIndex, pagination.pageSize, regionData);
      fetchAssemblyVotes(assemblyVotesPagination.pageIndex, assemblyVotesPagination.pageSize, regionData);
      fetchStates(statesPagination.pageIndex, statesPagination.pageSize, regionData);
      fetchDivisions(divisionsPagination.pageIndex, divisionsPagination.pageSize, regionData);
      fetchParliaments(parliamentsPagination.pageIndex, parliamentsPagination.pageSize, regionData);
      fetchDistricts(districtsPagination.pageIndex, districtsPagination.pageSize, regionData);
      fetchBlocks(blocksPagination.pageIndex, blocksPagination.pageSize, regionData);
      fetchBooths(boothsPagination.pageIndex, boothsPagination.pageSize, regionData);
      fetchBlockVotes(blockVotesPagination.pageIndex, blockVotesPagination.pageSize, regionData);
      fetchBoothVotes(boothVotesPagination.pageIndex, boothVotesPagination.pageSize, regionData);
      fetchBoothSurveys(boothSurveysPagination.pageIndex, boothSurveysPagination.pageSize, regionData);
      fetchBoothVolunteers(boothVolunteersPagination.pageIndex, boothVolunteersPagination.pageSize, regionData);
      fetchCasteLists(casteListsPagination.pageIndex, casteListsPagination.pageSize, regionData);
      fetchCodings(codingsPagination.pageIndex, codingsPagination.pageSize, regionData);
      fetchEvents(eventsPagination.pageIndex, eventsPagination.pageSize, regionData);
      fetchGenders(gendersPagination.pageIndex, gendersPagination.pageSize, regionData);
      fetchInfluencers(influencersPagination.pageIndex, influencersPagination.pageSize, regionData);
      fetchLocalIssues(localIssuesPagination.pageIndex, localIssuesPagination.pageSize, regionData);
      fetchParliamentVotes(parliamentVotesPagination.pageIndex, parliamentVotesPagination.pageSize, regionData);
      fetchPartyActivities(partyActivitiesPagination.pageIndex, partyActivitiesPagination.pageSize, regionData);
      fetchWinningParties(winningPartiesPagination.pageIndex, winningPartiesPagination.pageSize, regionData);
      fetchWorkStatuses(workStatusesPagination.pageIndex, workStatusesPagination.pageSize, regionData);
    } else {
      // If no region is selected, fetch all data
      fetchVisits(pagination.pageIndex, pagination.pageSize);
      fetchAssemblyVotes(assemblyVotesPagination.pageIndex, assemblyVotesPagination.pageSize);
      fetchStates(statesPagination.pageIndex, statesPagination.pageSize);
      fetchDivisions(divisionsPagination.pageIndex, divisionsPagination.pageSize);
      fetchParliaments(parliamentsPagination.pageIndex, parliamentsPagination.pageSize);
      fetchDistricts(districtsPagination.pageIndex, districtsPagination.pageSize);
      fetchBlocks(blocksPagination.pageIndex, blocksPagination.pageSize);
      fetchBooths(boothsPagination.pageIndex, boothsPagination.pageSize);
      fetchBlockVotes(blockVotesPagination.pageIndex, blockVotesPagination.pageSize);
      fetchBoothVotes(boothVotesPagination.pageIndex, boothVotesPagination.pageSize);
      fetchBoothSurveys(boothSurveysPagination.pageIndex, boothSurveysPagination.pageSize);
      fetchBoothVolunteers(boothVolunteersPagination.pageIndex, boothVolunteersPagination.pageSize);
      fetchCasteLists(casteListsPagination.pageIndex, casteListsPagination.pageSize);
      fetchCodings(codingsPagination.pageIndex, codingsPagination.pageSize);
      fetchEvents(eventsPagination.pageIndex, eventsPagination.pageSize);
      fetchGenders(gendersPagination.pageIndex, gendersPagination.pageSize);
      fetchInfluencers(influencersPagination.pageIndex, influencersPagination.pageSize);
      fetchLocalIssues(localIssuesPagination.pageIndex, localIssuesPagination.pageSize);
      fetchParliamentVotes(parliamentVotesPagination.pageIndex, parliamentVotesPagination.pageSize);
      fetchPartyActivities(partyActivitiesPagination.pageIndex, partyActivitiesPagination.pageSize);
      fetchWinningParties(winningPartiesPagination.pageIndex, winningPartiesPagination.pageSize);
      fetchWorkStatuses(workStatusesPagination.pageIndex, workStatusesPagination.pageSize);
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




      {/* Row 1 */}
      {/* <Grid item xs={12} sm={6} lg={3}>
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
      </Grid> */}




      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Recent Visits"
          data={visits}
          loading={loading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Candidate',
              accessorKey: 'candidate_id',
              cell: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={row.candidate_id?.photo}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    {row.candidate_id?.name || 'N/A'}
                  </Typography>
                </Stack>
              )
            },
            {
              header: 'Post',
              accessorKey: 'post',
              cell: (row) => (
                <Typography sx={{
                  maxWidth: 150,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {row.post || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Date',
              accessorKey: 'date',
              cell: (row) => (
                <Typography>
                  {new Date(row.date).toLocaleDateString('en-IN')}
                </Typography>
              )
            },
            {
              header: 'Status',
              accessorKey: 'work_status',
              cell: (row) => (
                <Chip
                  label={row.work_status?.toUpperCase() || 'N/A'}
                  color={
                    row.work_status === 'complete' ? 'success' :
                      row.work_status === 'in progress' ? 'warning' :
                        row.work_status === 'approved' ? 'info' : 'default'
                  }
                  size="small"
                  variant="outlined"
                />
              )
            },
            {
              header: 'Booth',
              accessorKey: 'booth_id',
              cell: (row) => (
                <Typography>
                  {row.booth_id?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Location',
              accessorKey: 'locationName',
              cell: (row) => (
                <Typography sx={{
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {row.locationName || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={pagination}
          setPagination={setPagination}
          pageCount={pageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Recent Assembly Votes"
          data={assemblyVotes}
          loading={assemblyVotesLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Candidate',
              accessorKey: 'candidate',
              cell: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={row.candidate?.photo}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    {row.candidate?.name || 'N/A'}
                  </Typography>
                </Stack>
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Chip
                  label={row.assembly?.name || 'N/A'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )
            },
            {
              header: 'Total Votes',
              accessorKey: 'total_votes',
              cell: (row) => (
                <Chip
                  label={row.total_votes?.toLocaleString() || '0'}
                  color="success"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Election Year',
              accessorKey: 'election_year',
              cell: (row) => (
                <Typography>
                  {row.election_year?.year || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'State',
              accessorKey: 'state',
              cell: (row) => (
                <Typography>
                  {row.state?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Booth',
              accessorKey: 'booth',
              cell: (row) => (
                <Typography>
                  {row.booth?.name || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={assemblyVotesPagination}
          setPagination={setAssemblyVotesPagination}
          pageCount={assemblyVotesPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Block Votes"
          data={blockVotes}
          loading={blockVotesLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Candidate',
              accessorKey: 'candidate',
              cell: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={row.candidate?.photo}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    {row.candidate?.name || 'N/A'}
                  </Typography>
                </Stack>
              )
            },
            {
              header: 'Block',
              accessorKey: 'block',
              cell: (row) => (
                <Chip
                  label={row.block?.name || 'N/A'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Total Votes',
              accessorKey: 'total_votes',
              cell: (row) => (
                <Chip
                  label={row.total_votes?.toLocaleString() || '0'}
                  color="warning"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Election Year',
              accessorKey: 'election_year',
              cell: (row) => (
                <Typography>
                  {row.election_year?.year || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={blockVotesPagination}
          setPagination={setBlockVotesPagination}
          pageCount={blockVotesPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Booth Votes"
          data={boothVotes}
          loading={boothVotesLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Candidate',
              accessorKey: 'candidate',
              cell: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={row.candidate?.photo}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    {row.candidate?.name || 'N/A'}
                  </Typography>
                </Stack>
              )
            },
            {
              header: 'Booth',
              accessorKey: 'booth',
              cell: (row) => (
                <Chip
                  label={row.booth?.name || 'N/A'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Total Votes',
              accessorKey: 'total_votes',
              cell: (row) => (
                <Chip
                  label={row.total_votes?.toLocaleString() || '0'}
                  color="info"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Election Year',
              accessorKey: 'election_year',
              cell: (row) => (
                <Typography>
                  {row.election_year?.year || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={boothVotesPagination}
          setPagination={setBoothVotesPagination}
          pageCount={boothVotesPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Booth Surveys"
          data={boothSurveys}
          loading={boothSurveysLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Survey Date',
              accessorKey: 'survey_date',
              cell: (row) => (
                <Typography sx={{ fontWeight: 500 }}>
                  {new Date(row.survey_date).toLocaleDateString('en-IN') || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Booth',
              accessorKey: 'booth',
              cell: (row) => (
                <Chip
                  label={row.booth?.name || 'N/A'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Status',
              accessorKey: 'status',
              cell: (row) => (
                <Chip
                  label={row.status?.toUpperCase() || 'N/A'}
                  color={
                    row.status === 'completed' ? 'success' :
                      row.status === 'in_progress' ? 'warning' :
                        row.status === 'pending' ? 'error' : 'default'
                  }
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Surveyor',
              accessorKey: 'surveyor',
              cell: (row) => (
                <Typography>
                  {row.surveyor?.name || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={boothSurveysPagination}
          setPagination={setBoothSurveysPagination}
          pageCount={boothSurveysPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Booth Volunteers"
          data={boothVolunteers}
          loading={boothVolunteersLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Volunteer',
              accessorKey: 'name',
              cell: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={row.photo}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    {row.name || 'N/A'}
                  </Typography>
                </Stack>
              )
            },
            {
              header: 'Booth',
              accessorKey: 'booth',
              cell: (row) => (
                <Chip
                  label={row.booth?.name || 'N/A'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Role',
              accessorKey: 'role',
              cell: (row) => (
                <Chip
                  label={row.role || 'N/A'}
                  color="secondary"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Contact',
              accessorKey: 'contact',
              cell: (row) => (
                <Typography>
                  {row.contact || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={boothVolunteersPagination}
          setPagination={setBoothVolunteersPagination}
          pageCount={boothVolunteersPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Caste Lists"
          data={casteLists}
          loading={casteListsLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Caste Name',
              accessorKey: 'name',
              cell: (row) => (
                <Typography sx={{ fontWeight: 500 }}>
                  {row.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Category',
              accessorKey: 'category',
              cell: (row) => (
                <Chip
                  label={row.category || 'N/A'}
                  color={
                    row.category === 'SC' ? 'error' :
                      row.category === 'ST' ? 'warning' :
                        row.category === 'OBC' ? 'info' : 'default'
                  }
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'State',
              accessorKey: 'state',
              cell: (row) => (
                <Typography>
                  {row.state?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Code',
              accessorKey: 'code',
              cell: (row) => (
                <Chip
                  label={row.code || 'N/A'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )
            },
            {
              header: 'Description',
              accessorKey: 'description',
              cell: (row) => (
                <Typography>
                  {row.description || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={casteListsPagination}
          setPagination={setCasteListsPagination}
          pageCount={casteListsPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Codings"
          data={codings}
          loading={codingsLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Code',
              accessorKey: 'code',
              cell: (row) => (
                <Chip
                  label={row.code || 'N/A'}
                  color="primary"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Description',
              accessorKey: 'description',
              cell: (row) => (
                <Typography>
                  {row.description || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Category',
              accessorKey: 'category',
              cell: (row) => (
                <Typography>
                  {row.category || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Type',
              accessorKey: 'type',
              cell: (row) => (
                <Typography>
                  {row.type || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Status',
              accessorKey: 'status',
              cell: (row) => (
                <Chip
                  label={row.status ? 'Active' : 'Inactive'}
                  color={row.status ? 'success' : 'error'}
                  size="small"
                  variant="filled"
                />
              )
            }
          ]}
          pagination={codingsPagination}
          setPagination={setCodingsPagination}
          pageCount={codingsPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Events"
          data={events}
          loading={eventsLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Event Name',
              accessorKey: 'name',
              cell: (row) => (
                <Typography sx={{ fontWeight: 500 }}>
                  {row.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Date',
              accessorKey: 'date',
              cell: (row) => (
                <Typography>
                  {new Date(row.date).toLocaleDateString('en-IN') || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Type',
              accessorKey: 'type',
              cell: (row) => (
                <Chip
                  label={row.type || 'N/A'}
                  color="info"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Status',
              accessorKey: 'status',
              cell: (row) => (
                <Chip
                  label={row.status?.toUpperCase() || 'N/A'}
                  color={
                    row.status === 'completed' ? 'success' :
                      row.status === 'ongoing' ? 'warning' :
                        row.status === 'upcoming' ? 'info' : 'default'
                  }
                  size="small"
                  variant="filled"
                />
              )
            }
          ]}
          pagination={eventsPagination}
          setPagination={setEventsPagination}
          pageCount={eventsPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Genders"
          data={genders}
          loading={gendersLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Gender',
              accessorKey: 'name',
              cell: (row) => (
                <Typography sx={{ fontWeight: 500 }}>
                  {row.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Code',
              accessorKey: 'code',
              cell: (row) => (
                <Chip
                  label={row.code || 'N/A'}
                  color="secondary"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Description',
              accessorKey: 'description',
              cell: (row) => (
                <Typography>
                  {row.description || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Status',
              accessorKey: 'status',
              cell: (row) => (
                <Chip
                  label={row.status ? 'Active' : 'Inactive'}
                  color={row.status ? 'success' : 'error'}
                  size="small"
                  variant="filled"
                />
              )
            }
          ]}
          pagination={gendersPagination}
          setPagination={setGendersPagination}
          pageCount={gendersPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Influencers"
          data={influencers}
          loading={influencersLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Influencer',
              accessorKey: 'name',
              cell: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={row.photo}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    {row.name || 'N/A'}
                  </Typography>
                </Stack>
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Category',
              accessorKey: 'category',
              cell: (row) => (
                <Chip
                  label={row.category || 'N/A'}
                  color="warning"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Contact',
              accessorKey: 'contact',
              cell: (row) => (
                <Typography>
                  {row.contact || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Influence Level',
              accessorKey: 'influence_level',
              cell: (row) => (
                <Chip
                  label={row.influence_level || 'N/A'}
                  color={
                    row.influence_level === 'high' ? 'error' :
                      row.influence_level === 'medium' ? 'warning' :
                        row.influence_level === 'low' ? 'info' : 'default'
                  }
                  size="small"
                  variant="filled"
                />
              )
            }
          ]}
          pagination={influencersPagination}
          setPagination={setInfluencersPagination}
          pageCount={influencersPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Local Issues"
          data={localIssues}
          loading={localIssuesLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Issue Title',
              accessorKey: 'title',
              cell: (row) => (
                <Typography sx={{ fontWeight: 500 }}>
                  {row.title || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Priority',
              accessorKey: 'priority',
              cell: (row) => (
                <Chip
                  label={row.priority || 'N/A'}
                  color={
                    row.priority === 'high' ? 'error' :
                      row.priority === 'medium' ? 'warning' :
                        row.priority === 'low' ? 'info' : 'default'
                  }
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Status',
              accessorKey: 'status',
              cell: (row) => (
                <Chip
                  label={row.status?.toUpperCase() || 'N/A'}
                  color={
                    row.status === 'resolved' ? 'success' :
                      row.status === 'in_progress' ? 'warning' :
                        row.status === 'pending' ? 'error' : 'default'
                  }
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Date Reported',
              accessorKey: 'date_reported',
              cell: (row) => (
                <Typography>
                  {new Date(row.date_reported).toLocaleDateString('en-IN') || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={localIssuesPagination}
          setPagination={setLocalIssuesPagination}
          pageCount={localIssuesPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Parliament Votes"
          data={parliamentVotes}
          loading={parliamentVotesLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Candidate',
              accessorKey: 'candidate',
              cell: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={row.candidate?.photo}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    {row.candidate?.name || 'N/A'}
                  </Typography>
                </Stack>
              )
            },
            {
              header: 'Parliament',
              accessorKey: 'parliament',
              cell: (row) => (
                <Chip
                  label={row.parliament?.name || 'N/A'}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              )
            },
            {
              header: 'Total Votes',
              accessorKey: 'total_votes',
              cell: (row) => (
                <Chip
                  label={row.total_votes?.toLocaleString() || '0'}
                  color="success"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Election Year',
              accessorKey: 'election_year',
              cell: (row) => (
                <Typography>
                  {row.election_year?.year || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'State',
              accessorKey: 'state',
              cell: (row) => (
                <Typography>
                  {row.state?.name || 'N/A'}
                </Typography>
              )
            }
          ]}
          pagination={parliamentVotesPagination}
          setPagination={setParliamentVotesPagination}
          pageCount={parliamentVotesPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Party Activities"
          data={partyActivities}
          loading={partyActivitiesLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Activity',
              accessorKey: 'name',
              cell: (row) => (
                <Typography sx={{ fontWeight: 500 }}>
                  {row.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Party',
              accessorKey: 'party',
              cell: (row) => (
                <Typography>
                  {row.party?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Date',
              accessorKey: 'date',
              cell: (row) => (
                <Typography>
                  {new Date(row.date).toLocaleDateString('en-IN') || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Type',
              accessorKey: 'type',
              cell: (row) => (
                <Chip
                  label={row.type || 'N/A'}
                  color="secondary"
                  size="small"
                  variant="filled"
                />
              )
            }
          ]}
          pagination={partyActivitiesPagination}
          setPagination={setPartyActivitiesPagination}
          pageCount={partyActivitiesPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Winning Parties"
          data={winningParties}
          loading={winningPartiesLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Party',
              accessorKey: 'party',
              cell: (row) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar
                    src={row.party?.logo}
                    sx={{ width: 32, height: 32 }}
                  />
                  <Typography sx={{ fontWeight: 500 }}>
                    {row.party?.name || 'N/A'}
                  </Typography>
                </Stack>
              )
            },
            {
              header: 'Assembly',
              accessorKey: 'assembly',
              cell: (row) => (
                <Typography>
                  {row.assembly?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Parliament',
              accessorKey: 'parliament',
              cell: (row) => (
                <Typography>
                  {row.parliament?.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Election Year',
              accessorKey: 'election_year',
              cell: (row) => (
                <Typography>
                  {row.election_year?.year || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Vote Share (%)',
              accessorKey: 'vote_share',
              cell: (row) => (
                <Chip
                  label={`${row.vote_share || 0}%`}
                  color="primary"
                  size="small"
                  variant="filled"
                />
              )
            }
          ]}
          pagination={winningPartiesPagination}
          setPagination={setWinningPartiesPagination}
          pageCount={winningPartiesPageCount}
        />
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <DashboardListTemplate
          title="Work Status"
          data={workStatuses}
          loading={workStatusesLoading}
          columns={[
            {
              header: '#',
              accessorKey: 'index',
              cell: (row, index) => <Typography>{index + 1}</Typography>
            },
            {
              header: 'Status Name',
              accessorKey: 'name',
              cell: (row) => (
                <Typography sx={{ fontWeight: 500 }}>
                  {row.name || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Code',
              accessorKey: 'code',
              cell: (row) => (
                <Chip
                  label={row.code || 'N/A'}
                  color="info"
                  size="small"
                  variant="filled"
                />
              )
            },
            {
              header: 'Description',
              accessorKey: 'description',
              cell: (row) => (
                <Typography>
                  {row.description || 'N/A'}
                </Typography>
              )
            },
            {
              header: 'Color',
              accessorKey: 'color',
              cell: (row) => (
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: row.color || '#gray',
                    borderRadius: '50%',
                    border: '1px solid #ddd'
                  }}
                />
              )
            },
            {
              header: 'Status',
              accessorKey: 'active',
              cell: (row) => (
                <Chip
                  label={row.active ? 'Active' : 'Inactive'}
                  color={row.active ? 'success' : 'error'}
                  size="small"
                  variant="filled"
                />
              )
            }
          ]}
          pagination={workStatusesPagination}
          setPagination={setWorkStatusesPagination}
          pageCount={workStatusesPageCount}
        />
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

