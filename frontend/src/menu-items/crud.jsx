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
  permissions: ['user_read', 'state_read', 'division_read', 'parliament_read', 'assembly_read', 'block_read', 'booth_read'], // Any read permission shows this group
  children: [
    {
      id: 'state',
      title: <FormattedMessage id="State" />,
      type: 'item',
      url: '/state',
      icon: icons.Location,
      permissions: ['state_read']
    },
    {
      id: 'division',
      title: <FormattedMessage id="Division" />,
      type: 'item',
      url: '/division',
      icon: icons.Bank, // Administrative division
      permissions: ['division_read']
    },
    {
      id: 'parliament',
      title: <FormattedMessage id="Parliament" />,
      type: 'item',
      url: '/parliament',
      icon: icons.Building,
      permissions: ['parliament_read']
    },

    {
      id: 'assembly',
      title: <FormattedMessage id="Assembly" />,
      type: 'item',
      url: '/assembly',
      icon: icons.Courthouse, // Government building
      permissions: ['assembly_read']
    },
    {
      id: 'district',
      title: <FormattedMessage id="District" />,
      type: 'item',
      url: '/district',
      icon: icons.Location,
      permissions: ['division_read'] // District is part of division
    },
    {
      id: 'block',
      title: <FormattedMessage id="Block" />,
      type: 'item',
      url: '/block',
      icon: icons.Location, // Geographical block
      permissions: ['block_read']
    },
    {
      id: 'booth',
      title: <FormattedMessage id="Booth" />,
      type: 'item',
      url: '/booth',
      icon: icons.Home, // Polling booth
      permissions: ['booth_read']
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
      permissions: ['survey_read']
    },
    {
      id: 'booth-volunteer',
      title: <FormattedMessage id="Booth Volunteer" />,
      type: 'item',
      url: '/booth-volunteer',
      icon: icons.Profile2User, // Volunteer staff
      permissions: ['booth_read']
    },
    {
      id: 'Booth-votes',
      title: <FormattedMessage id="Booth-votes" />,
      type: 'item',
      url: '/Booth-votes',
      icon: icons.Ticket, // Voting ticket
      permissions: ['election_data_read']
    },
    {
      id: 'candidates',
      title: <FormattedMessage id="politician" />,
      type: 'item',
      url: '/candidates',
      icon: icons.UserOctagon, // Candidate profile
      permissions: ['candidate_read']
    },
    {
      id: 'Caste-List',
      title: <FormattedMessage id="Caste-List" />,
      type: 'item',
      url: '/Caste-List',
      icon: icons.HierarchySqu, // Hierarchical list
      permissions: ['voter_read']
    },

    {
      id: 'Coding',
      title: <FormattedMessage id="Coding" />,
      type: 'item',
      url: '/Coding',
      icon: icons.Calendar,
      permissions: ['election_data_read']
    },


    {
      id: 'Events',
      title: <FormattedMessage id="Events" />,
      type: 'item',
      url: '/Events',
      icon: icons.Calendar,
      permissions: ['election_data_read']
    },
    {
      id: 'Gender',
      title: <FormattedMessage id="Gender" />,
      type: 'item',
      url: '/Gender',
      icon: icons.Calendar,
      permissions: ['voter_read']
    },
    {
      id: 'Government-Scheme',
      title: <FormattedMessage id="Government-Scheme" />,
      type: 'item',
      url: '/Government-Schema',
      icon: icons.Calendar,
      permissions: ['election_data_read']
    },
    {
      id: 'Influancer',
      title: <FormattedMessage id="Influancer" />,
      type: 'item',
      url: '/Influancer',
      icon: icons.Calendar,
      permissions: ['election_data_read']
    },
    {
      id: 'Local-Issue',
      title: <FormattedMessage id="Local-Issue" />,
      type: 'item',
      url: '/Local-Issue',
      icon: icons.Flag,
      permissions: ['election_data_read']
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
      permissions: ['party_read']
    },
    {
      id: 'Party-Activities',
      title: <FormattedMessage id="Party-Activities" />,
      type: 'item',
      url: '/party-activities',
      icon: icons.TaskSquare, // Party activities
      permissions: ['election_data_read']
    },
    {
      id: 'Pontentcal-Candidate',
      title: <FormattedMessage id="Pontentcal-Candidate" />,
      type: 'item',
      url: '/Pontentcal-Candidate',
      icon: icons.User,
      permissions: ['candidate_read']
    },
    {
      id: 'Users',
      title: <FormattedMessage id="Users" />,
      type: 'item',
      url: '/Users',
      icon: icons.People,
      permissions: ['user_read']
    },
    {
      id: 'Our visits',
      title: <FormattedMessage id="Our Visits" />,
      type: 'item',
      url: '/visits',
      icon: icons.ReceiptText, // Visit records
      permissions: ['election_data_read']
    },
    {
      id: 'WinningPartiesList',
      title: <FormattedMessage id="Winning Parties List" />,
      type: 'item',
      url: '/WinningPartiesList',
      icon: icons.Award,
      permissions: ['election_data_read']
    },
    {
      id: 'WInningCandidateList',
      title: <FormattedMessage id="Winning Assembly List" />,
      type: 'item',
      url: '/WInningCandidateList',
      icon: icons.Award,
      permissions: ['election_data_read']
    },
    {
      id: 'Work-Status',
      title: <FormattedMessage id="Work-Status" />,
      type: 'item',
      url: '/Work-Status',
      icon: icons.ClipboardTick, // Completed work
      permissions: ['election_data_read']
    },
    {
      id: 'Year',
      title: <FormattedMessage id="Year" />,
      type: 'item',
      url: '/Year',
      icon: icons.ClipboardTick, // Completed work
      permissions: ['election_data_read']
    },

    {
      id: 'role',
      title: <FormattedMessage id="Role" defaultMessage="Role" />,
      type: 'item',
      url: '/roles',
      icon: icons.Shield,
      permissions: ['role_read']
    },
    {
      id: 'matrix',
      title: <FormattedMessage id="Permission Matrix" defaultMessage="Permission Matrix" />,
      type: 'item',
      url: '/Matrics',
      icon: icons.ShieldSearch,
    },
    {
      id: 'assign-role-to-user',
      title: <FormattedMessage id="Assign Role to User" defaultMessage="Assign Role to User" />,
      type: 'item',
      url: '/assign-role-to-user',
      icon: icons.User,
    },
    {
      id: 'faq-crud',
      title: <FormattedMessage id="FAQ Management" defaultMessage="FAQ Management" />,
      type: 'item',
      url: '/faq-crud',
      icon: icons.MessageQuestion,
    }
  ]
};

export default CRUDMenu;
