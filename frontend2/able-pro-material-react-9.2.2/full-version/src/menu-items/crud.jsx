// This is example of menu item without group for horizontal layout. There will be no children.

// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { DocumentCode2 } from 'iconsax-react';

// type

// icons
const icons = {
  CURd: DocumentCode2
};

// ==============================|| MENU ITEMS - SAMPLE PAGE ||============================== //

const CURd = {
  id: 'CRUD',
  title: <FormattedMessage id="CRUD" />,
  type: 'group',
  // url: '/sample-page',
  icon: icons.CURd,
  children: [
    {
      id: 'booth-volunteer',
      title: <FormattedMessage id="Booth Volunteer" />,
      type: 'item',
      url: '/booth-volunteer',
      icon: icons.CURd,

    },
    {
      id: 'add-volunteer',
      title: <FormattedMessage id="Add Booth Volunteer" />,
      type: 'item',
      url: '/add-volunteer',
      icon: icons.CURd,

    },
    {
      id: 'sample-try',
      title: <FormattedMessage id="Booth infrastructure" />,
      type: 'item',
      url: '/Booth-infrastructure',
      icon: icons.CURd,
    },
    {
      id: 'State',
      title: <FormattedMessage id="state" />,
      type: 'item',
      url: '/state',
      icon: icons.CURd,
    },
    {
      id: 'division',
      title: <FormattedMessage id="division" />,
      type: 'item',
      url: '/division',
      icon: icons.CURd,
    },
    {
      id: 'district',
      title: <FormattedMessage id="district" />,
      type: 'item',
      url: '/district',
      icon: icons.CURd,
    },
    {
      id: 'assembly',
      title: <FormattedMessage id="assembly" />,
      type: 'item',
      url: '/assembly',
      icon: icons.CURd,
    },
    {
      id: 'parliament',
      title: <FormattedMessage id="parliament" />,
      type: 'item',
      url: '/parliament',
      icon: icons.CURd,
    },
    {
      id: 'block',
      title: <FormattedMessage id="block" />,
      type: 'item',
      url: '/block',
      icon: icons.CURd,
    },
    {
      id: 'booth',
      title: <FormattedMessage id="booth" />,
      type: 'item',
      url: '/booth',
      icon: icons.CURd,
    },
  ]
};

export default CURd;
