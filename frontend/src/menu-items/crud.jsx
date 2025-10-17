// third-party
import { FormattedMessage } from 'react-intl';

// assets - using only confirmed existing icons from your list
import {
  DocumentCode2,
  HierarchySquare3,
  Building,
  Briefcase,
  ShieldSearch,
  Shield,
  SecurityUser,
  Category2,
  People,
  Location,
  Calendar,
  Flag,
  User,
  Chart,
  ClipboardText,
  Award,
  Home,
  LikeTag,
  Profile2User,
  ChartSquare,
  Ticket,
  Bank,
  Courthouse,
  ClipboardTick,
  TaskSquare,
  BookSquare,
  UserOctagon,
  TrendUp,
  EmptyWallet,
  ReceiptText,
  MessageQuestion
} from 'iconsax-react';

// icons mapping
const icons = {
  // Main icons
  CURd: DocumentCode2,
  HierarchySqu: HierarchySquare3,
  Building: Building,
  Briefcase: Briefcase,
  ShieldSearch: ShieldSearch,
  Shield: Shield,
  SecurityUser: SecurityUser,
  Category: Category2,
  People: People,
  Location: Location,
  Calendar: Calendar,
  Flag: Flag,
  User: User,
  Chart: Chart,
  ClipboardText: ClipboardText,
  Award: Award,

  // Additional icons for specific use cases
  Home: Home,
  LikeTag: LikeTag,
  Profile2User: Profile2User,
  ChartSquare: ChartSquare,
  Ticket: Ticket,
  Bank: Bank,
  Courthouse: Courthouse,
  ClipboardTick: ClipboardTick,
  TaskSquare: TaskSquare,
  BookSquare: BookSquare,
  UserOctagon: UserOctagon,
  TrendUp: TrendUp,
  EmptyWallet: EmptyWallet,
  ReceiptText: ReceiptText,
  MessageQuestion: MessageQuestion
};

// ==============================|| MENU ITEMS - CRUD ||============================== //

