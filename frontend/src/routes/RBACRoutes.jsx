import { lazy } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Loadable from 'components/Loadable';

// Direct imports for testing
import TestRBAC from 'components/rbac/TestRBAC';
import SimpleRBACLogin from 'components/rbac/SimpleRBACLogin';
import RBACDashboardSimple from 'components/rbac/RBACDashboardSimple';
import UserManagementCRUD from 'components/rbac/UserManagementCRUD';
import RoleManagementCRUD from 'components/rbac/RoleManagementCRUD';

// Lazy components as fallback
// const TestRBAC = Loadable(lazy(() => import('components/rbac/TestRBAC')));
// const SimpleRBACLogin = Loadable(lazy(() => import('components/rbac/SimpleRBACLogin')));
// const RBACDashboardSimple = Loadable(lazy(() => import('components/rbac/RBACDashboardSimple')));
// const UserManagementCRUD = Loadable(lazy(() => import('components/rbac/UserManagementCRUD')));
// const RoleManagementCRUD = Loadable(lazy(() => import('components/rbac/RoleManagementCRUD')));

// ==============================|| RBAC ROUTES ||============================== //

const RBACRoutes = {
  path: '/rbac',
  element: <Outlet />,
  children: [
    {
      path: '',
      element: <Navigate to="/rbac/login" replace />
    },
    {
      path: 'login',
      element: <SimpleRBACLogin />
    },
    {
      path: 'dashboard',
      element: <RBACDashboardSimple />
    },
    {
      path: 'users',
      element: <UserManagementCRUD />
    },
    {
      path: 'roles',
      element: <RoleManagementCRUD />
    },
    {
      path: 'test',
      element: <TestRBAC />
    }
  ]
};

export default RBACRoutes;
