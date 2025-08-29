import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { RBACProvider, useRBAC } from '../contexts/RBACContext';
import Login from '../components/auth/Login';
import RBACLayout from '../components/rbac/RBACLayout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useRBAC();
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <div>Loading...</div>
      </Box>
    );
  }
  
  return user ? children : <Navigate to="/rbac/login" replace />;
};

// Public Route Component (redirects if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useRBAC();
  
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <div>Loading...</div>
      </Box>
    );
  }
  
  return user ? <Navigate to="/rbac/dashboard" replace /> : children;
};

// App Routes Component
const RBACRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <RBACLayout />
          </ProtectedRoute>
        } 
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/rbac/dashboard" replace />} />
      
      {/* Catch all - redirect to dashboard */}
      <Route path="*" element={<Navigate to="/rbac/dashboard" replace />} />
    </Routes>
  );
};

// RBAC App Component
const RBACApp = () => {
  return (
    <RBACProvider>
      <RBACRoutes />
    </RBACProvider>
  );
};

export default RBACApp;
