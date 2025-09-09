// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { Story, Fatrows, PresentionChart } from 'iconsax-react';

// type

// icons
const icons = {
  widgets: Story,
  statistics: Story,
  data: Fatrows,
  chart: PresentionChart
};

// ==============================|| MENU ITEMS - WIDGETS ||============================== //

const widget = {
  id: 'group-widget',
  title: <FormattedMessage id="widgets" />,
  icon: icons.widgets,
  type: 'group',
  permissions: ['analytics_read', 'report_read'],
  children: [
    {
      id: 'data',
      title: <FormattedMessage id="data" />,
      type: 'item',
      url: '/widget/data',
      icon: icons.data,
      permissions: ['analytics_read']
    },
    {
      id: 'statistics',
      title: <FormattedMessage id="statistics" />,
      type: 'item',
      url: '/widget/statistics',
      icon: icons.statistics,
      permissions: ['analytics_read']
    },

    {
      id: 'chart',
      title: <FormattedMessage id="chart" />,
      type: 'item',
      url: '/widget/chart',
      icon: icons.chart,
      permissions: ['analytics_read']
    }
  ]
};

export default widget;

