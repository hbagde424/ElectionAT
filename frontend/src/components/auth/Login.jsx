import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  IconButton,
  InputAdornment,
  Divider,
  Grid,
  Chip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Login as LoginIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useRBAC } from '../../contexts/RBACContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useRBAC();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Demo credentials for testing
  const demoCredentials = [
    { username: 'admin', password: 'admin123', role: 'superAdmin' },
    { username: 'state_admin', password: 'state123', role: 'State' },
    { username: 'booth_officer', password: 'booth123', role: 'Booth' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(formData.username, formData.password);
      navigate('/rbac');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (credentials) => {
    setFormData({
      username: credentials.username,
      password: credentials.password
    });
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Paper elevation={8} sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography component="h1" variant="h4" gutterBottom>
                  RBAC System
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Election Management System
                </Typography>
              </Box>

              {/* Login Form */}
              <Card>
                <CardContent>
                  <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      id="username"
                      label="Username"
                      name="username"
                      autoComplete="username"
                      autoFocus
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {error && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3, mb: 2 }}
                      disabled={loading}
                      startIcon={<LoginIcon />}
                    >
                      {loading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Paper>
          </Grid>

          {/* Right Side - Demo Credentials */}
          <Grid item xs={12} md={6}>
            <Paper elevation={4} sx={{ p: 4, bgcolor: 'grey.50' }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <AdminIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h5" gutterBottom>
                  Demo Credentials
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Click on any credential to auto-fill the login form
                </Typography>
              </Box>

              <Box sx={{ space: 2 }}>
                {demoCredentials.map((cred, index) => (
                  <Card 
                    key={index} 
                    sx={{ 
                      mb: 2, 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      '&:hover': {
                        elevation: 4,
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => handleDemoLogin(cred)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" color="primary">
                            {cred.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Password: {cred.password}
                          </Typography>
                        </Box>
                        <Chip
                          label={cred.role}
                          color={
                            cred.role === 'superAdmin' ? 'error' :
                            cred.role === 'State' ? 'warning' : 'primary'
                          }
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="h6" gutterBottom>
                  System Features:
                </Typography>
                <Box component="ul" sx={{ pl: 2, '& li': { mb: 1 } }}>
                  <Typography component="li" variant="body2">
                    Role-based access control
                  </Typography>
                  <Typography component="li" variant="body2">
                    Permission management
                  </Typography>
                  <Typography component="li" variant="body2">
                    User management
                  </Typography>
                  <Typography component="li" variant="body2">
                    Hierarchical scope control
                  </Typography>
                  <Typography component="li" variant="body2">
                    Analytics and reporting
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Election Management System © 2024
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Secure Role-Based Access Control System
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
