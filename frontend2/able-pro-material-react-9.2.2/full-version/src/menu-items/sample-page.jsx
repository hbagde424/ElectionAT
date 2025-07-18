// This is example of menu item without group for horizontal layout. There will be no children.

// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { DocumentCode2 } from 'iconsax-react';

// type

// icons
const icons = {
  samplePage: DocumentCode2
};

// ==============================|| MENU ITEMS - SAMPLE PAGE ||============================== //

const samplePage = {
  id: 'sample-page',
  title: <FormattedMessage id="sample-page" />,
  type: 'group',
  // url: '/sample-page',
  icon: icons.samplePage,
  children: [
    {
      id: 'sample-page',
      title: <FormattedMessage id="Create Admin" />,
      type: 'item',
      url: '/sample-page',
        icon: icons.samplePage,

    },
    {
      id: 'sample-try',
      title: <FormattedMessage id="Admin List" />,
      type: 'item',
      url: '/sample-try',
      icon: icons.samplePage,
    }
  ]
};

export default samplePage;
