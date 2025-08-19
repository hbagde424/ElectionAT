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
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);

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

  useEffect(() => {
    fetchVisits(pagination.pageIndex, pagination.pageSize);
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleMapClick = (regionData) => {
    if (regionData) {
      fetchVisits(pagination.pageIndex, pagination.pageSize, regionData);
    } else {
      // If no region is selected, fetch all visits
      fetchVisits(pagination.pageIndex, pagination.pageSize);
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
          Recent Visitis
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

