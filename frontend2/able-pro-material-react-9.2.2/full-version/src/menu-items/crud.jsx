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
      id: 'sample-try',
      title: <FormattedMessage id="Booth infrastructure" />,
      type: 'item',
      url: '/Booth-infrastructure',
      icon: icons.CURd,
    }
  ]
};

export default CURd;
