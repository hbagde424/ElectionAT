import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  ListItemButton,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
  Assessment as ReportIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useRBAC } from '../../contexts/RBACContext';
import { PermissionGuard, RoleGuard } from './Guards';
import RBACDashboard from './RBACDashboard';
import UserManagement from './UserManagement';
import RoleManagement from './RoleManagement';

const drawerWidth = 280;

const RBACLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, hasRole } = useRBAC();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rbacMenuOpen, setRbacMenuOpen] = useState(true);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/rbac',
      exact: true
    },
    {
      text: 'RBAC Management',
      icon: <SecurityIcon />,
      expandable: true,
      open: rbacMenuOpen,
      onToggle: () => setRbacMenuOpen(!rbacMenuOpen),
      children: [
        {
          text: 'User Management',
          icon: <PeopleIcon />,
          path: '/rbac/users',
          permission: 'user.read'
        },
        {
          text: 'Role Management',
          icon: <AdminIcon />,
          path: '/rbac/roles',
          permission: 'role.read'
        },
        {
          text: 'Permission Analytics',
          icon: <AnalyticsIcon />,
          path: '/rbac/analytics',
          permission: 'analytics.read'
        }
      ]
    },
    {
      text: 'System Reports',
      icon: <ReportIcon />,
      path: '/rbac/reports',
      permission: 'report.read'
    },
    {
      text: 'System Settings',
      icon: <SettingsIcon />,
      path: '/rbac/settings',
      role: 'superAdmin'
    }
  ];

  const renderMenuItem = (item, index) => {
    if (item.permission && !hasPermission(item.permission)) return null;
    if (item.role && !hasRole(item.role)) return null;

    if (item.expandable) {
      return (
        <React.Fragment key={index}>
          <ListItemButton onClick={item.onToggle}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
            {item.open ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={item.open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child, childIndex) => (
                renderMenuItem({ ...child, nested: true }, `${index}-${childIndex}`)
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItemButton
        key={index}
        selected={item.exact ? location.pathname === item.path : isActive(item.path)}
        onClick={() => navigate(item.path)}
        sx={{ pl: item.nested ? 4 : 2 }}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.text} />
      </ListItemButton>
    );
  };

  const drawer = (
    <div>
      {/* Logo/Title Section */}
      <Card sx={{ m: 2, mb: 1 }}>
        <CardContent sx={{ textAlign: 'center', '&:last-child': { pb: 2 } }}>
          <SecurityIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" component="div">
            RBAC System
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Election Management
          </Typography>
        </CardContent>
      </Card>

      {/* User Info */}
      <Card sx={{ m: 2, mb: 1 }}>
        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {user?.username}
              </Typography>
              <Chip
                label={user?.role}
                size="small"
                color="primary"
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Divider />

      {/* Navigation Menu */}
      <List>
        {menuItems.map((item, index) => renderMenuItem(item, index))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {location.pathname === '/rbac' && 'RBAC Dashboard'}
            {location.pathname === '/rbac/users' && 'User Management'}
            {location.pathname === '/rbac/roles' && 'Role Management'}
            {location.pathname === '/rbac/analytics' && 'Permission Analytics'}
            {location.pathname === '/rbac/reports' && 'System Reports'}
            {location.pathname === '/rbac/settings' && 'System Settings'}
          </Typography>

          {/* Notifications */}
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
          >
            <AccountIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8
        }}
      >
        <Routes>
          <Route path="/" element={<RBACDashboard />} />
          <Route 
            path="/users" 
            element={
              <PermissionGuard permission="user.read">
                <UserManagement />
              </PermissionGuard>
            } 
          />
          <Route 
            path="/roles" 
            element={
              <PermissionGuard permission="role.read">
                <RoleManagement />
              </PermissionGuard>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <PermissionGuard permission="analytics.read">
                <Box sx={{ p: 3 }}>
                  <Typography variant="h4">Permission Analytics</Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Analytics dashboard coming soon...
                  </Typography>
                </Box>
              </PermissionGuard>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <PermissionGuard permission="report.read">
                <Box sx={{ p: 3 }}>
                  <Typography variant="h4">System Reports</Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Reports dashboard coming soon...
                  </Typography>
                </Box>
              </PermissionGuard>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <RoleGuard role="superAdmin">
                <Box sx={{ p: 3 }}>
                  <Typography variant="h4">System Settings</Typography>
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    Settings panel coming soon...
                  </Typography>
                </Box>
              </RoleGuard>
            } 
          />
          <Route path="*" element={<Navigate to="/rbac" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default RBACLayout;
