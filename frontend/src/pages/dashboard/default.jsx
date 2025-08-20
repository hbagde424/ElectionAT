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
import { TablePagination } from 'components/third-party/react-table';



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

      const response = await axios.get('/work-statuses', { params });

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
            <TablePagination
              setPageSize={(size) =>
                setAssemblyVotesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setAssemblyVotesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: assemblyVotesPagination,
                globalFilter: ''
              })}
              getPageCount={() => assemblyVotesPageCount}
            />
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
            <TablePagination
              setPageSize={(size) =>
                setStatesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setStatesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: statesPagination,
                globalFilter: ''
              })}
              getPageCount={() => statesPageCount}
            />
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
            <TablePagination
              setPageSize={(size) =>
                setDivisionsPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setDivisionsPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: divisionsPagination,
                globalFilter: ''
              })}
              getPageCount={() => divisionsPageCount}
            />
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
            <TablePagination
              setPageSize={(size) =>
                setParliamentsPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setParliamentsPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: parliamentsPagination,
                globalFilter: ''
              })}
              getPageCount={() => parliamentsPageCount}
            />
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
            <TablePagination
              setPageSize={(size) =>
                setDistrictsPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setDistrictsPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: districtsPagination,
                globalFilter: ''
              })}
              getPageCount={() => districtsPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Blocks
        </Typography>
        <ScrollX>
          <TableContainer>
            {blocksLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Block Name</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Parliament</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blocks.map((block, index) => (
                    <TableRow key={block._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {block.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{block.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>{block.parliament?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={block.code || 'N/A'}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={block.status ? 'Active' : 'Inactive'}
                          color={block.status ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setBlocksPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setBlocksPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: blocksPagination,
                globalFilter: ''
              })}
              getPageCount={() => blocksPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Booths
        </Typography>
        <ScrollX>
          <TableContainer>
            {boothsLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Booth Name</TableCell>
                    <TableCell>Number</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Block</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {booths.map((booth, index) => (
                    <TableRow key={booth._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {booth.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booth.number || 'N/A'}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{booth.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>{booth.block?.name || 'N/A'}</TableCell>
                      <TableCell>{booth.location || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setBoothsPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setBoothsPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: boothsPagination,
                globalFilter: ''
              })}
              getPageCount={() => boothsPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Block Votes
        </Typography>
        <ScrollX>
          <TableContainer>
            {blockVotesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Block</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Total Votes</TableCell>
                    <TableCell>Election Year</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blockVotes.map((vote, index) => (
                    <TableRow key={vote._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={vote.candidate?.photo} sx={{ width: 32, height: 32 }} />
                          <Typography>{vote.candidate?.name || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{vote.block?.name || 'N/A'}</TableCell>
                      <TableCell>{vote.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={vote.total_votes?.toLocaleString() || '0'}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{vote.election_year?.year || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setBlockVotesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setBlockVotesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: blockVotesPagination,
                globalFilter: ''
              })}
              getPageCount={() => blockVotesPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Booth Votes
        </Typography>
        <ScrollX>
          <TableContainer>
            {boothVotesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Booth</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Total Votes</TableCell>
                    <TableCell>Election Year</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boothVotes.map((vote, index) => (
                    <TableRow key={vote._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={vote.candidate?.photo} sx={{ width: 32, height: 32 }} />
                          <Typography>{vote.candidate?.name || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{vote.booth?.name || 'N/A'}</TableCell>
                      <TableCell>{vote.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={vote.total_votes?.toLocaleString() || '0'}
                          color="info"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{vote.election_year?.year || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setBoothVotesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setBoothVotesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: boothVotesPagination,
                globalFilter: ''
              })}
              getPageCount={() => boothVotesPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Booth Surveys
        </Typography>
        <ScrollX>
          <TableContainer>
            {boothSurveysLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Survey Date</TableCell>
                    <TableCell>Booth</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Surveyor</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boothSurveys.map((survey, index) => (
                    <TableRow key={survey._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{new Date(survey.survey_date).toLocaleDateString('en-IN') || 'N/A'}</TableCell>
                      <TableCell>{survey.booth?.name || 'N/A'}</TableCell>
                      <TableCell>{survey.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={survey.status?.toUpperCase() || 'N/A'}
                          color={
                            survey.status === 'completed' ? 'success' :
                              survey.status === 'in_progress' ? 'warning' :
                                survey.status === 'pending' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{survey.surveyor?.name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setBoothSurveysPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setBoothSurveysPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: boothSurveysPagination,
                globalFilter: ''
              })}
              getPageCount={() => boothSurveysPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Booth Volunteers
        </Typography>
        <ScrollX>
          <TableContainer>
            {boothVolunteersLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Volunteer</TableCell>
                    <TableCell>Booth</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Contact</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {boothVolunteers.map((volunteer, index) => (
                    <TableRow key={volunteer._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={volunteer.photo} sx={{ width: 32, height: 32 }} />
                          <Typography>{volunteer.name || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{volunteer.booth?.name || 'N/A'}</TableCell>
                      <TableCell>{volunteer.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={volunteer.role || 'N/A'}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{volunteer.contact || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setBoothVolunteersPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setBoothVolunteersPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: boothVolunteersPagination,
                globalFilter: ''
              })}
              getPageCount={() => boothVolunteersPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Caste Lists
        </Typography>
        <ScrollX>
          <TableContainer>
            {casteListsLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Caste Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {casteLists.map((caste, index) => (
                    <TableRow key={caste._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {caste.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={caste.category || 'N/A'}
                          color={
                            caste.category === 'SC' ? 'error' :
                              caste.category === 'ST' ? 'warning' :
                                caste.category === 'OBC' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{caste.state?.name || 'N/A'}</TableCell>
                      <TableCell>{caste.code || 'N/A'}</TableCell>
                      <TableCell>{caste.description || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setCasteListsPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setCasteListsPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: casteListsPagination,
                globalFilter: ''
              })}
              getPageCount={() => casteListsPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Coding
        </Typography>
        <ScrollX>
          <TableContainer>
            {codingsLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {codings.map((coding, index) => (
                    <TableRow key={coding._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Chip
                          label={coding.code || 'N/A'}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{coding.description || 'N/A'}</TableCell>
                      <TableCell>{coding.category || 'N/A'}</TableCell>
                      <TableCell>{coding.type || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={coding.status ? 'Active' : 'Inactive'}
                          color={coding.status ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setCodingsPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setCodingsPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: codingsPagination,
                globalFilter: ''
              })}
              getPageCount={() => codingsPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Events
        </Typography>
        <ScrollX>
          <TableContainer>
            {eventsLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={event._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {event.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{new Date(event.date).toLocaleDateString('en-IN') || 'N/A'}</TableCell>
                      <TableCell>{event.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={event.type || 'N/A'}
                          color="info"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.status?.toUpperCase() || 'N/A'}
                          color={
                            event.status === 'completed' ? 'success' :
                              event.status === 'ongoing' ? 'warning' :
                                event.status === 'upcoming' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setEventsPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setEventsPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: eventsPagination,
                globalFilter: ''
              })}
              getPageCount={() => eventsPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Genders
        </Typography>
        <ScrollX>
          <TableContainer>
            {gendersLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {genders.map((gender, index) => (
                    <TableRow key={gender._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {gender.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={gender.code || 'N/A'}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{gender.description || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={gender.status ? 'Active' : 'Inactive'}
                          color={gender.status ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setGendersPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setGendersPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: gendersPagination,
                globalFilter: ''
              })}
              getPageCount={() => gendersPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Influencers
        </Typography>
        <ScrollX>
          <TableContainer>
            {influencersLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Influencer</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Influence Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {influencers.map((influencer, index) => (
                    <TableRow key={influencer._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={influencer.photo} sx={{ width: 32, height: 32 }} />
                          <Typography>{influencer.name || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{influencer.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={influencer.category || 'N/A'}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{influencer.contact || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={influencer.influence_level || 'N/A'}
                          color={
                            influencer.influence_level === 'high' ? 'error' :
                              influencer.influence_level === 'medium' ? 'warning' :
                                influencer.influence_level === 'low' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setInfluencersPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setInfluencersPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: influencersPagination,
                globalFilter: ''
              })}
              getPageCount={() => influencersPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Local Issues
        </Typography>
        <ScrollX>
          <TableContainer>
            {localIssuesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Issue Title</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date Reported</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {localIssues.map((issue, index) => (
                    <TableRow key={issue._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {issue.title || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{issue.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={issue.priority || 'N/A'}
                          color={
                            issue.priority === 'high' ? 'error' :
                              issue.priority === 'medium' ? 'warning' :
                                issue.priority === 'low' ? 'info' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={issue.status?.toUpperCase() || 'N/A'}
                          color={
                            issue.status === 'resolved' ? 'success' :
                              issue.status === 'in_progress' ? 'warning' :
                                issue.status === 'pending' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(issue.date_reported).toLocaleDateString('en-IN') || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setLocalIssuesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setLocalIssuesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: localIssuesPagination,
                globalFilter: ''
              })}
              getPageCount={() => localIssuesPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Parliament Votes
        </Typography>
        <ScrollX>
          <TableContainer>
            {parliamentVotesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Parliament</TableCell>
                    <TableCell>Total Votes</TableCell>
                    <TableCell>Election Year</TableCell>
                    <TableCell>State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parliamentVotes.map((vote, index) => (
                    <TableRow key={vote._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={vote.candidate?.photo} sx={{ width: 32, height: 32 }} />
                          <Typography>{vote.candidate?.name || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{vote.parliament?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={vote.total_votes?.toLocaleString() || '0'}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{vote.election_year?.year || 'N/A'}</TableCell>
                      <TableCell>{vote.state?.name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setParliamentVotesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setParliamentVotesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: parliamentVotesPagination,
                globalFilter: ''
              })}
              getPageCount={() => parliamentVotesPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Party Activities
        </Typography>
        <ScrollX>
          <TableContainer>
            {partyActivitiesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Activity</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {partyActivities.map((activity, index) => (
                    <TableRow key={activity._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {activity.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{activity.party?.name || 'N/A'}</TableCell>
                      <TableCell>{activity.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>{new Date(activity.date).toLocaleDateString('en-IN') || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={activity.type || 'N/A'}
                          color="secondary"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setPartyActivitiesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setPartyActivitiesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: partyActivitiesPagination,
                globalFilter: ''
              })}
              getPageCount={() => partyActivitiesPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Winning Parties
        </Typography>
        <ScrollX>
          <TableContainer>
            {winningPartiesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Party</TableCell>
                    <TableCell>Assembly</TableCell>
                    <TableCell>Parliament</TableCell>
                    <TableCell>Election Year</TableCell>
                    <TableCell>Vote Share (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {winningParties.map((party, index) => (
                    <TableRow key={party._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar src={party.party?.logo} sx={{ width: 32, height: 32 }} />
                          <Typography>{party.party?.name || 'N/A'}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{party.assembly?.name || 'N/A'}</TableCell>
                      <TableCell>{party.parliament?.name || 'N/A'}</TableCell>
                      <TableCell>{party.election_year?.year || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`${party.vote_share || 0}%`}
                          color="primary"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setWinningPartiesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setWinningPartiesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: winningPartiesPagination,
                globalFilter: ''
              })}
              getPageCount={() => winningPartiesPageCount}
            />
          </Box>
        </ScrollX>
      </Grid>

      <Grid item xs={12} sm={12} lg={12}>
        <Typography variant="h6" gutterBottom>
          Work Statuses
        </Typography>
        <ScrollX>
          <TableContainer>
            {workStatusesLoading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Status Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Color</TableCell>
                    <TableCell>Active</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workStatuses.map((status, index) => (
                    <TableRow key={status._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {status.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.code || 'N/A'}
                          color="info"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{status.description || 'N/A'}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: status.color || '#gray',
                            borderRadius: '50%',
                            border: '1px solid #ddd'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.active ? 'Active' : 'Inactive'}
                          color={status.active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) =>
                setWorkStatusesPagination((prev) => ({ ...prev, pageSize: size }))
              }
              setPageIndex={(index) =>
                setWorkStatusesPagination((prev) => ({ ...prev, pageIndex: index }))
              }
              getState={() => ({
                pagination: workStatusesPagination,
                globalFilter: ''
              })}
              getPageCount={() => workStatusesPageCount}
            />
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

