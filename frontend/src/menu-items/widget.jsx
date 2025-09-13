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
  children: [
    {
      id: 'data',
      title: <FormattedMessage id="data" />,
      type: 'item',
      url: '/widget/data',
      icon: icons.data
    },
    {
      id: 'Help-Center',
      title: <FormattedMessage id="Help-Center" />,
      type: 'item',
      url: '/Help-Center',
      icon: icons.statistics
    },
    {
      id: 'FAQ',
      title: <FormattedMessage id="FAQ" />,
      type: 'item',
      url: '/FAQ',
      icon: icons.chart
    },

    // {
    //   id: 'chart',
    //   title: <FormattedMessage id="chart" />,
    //   type: 'item',
    //   url: '/widget/chart',
    //   icon: icons.chart
    // }
  ]
};

export default widget;

