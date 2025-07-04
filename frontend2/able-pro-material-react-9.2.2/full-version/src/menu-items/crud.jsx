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
    {
      id: 'Pontentcal-Candidate',
      title: <FormattedMessage id="Pontentcal-Candidate" />,
      type: 'item',
      url: '/Pontentcal-Candidate',
      icon: icons.Category2,
    },
    {
      id: 'Work-Status',
      title: <FormattedMessage id="Work-Status" />,
      type: 'item',
      url: '/Work-Status',
      icon: icons.Category2,
    },
    {
      id: 'Events',
      title: <FormattedMessage id="Events" />,
      type: 'item',
      url: '/Events',
      icon: icons.Category2,
    },
    {
      id: 'Local-Issue',
      title: <FormattedMessage id="Local-Issue" />,
      type: 'item',
      url: '/Local-Issue',
      icon: icons.Category2,
    },
    {
      id: 'Caste-List',
      title: <FormattedMessage id="Caste-List" />,
      type: 'item',
      url: '/Caste-List',
      icon: icons.Category2,
    },
    {
      id: 'Booth-Survey',
      title: <FormattedMessage id="Booth-Survey" />,
      type: 'item',
      url: '/Booth-Survey',
      icon: icons.Category2,
    },
        {
      id: 'visits',
      title: <FormattedMessage id="Visits" />,
      type: 'item',
      url: '/visits',
      icon: icons.Category2,
    },
            {
      id: 'WinningPartiesList',
      title: <FormattedMessage id="Winning Parties List" />,
      type: 'item',
      url: '/WinningPartiesList',
      icon: icons.Category2,
    },
                {
      id: 'candidates',
      title: <FormattedMessage id="Candidates" />,
      type: 'item',
      url: '/candidates',
      icon: icons.Category2,
    },
                    {
      id: 'parties',
      title: <FormattedMessage id="Parties" />,
      type: 'item',
      url: '/parties',
      icon: icons.Category2,
    },
                        {
      id: 'party-activities',
      title: <FormattedMessage id="party-activities" />,
      type: 'item',
      url: '/party-activities',
      icon: icons.Category2,
    },
   
  ]


};

export default CURd;
