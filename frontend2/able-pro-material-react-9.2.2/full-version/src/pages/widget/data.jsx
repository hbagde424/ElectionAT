// material-ui
import Grid from '@mui/material/Grid';

// project-imports
import MyTask from 'sections/widget/data/MyTask';
import UserPersonalData from 'sections/widget/data/UserPersonalData';
import TeamMembers from 'sections/widget/data/TeamMembers';

import Products from 'sections/widget/data/Products';
import MonthlyRevenue from 'sections/widget/data/MonthlyRevenue';

import NewCustomers from 'sections/widget/data/NewCustomers';
import RecentTickets from 'sections/widget/data/RecentTickets';

import Transactions from 'sections/widget/data/Transactions';
import PaymentHistory from 'sections/widget/data/PaymentHistory';
import AddTask from 'sections/widget/data/AddTask';

import ToDoList from 'sections/widget/data/ToDoList';
import TrafficSources from 'sections/widget/data/TrafficSources';

import UserActivity from 'sections/widget/data/UserActivity';
import LatestMessages from 'sections/widget/data/LatestMessages';

import ProjectTable from 'sections/widget/data/ProjectTable';
import ProductSales from 'sections/widget/data/ProductSales';

import TasksCard from 'sections/widget/data/TasksCard';
import ApplicationSales from 'sections/widget/data/ApplicationSales';

import ActiveTickets from 'sections/widget/data/ActiveTickets';
import LatestPosts from 'sections/widget/data/LatestPosts';

import FeedsCard from 'sections/widget/data/FeedsCard';
import LatestCustomers from 'sections/widget/data/LatestCustomers';

import LatestOrder from 'sections/widget/data/LatestOrder';

import IncomingRequests from 'sections/widget/data/IncomingRequests';
import TotalRevenue from 'sections/widget/data/TotalRevenue';
import WelcomeBanner from 'sections/dashboard/default/intro';
// map
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import ChangeTheme from 'sections/maps/change-theme';
import MainCard from 'components/MainCard';
// total incon
import TotalIncome from 'sections/widget/chart/TotalIncome copy';

import ApexColumnChart from 'sections/charts/apexchart/ApexColumnChart copy';

import ApexMixedChart from 'sections/charts/apexchart/ApexMixedChart copy';




const mapConfiguration = {
  mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN,
  minZoom: 1
};

const MAPBOX_THEMES = {
  light: 'mapbox://styles/mapbox/light-v10',
  dark: 'mapbox://styles/mapbox/dark-v10',
  streets: 'mapbox://styles/mapbox/streets-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};


// ===========================|| WIDGET - DATA ||=========================== //

export default function WidgetData() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <WelcomeBanner />
      </Grid>

      <Grid item xs={12}>
        <MainCard title="Theme Variants">
          <MapContainerStyled>
            <ChangeTheme {...mapConfiguration} themes={MAPBOX_THEMES} />
          </MapContainerStyled>
        </MainCard>
      </Grid>

      <Grid item xs={12} md={6}>
        <TotalIncome />
      </Grid>

      <Grid item xs={12} md={6}>
        <MainCard title="Avrage Voter Turnout">
          <ApexColumnChart />
        </MainCard>
      </Grid>

      <Grid item xs={12} md={6} lg={8}>
        <MainCard title="Votes Share Trends">
          <ApexMixedChart />
        </MainCard>
      </Grid>


      {/* row 1 */}
      <Grid item xs={12} md={6} lg={4}>
        <MyTask />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <UserPersonalData />
      </Grid>
      <Grid item xs={12} lg={4} md={12}>
        <TeamMembers />
      </Grid>

      {/* row 2 */}
      <Grid item xs={12} md={7} lg={8}>
        <Products />
      </Grid>
      <Grid item xs={12} md={5} lg={4}>
        <MonthlyRevenue />
      </Grid>

      {/* row 3 */}
      <Grid item xs={12} md={5} lg={6}>
        <NewCustomers />
      </Grid>
      <Grid item xs={12} md={7} lg={6}>
        <RecentTickets />
      </Grid>

      {/* row 4 */}
      <Grid item xs={12} md={6}>
        <Transactions />
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <PaymentHistory />
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <AddTask />
      </Grid>

      {/* row 5 */}
      <Grid item xs={12} md={6} lg={4}>
        <IncomingRequests />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <TotalRevenue />
      </Grid>
      <Grid item xs={12} md={6} lg={4}>
        <TasksCard />
      </Grid>

      {/* row 1 */}
      <Grid item xs={12} md={6} lg={3}>
        <ToDoList />
      </Grid>
      <Grid item xs={12} md={6} lg={3}>
        <TrafficSources />
      </Grid>
      <Grid item xs={12} md={12} lg={6}>
        <ApplicationSales />
      </Grid>

      {/* row 2 */}
      <Grid item xs={12} md={7} lg={6}>
        <LatestMessages />
      </Grid>
      <Grid item xs={12} md={5} lg={6}>
        <UserActivity />
      </Grid>

      {/* row 3 */}
      <Grid item xs={12} lg={6} md={6}>
        <ProjectTable />
      </Grid>
      <Grid item xs={12} lg={6} md={6}>
        <ProductSales />
      </Grid>

      {/* row 5 */}
      <Grid item xs={12} md={8}>
        <ActiveTickets />
      </Grid>
      <Grid item xs={12} md={4}>
        <LatestPosts />
      </Grid>

      {/* row 6 */}
      <Grid item xs={12} md={5} lg={4}>
        <FeedsCard />
      </Grid>
      <Grid item xs={12} md={7} lg={8}>
        <LatestCustomers />
      </Grid>

      {/* row 7 */}
      <Grid item xs={12}>
        <LatestOrder />
      </Grid>
    </Grid>
  );
}
