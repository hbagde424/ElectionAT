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
  ReceiptText
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
  ReceiptText: ReceiptText
};

// ==============================|| MENU ITEMS - CRUD ||============================== //

const CRUDMenu = {
  id: 'CRUD',
  title: <FormattedMessage id="CRUD" />,
  type: 'group',
  icon: icons.CURd,
  children: [
    {
      id: 'assembly',
      title: <FormattedMessage id="Assembly" />,
      type: 'item',
      url: '/assembly',
      icon: icons.Courthouse, // Government building
    },
    {
      id: 'Assembly-Votes',
      title: <FormattedMessage id="Assembly-Votes" />,
      type: 'item',
      url: '/Assembly-Votes',
      icon: icons.LikeTag, // Voting representation
    },
    {
      id: 'block',
      title: <FormattedMessage id="Block" />,
      type: 'item',
      url: '/block',
      icon: icons.Location, // Geographical block
    },
    {
      id: 'Block-Votes',
      title: <FormattedMessage id="Block-Votes" />,
      type: 'item',
      url: '/Block-Votes',
      icon: icons.ChartSquare, // Voting data
    },
    {
      id: 'booth',
      title: <FormattedMessage id="Booth" />,
      type: 'item',
      url: '/booth',
      icon: icons.Home, // Polling booth
    },
    {
      id: 'Booth-Survey',
      title: <FormattedMessage id="Booth-Survey" />,
      type: 'item',
      url: '/Booth-Survey',
      icon: icons.ClipboardText, // Survey form
    },
    {
      id: 'booth-volunteer',
      title: <FormattedMessage id="Booth Volunteer" />,
      type: 'item',
      url: '/booth-volunteer',
      icon: icons.Profile2User, // Volunteer staff
    },
    {
      id: 'Booth-votes',
      title: <FormattedMessage id="Booth-votes" />,
      type: 'item',
      url: '/Booth-votes',
      icon: icons.Ticket, // Voting ticket
    },
    {
      id: 'candidates',
      title: <FormattedMessage id="Candidates" />,
      type: 'item',
      url: '/candidates',
      icon: icons.UserOctagon, // Candidate profile
    },
    {
      id: 'Caste-List',
      title: <FormattedMessage id="Caste-List" />,
      type: 'item',
      url: '/Caste-List',
      icon: icons.HierarchySqu, // Hierarchical list
    },
    {
      id: 'district',
      title: <FormattedMessage id="District" />,
      type: 'item',
      url: '/district',
      icon: icons.Location,
    },
    {
      id: 'division',
      title: <FormattedMessage id="Division" />,
      type: 'item',
      url: '/division',
      icon: icons.Bank, // Administrative division
    },
    {
      id: 'Events',
      title: <FormattedMessage id="Events" />,
      type: 'item',
      url: '/Events',
      icon: icons.Calendar,
    },
    {
      id: 'Local-Issue',
      title: <FormattedMessage id="Local-Issue" />,
      type: 'item',
      url: '/Local-Issue',
      icon: icons.Flag,
    },
    {
      id: 'parliament',
      title: <FormattedMessage id="Parliament" />,
      type: 'item',
      url: '/parliament',
      icon: icons.Building,
    },
    {
      id: 'Parliament-Votes',
      title: <FormattedMessage id="Parliament-Votes" />,
      type: 'item',
      url: '/Parliament-Votes',
      icon: icons.TrendUp, // Voting trends
    },
    {
      id: 'parties',
      title: <FormattedMessage id="Parties" />,
      type: 'item',
      url: '/parties',
      icon: icons.Flag,
    },
    {
      id: 'party-activities',
      title: <FormattedMessage id="party-activities" />,
      type: 'item',
      url: '/party-activities',
      icon: icons.TaskSquare, // Party activities
    },
    {
      id: 'Pontentcal-Candidate',
      title: <FormattedMessage id="Pontentcal-Candidate" />,
      type: 'item',
      url: '/Pontentcal-Candidate',
      icon: icons.User,
    },
    {
      id: 'state',
      title: <FormattedMessage id="State" />,
      type: 'item',
      url: '/state',
      icon: icons.Location,
    },
    {
      id: 'Users',
      title: <FormattedMessage id="Users" />,
      type: 'item',
      url: '/Users',
      icon: icons.People,
    },
    {
      id: 'visits',
      title: <FormattedMessage id="Visits" />,
      type: 'item',
      url: '/visits',
      icon: icons.ReceiptText, // Visit records
    },
    {
      id: 'WinningPartiesList',
      title: <FormattedMessage id="Winning Parties List" />,
      type: 'item',
      url: '/WinningPartiesList',
      icon: icons.Award,
    },
    {
      id: 'Work-Status',
      title: <FormattedMessage id="Work-Status" />,
      type: 'item',
      url: '/Work-Status',
      icon: icons.ClipboardTick // Completed work
    }
  ]
};

export default CRUDMenu;