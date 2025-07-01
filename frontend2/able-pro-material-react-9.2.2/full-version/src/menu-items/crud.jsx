// This is example of menu item without group for horizontal layout. There will be no children.

// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { DocumentCode2 } from 'iconsax-react';
import { HierarchySquare3 } from 'iconsax-react';
import { SidebarBottom } from 'iconsax-react';
import { BrifecaseTick } from 'iconsax-react';
import { ShieldSearch } from 'iconsax-react';
import { ShieldSlash } from 'iconsax-react';
import { Security } from 'iconsax-react';
import { Category2 } from 'iconsax-react';

// type

// icons
const icons = {
  CURd: DocumentCode2,
  HierarchySqu: HierarchySquare3,
  SidebarBottom: SidebarBottom,
  BrifecaseTick: BrifecaseTick,
  ShieldSearch: ShieldSearch,
  ShieldSlash: ShieldSlash,
  Security: Security,
  Category2: Category2,
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
      icon: icons.HierarchySqu,
    },
    {
      id: 'block',
      title: <FormattedMessage id="Block" />,
      type: 'item',
      url: '/block',
      icon: icons.SidebarBottom,
    },
    {
      id: 'booth',
      title: <FormattedMessage id="Booth" />,
      type: 'item',
      url: '/booth',
      icon: icons.BrifecaseTick,
    },
    {
      id: 'assembly',
      title: <FormattedMessage id="Assembly" />,
      type: 'item',
      url: '/assembly',
      icon: icons.ShieldSearch,
    },
    {
      id: 'parliament',
      title: <FormattedMessage id="Parliament" />,
      type: 'item',
      url: '/parliament',
      icon: icons.ShieldSlash,
    },
    {
      id: 'division',
      title: <FormattedMessage id="Division" />,
      type: 'item',
      url: '/division',
      icon: icons.Security,
    },
    {
      id: 'district',
      title: <FormattedMessage id="District" />,
      type: 'item',
      url: '/district',
      icon: icons.Category2,
    },
     {
      id: 'Parliament-Votes',
      title: <FormattedMessage id="Parliament-Votes" />,
      type: 'item',
      url: '/Parliament-Votes',
      icon: icons.Category2,
    },
      {
      id: 'Booth-votes',
      title: <FormattedMessage id="Booth-votes" />,
      type: 'item',
      url: '/Booth-votes',
      icon: icons.Category2,
    },
        {
      id: 'Block-Votes',
      title: <FormattedMessage id="Block-Votes" />,
      type: 'item',
      url: '/Block-Votes',
      icon: icons.Category2,
    },
        {
      id: 'Assembly-Votes',
      title: <FormattedMessage id="Assembly-Votes" />,
      type: 'item',
      url: '/Assembly-Votes',
      icon: icons.Category2,
    },
    // {
    //   id: 'add-volunteer',
    //   title: <FormattedMessage id="Add Booth Volunteer" />,
    //   type: 'item',
    //   url: '/add-volunteer',
    //   icon: icons.CURd,
    // },
    // {
    //   id: 'sample-try',
    //   title: <FormattedMessage id="Booth infrastructure" />,
    //   type: 'item',
    //   url: '/Booth-infrastructure',
    //   icon: icons.CURd,
    // },
    // {
    //   id: 'state-collapse',
    //   title: <FormattedMessage id="State" />,
    //   type: 'collapse',
    //   icon: icons.CURd,
    //   children: [
    //     {
    //       id: 'state-add',
    //       title: <FormattedMessage id="Add State" />,
    //       type: 'item',
    //       url: '/state-add',
    //       breadcrumbs: false
    //     },
    //     {
    //       id: 'state-list',
    //       title: <FormattedMessage id="State List" />,
    //       type: 'item',
    //       url: '/state-list',
    //       breadcrumbs: false
    //     }
    //   ]
    // },
    // {
    //   id: 'division-collapse',
    //   title: <FormattedMessage id="Division" />,
    //   type: 'collapse',
    //   icon: icons.CURd,
    //   children: [
    //     {
    //       id: 'division-add',
    //       title: <FormattedMessage id="Add Division" />,
    //       type: 'item',
    //       url: '/division-add',
    //       breadcrumbs: false
    //     },
    //     {
    //       id: 'division-list',
    //       title: <FormattedMessage id="Division List" />,
    //       type: 'item',
    //       url: '/division-list',
    //       breadcrumbs: false
    //     }
    //   ]
    // },
    // {
    //   id: 'district-collapse',
    //   title: <FormattedMessage id="District" />,
    //   type: 'collapse',
    //   icon: icons.CURd,
    //   children: [
    //     {
    //       id: 'district-add',
    //       title: <FormattedMessage id="Add District" />,
    //       type: 'item',
    //       url: '/district-add',
    //       breadcrumbs: false
    //     },
    //     {
    //       id: 'district-list',
    //       title: <FormattedMessage id="District List" />,
    //       type: 'item',
    //       url: '/district-list',
    //       breadcrumbs: false
    //     }
    //   ]
    // },
    // {
    //   id: 'assembly-collapse',
    //   title: <FormattedMessage id="Assembly" />,
    //   type: 'collapse',
    //   icon: icons.CURd,
    //   children: [
    //     {
    //       id: 'assembly-add',
    //       title: <FormattedMessage id="Add Assembly" />,
    //       type: 'item',
    //       url: '/assembly-add',
    //       breadcrumbs: false
    //     },
    //     {
    //       id: 'assembly-list',
    //       title: <FormattedMessage id="Assembly List" />,
    //       type: 'item',
    //       url: '/assembly-list',
    //       breadcrumbs: false
    //     }
    //   ]
    // },
    // {
    //   id: 'parliament-collapse',
    //   title: <FormattedMessage id="Parliament" />,
    //   type: 'collapse',
    //   icon: icons.CURd,
    //   children: [
    //     {
    //       id: 'parliament-add',
    //       title: <FormattedMessage id="Add Parliament" />,
    //       type: 'item',
    //       url: '/parliament-add',
    //       breadcrumbs: false
    //     },
    //     {
    //       id: 'parliament-list',
    //       title: <FormattedMessage id="Parliament List" />,
    //       type: 'item',
    //       url: '/parliament-list',
    //       breadcrumbs: false
    //     }
    //   ]
    // },
    // {
    //   id: 'block-collapse',
    //   title: <FormattedMessage id="Block" />,
    //   type: 'collapse',
    //   icon: icons.CURd,
    //   children: [
    //     {
    //       id: 'block-add',
    //       title: <FormattedMessage id="Add Block" />,
    //       type: 'item',
    //       url: '/block-add',
    //       breadcrumbs: false
    //     },
    //     {
    //       id: 'block-list',
    //       title: <FormattedMessage id="Block List" />,
    //       type: 'item',
    //       url: '/block-list',
    //       breadcrumbs: false
    //     }
    //   ]
    // },
    // {
    //   id: 'booth-collapse',
    //   title: <FormattedMessage id="Booth" />,
    //   type: 'collapse',
    //   icon: icons.CURd,
    //   children: [
    //     {
    //       id: 'booth-add',
    //       title: <FormattedMessage id="Add Booth" />,
    //       type: 'item',
    //       url: '/booth-add',
    //       breadcrumbs: false
    //     },
    //     {
    //       id: 'booth-list',
    //       title: <FormattedMessage id="Booth List" />,
    //       type: 'item',
    //       url: '/booth-list',
    //       breadcrumbs: false
    //     }
    //   ]
    // }
  ]


};

export default CURd;
