// third-party
import { FormattedMessage } from 'react-intl';

// project-imports
import { useGetMenu } from 'api/menu';

// assets
import { Refresh, Home3, HomeTrendUp, Box1, SecurityUser, Shield, ShieldSearch, User } from 'iconsax-react';

const icons = {
  navigation: Home3,
  dashboard: HomeTrendUp,
  components: Box1,
  loading: Refresh,
  SecurityUser: SecurityUser,
  Shield: Shield,
  ShieldSearch: ShieldSearch,
  User: User
};

const loadingMenu = {
  id: 'group-dashboard-loading',
  title: <FormattedMessage id="dashboard" />,
  type: 'group',
  icon: icons.loading,
  children: [
    {
      id: 'dashboard1',
      title: <FormattedMessage id="dashboard" />,
      type: 'collapse',
      icon: icons.loading,
      children: [
        {
          id: 'default1',
          title: 'loading',
          type: 'item',
          url: '/dashboard/default',
          breadcrumbs: false
        },
        // {
        //   id: 'analytics1',
        //   title: 'loading',
        //   type: 'item',
        //   url: '/dashboard/analytics',
        //   breadcrumbs: false
        // }
      ]
    }
  ]
};

// ==============================|| STATIC MENU FOR ADMIN ITEMS ||============================== //

const adminMenu = {
  id: 'group-admin',
  title: <FormattedMessage id="Admin Management" defaultMessage="Admin Management" />,
  type: 'group',
  icon: icons.SecurityUser,
  children: [
    {
      id: 'Matrics',
      title: <FormattedMessage id="Matrics" defaultMessage="Matrics" />,
      type: 'item',
      url: '/Matrics',
      icon: icons.SecurityUser,
      breadcrumbs: false
    },
    {
      id: 'roles',
      title: <FormattedMessage id="Roles" defaultMessage="Roles" />,
      type: 'item',
      url: '/roles',
      icon: icons.SecurityUser,
      breadcrumbs: false
    },
    {
      id: 'permissions',
      title: <FormattedMessage id="Permissions" defaultMessage="Permissions" />,
      type: 'item',
      url: '/permissions',
      icon: icons.Shield,
      breadcrumbs: false
    },
    {
      id: 'assign-permission-to-role',
      title: <FormattedMessage id="Assign Permission to Role" defaultMessage="Assign Permission to Role" />,
      type: 'item',
      url: '/assign-permission-to-role',
      icon: icons.ShieldSearch,
      breadcrumbs: false
    },
    {
      id: 'assign-role-to-user',
      title: <FormattedMessage id="Assign Role to User" defaultMessage="Assign Role to User" />,
      type: 'item',
      url: '/assign-role-to-user',
      icon: icons.User,
      breadcrumbs: false
    }
  ]
};

// ==============================|| MENU ITEMS - API ||============================== //

export function MenuFromAPI() {
  const { menu, menuLoading } = useGetMenu();

  if (menuLoading) return loadingMenu;

  const subChildrenList = (children) => {
    return children?.map((subList) => {
      return fillItem(subList);
    });
  };

  const itemList = (subList) => {
    let list = fillItem(subList);

    // if collapsible item, we need to feel its children as well
    if (subList.type === 'collapse') {
      list.children = subChildrenList(subList.children);
    }
    return list;
  };

  const childrenList = menu?.children?.map((subList) => {
    return itemList(subList);
  });

  let menuList = fillItem(menu, childrenList);
  return menuList;
}

function fillItem(item, children) {
  return {
    ...item,
    title: <FormattedMessage id={`${item?.title}`} />,
    // @ts-ignore
    icon: icons[item?.icon],
    ...(children && { children })
  };
}

export default adminMenu;

