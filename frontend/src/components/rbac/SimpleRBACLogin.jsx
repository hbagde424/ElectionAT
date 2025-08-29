import React, { useState } from 'react';
import rbacApiService from '../../services/rbacApi';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert
} from '@mui/material';

const SimpleRBACLogin = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Try real API login first
      const response = await rbacApiService.login(credentials);
      
      if (response.success && response.token) {
        // Store token and user data
        rbacApiService.setAuthToken(response.token);
        localStorage.setItem('rbac_user', JSON.stringify(response.user));
        localStorage.setItem('rbac_mode', 'api');
        
        // Redirect to dashboard
        window.location.href = '/election/rbac/dashboard';
        return;
      }
    } catch (apiError) {
      console.error('API Login failed:', apiError);
      
      // Check if it's a credentials error vs connection error
      if (apiError.message && apiError.message.includes('Invalid credentials')) {
        setError('Invalid email or password. Please check your credentials.');
        setLoading(false);
        return;
      }
      // Fall back to demo login for connection errors
    }

    // Demo login fallback
    const validCredentials = [
      { username: 'admin@electionat.com', password: 'admin123', role: 'Super Admin' },
      { username: 'admin', password: 'admin123', role: 'Super Admin' },
      { username: 'state_admin', password: 'state123', role: 'State Admin' },
      { username: 'booth_officer', password: 'booth123', role: 'Booth Officer' }
    ];

    const user = validCredentials.find(
      cred => cred.username === credentials.username && cred.password === credentials.password
    );

    setLoading(false);

    if (user) {
      // Store demo user data
      localStorage.setItem('rbac_user', JSON.stringify({
        username: user.username,
        role: user.role,
        isDemo: true
      }));
      localStorage.setItem('rbac_mode', 'demo');
      window.location.href = '/election/rbac/dashboard';
    } else {
      setError('Invalid credentials. Try: admin@electionat.com/admin123 or use demo credentials');
    }
  };

  const fillDemoCredentials = () => {
    setCredentials({
      username: 'admin@electionat.com',
      password: 'admin123'
    });
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      p: 2 
    }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" textAlign="center" gutterBottom>
            RBAC System
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" gutterBottom>
            Role-Based Access Control
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="Email"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              margin="normal"
            />

            <Button
              fullWidth
              variant="contained"
              onClick={handleLogin}
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={fillDemoCredentials}
              sx={{ mb: 2 }}
            >
              Fill Demo Credentials
            </Button>

            <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
              Demo: admin@electionat.com / admin123
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SimpleRBACLogin;
