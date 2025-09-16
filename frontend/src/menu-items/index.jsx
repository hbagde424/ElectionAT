// project-imports
import applications from './applications';
import widget from './widget';
import formsTables from './forms-tables';
import samplePage from './sample-page';
import chartsMap from './charts-map';
import support from './support';
import pages from './pages';
import CURd from './crud';
import adminMenu from './dashboard';

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [adminMenu, CURd , widget
    // ,applications, formsTables, chartsMap, samplePage, pages, support

   ]
};

export default menuItems;