const CRUDMenu = {
  id: 'CRUD',
  title: <FormattedMessage id="CRUD" />,
  type: 'group',
  icon: icons.CURd,
  permissions: ['Users', 'Help Center', 'FAQ', 'state', 'division', 'parliament', 'assembly', 'block', 'booth'], // Any read permission shows this group
  children: [
    {
      id: 'Users',
      title: <FormattedMessage id="Users" />,
      type: 'item',
      url: '/Users',
      icon: icons.People,
      permissions: ['Users']
    },
    {
      id: 'role',
      title: <FormattedMessage id="Role" defaultMessage="Role" />,
      type: 'item',
      url: '/roles',
      icon: icons.Shield,
      permissions: ['role']
    },
    {
      id: 'matrix',
      title: <FormattedMessage id="Permission Matrix" defaultMessage="Permission Matrix" />,
      type: 'item',
      url: '/Matrics',
      icon: icons.ShieldSearch,
      permissions: ['matrix']
    },
    {
      id: 'assign-role-to-user',
      title: <FormattedMessage id="Assign Role to User" defaultMessage="Assign Role to User" />,
      type: 'item',
      url: '/assign-role-to-user',
      icon: icons.User,
      permissions: ['assign-role-to-user']
    },
    {
      id: 'state',
      title: <FormattedMessage id="State" />,
      type: 'item',
      url: '/state',
      icon: icons.Location,
      permissions: ['state']
    },
    {
      id: 'division',
      title: <FormattedMessage id="Division" />,
      type: 'item',
      url: '/division',
      icon: icons.Bank, // Administrative division
      permissions: ['division']
    },
    {
      id: 'parliament',
      title: <FormattedMessage id="Parliament" />,
      type: 'item',
      url: '/parliament',
      icon: icons.Building,
      permissions: ['parliament']
    },
    {
      id: 'parliament-candidate',
      title: <FormattedMessage id="Parliament Candidate" defaultMessage="Parliament Candidate" />,
      type: 'item',
      url: '/parliament-candidate',
      icon: icons.UserOctagon,
      permissions: ['parliament-candidate']
    },

    {
      id: 'assembly',
      title: <FormattedMessage id="Assembly" />,
      type: 'item',
      url: '/assembly',
      icon: icons.Courthouse, // Government building
      permissions: ['assembly']
    },
    {
      id: 'district',
      title: <FormattedMessage id="District" />,
      type: 'item',
      url: '/district',
      icon: icons.Location,
      permissions: ['district']
    },
    {
      id: 'block',
      title: <FormattedMessage id="Block" />,
      type: 'item',
      url: '/block',
      icon: icons.Location, // Geographical block
      permissions: ['block']
    },
    {
      id: 'booth',
      title: <FormattedMessage id="Booth" />,
      type: 'item',
      url: '/booth',
      icon: icons.Home, // Polling booth
      permissions: ['booth']
    },
    // {
    //   id: 'Assembly-Votes',
    //   title: <FormattedMessage id="Assembly-Votes" />,
    //   type: 'item',
    //   url: '/Assembly-Votes',
    //   icon: icons.LikeTag, // Voting representation
    // },

    // {
    //   id: 'Block-Votes',
    //   title: <FormattedMessage id="Block-Votes" />,
    //   type: 'item',
    //   url: '/Block-Votes',
    //   icon: icons.ChartSquare, // Voting data
    // },

    {
      id: 'Booth-Survey',
      title: <FormattedMessage id="Booth-Survey" />,
      type: 'item',
      url: '/Booth-Survey',
      icon: icons.ClipboardText, // Survey form
      permissions: ['Booth-Survey']
    },
    {
      id: 'booth-volunteer',
      title: <FormattedMessage id="Booth Volunteer" />,
      type: 'item',
      url: '/booth-volunteer',
      icon: icons.Profile2User, // Volunteer staff
      permissions: ['booth-volunteer']
    },
    {
      id: 'Booth-votes',
      title: <FormattedMessage id="Booth-votes" />,
      type: 'item',
      url: '/Booth-votes',
      icon: icons.Ticket, // Voting ticket
      permissions: ['Booth-votes']
    },
    {
      id: 'candidates',
      title: <FormattedMessage id="Politician" />,
      type: 'item',
      url: '/candidates',
      icon: icons.UserOctagon, // Candidate profile
      permissions: ['candidates']
    },
    {
      id: 'Caste-List',
      title: <FormattedMessage id="Caste-List" />,
      type: 'item',
      url: '/Caste-List',
      icon: icons.HierarchySqu, // Hierarchical list
      permissions: ['Caste-List']
    },

    {
      id: 'Coding',
      title: <FormattedMessage id="Coding" />,
      type: 'item',
      url: '/Coding',
      icon: icons.Calendar,
      permissions: ['Coding']
    },


    {
      id: 'Events',
      title: <FormattedMessage id="Events" />,
      type: 'item',
      url: '/Events',
      icon: icons.Calendar,
      permissions: ['Events']
    },
    {
      id: 'Gender',
      title: <FormattedMessage id="Gender" />,
      type: 'item',
      url: '/Gender',
      icon: icons.Calendar,
      permissions: ['Gender']
    },
    {
      id: 'Government-Scheme',
      title: <FormattedMessage id="Government-Scheme" />,
      type: 'item',
      url: '/Government-Schema',
      icon: icons.Calendar,
      permissions: ['Government-Scheme']
    },
    {
      id: 'Influancer',
      title: <FormattedMessage id="Influencer" />,
      type: 'item',
      url: '/Influancer',
      icon: icons.Calendar,
      permissions: ['Influancer']
    },
    {
      id: 'Local-Issue',
      title: <FormattedMessage id="Local-Issue" />,
      type: 'item',
      url: '/Local-Issue',
      icon: icons.Flag,
      permissions: ['Local-Issue']
    },

    // {
    //   id: 'Parliament-Votes',
    //   title: <FormattedMessage id="Parliament-Votes" />,
    //   type: 'item',
    //   url: '/Parliament-Votes',
    //   icon: icons.TrendUp, // Voting trends
    // },
    {
      id: 'parties',
      title: <FormattedMessage id="Parties" />,
      type: 'item',
      url: '/parties',
      icon: icons.Flag,
      permissions: ['parties']
    },
    {
      id: 'Party-Activities',
      title: <FormattedMessage id="Party-Activities" />,
      type: 'item',
      url: '/party-activities',
      icon: icons.TaskSquare, // Party activities
      permissions: ['Party-Activities']
    },
    {
      id: 'Pontentcal-Candidate',
      title: <FormattedMessage id="Potential-Candidate" />,
      type: 'item',
      url: '/Pontentcal-Candidate',
      icon: icons.User,
      permissions: ['Pontentcal-Candidate']
    },

    {
      id: 'Our visits',
      title: <FormattedMessage id="Our Visits" />,
      type: 'item',
      url: '/visits',
      icon: icons.ReceiptText, // Visit records
      permissions: ['Our visits']
    },
    {
      id: 'WinningPartiesList',
      title: <FormattedMessage id="Winning Parties List" />,
      type: 'item',
      url: '/WinningPartiesList',
      icon: icons.Award,
      permissions: ['WinningPartiesList']
    },
    {
      id: 'WInningCandidateList',
      title: <FormattedMessage id="Winning Assembly List" />,
      type: 'item',
      url: '/WInningCandidateList',
      icon: icons.Award,
      permissions: ['WInningCandidateList']
    },
    {
      id: 'Work-Status',
      title: <FormattedMessage id="Work-Status" />,
      type: 'item',
      url: '/Work-Status',
      icon: icons.ClipboardTick, // Completed work
      permissions: ['Work-Status']
    },
    {
      id: 'Year',
      title: <FormattedMessage id="Election Year" />,
      type: 'item',
      url: '/Year',
      icon: icons.ClipboardTick, // Completed work
      permissions: ['Year']
    },
    {
      id: 'faq-crud',
      title: <FormattedMessage id="FAQ Management" defaultMessage="FAQ Management" />,
      type: 'item',
      url: '/faq-crud',
      icon: icons.MessageQuestion,
      permissions: ['faq-crud']
    },
    {
      id: 'Help-Center',
      title: <FormattedMessage id="Help Center" defaultMessage="Help Center" />,
      type: 'item',
      url: '/help-center',
      icon: icons.MessageQuestion,
      permissions: ['Help-Center']
    },
    {
      id: 'faq',
      title: <FormattedMessage id="FAQ" />,
      type: 'item',
      url: '/faq',
      icon: icons.MessageQuestion,
      permissions: ['FAQ']
    }
  ]
};

export default CRUDMenu;
