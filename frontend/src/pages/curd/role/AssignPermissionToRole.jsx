import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Grid, MenuItem, Paper, Select, Typography, FormControl, InputLabel } from '@mui/material';

const AssignPermissionToRole = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [permissionId, setPermissionId] = useState('');

  useEffect(() => {
    axios.get('/api/roles').then(res => setRoles(Array.isArray(res.data) ? res.data : res.data.data || []));
    axios.get('/api/permissions').then(res => setPermissions(Array.isArray(res.data) ? res.data : res.data.data || []));
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!roleId || !permissionId) {
      alert('Please select both Role and Permission.');
      return;
    }
    await axios.post('/api/roles/assign-permission', { roleId, permissionId });
    alert('Permission assigned to role');
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    if (!roleId || !permissionId) {
      alert('Please select both Role and Permission.');
      return;
    }
    await axios.post('/api/roles/remove-permission', { roleId, permissionId });
    alert('Permission removed from role');
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Assign/Remove Permission to Role</Typography>
      <Paper sx={{ p: 2, maxWidth: 600 }}>
        <form>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select value={roleId} label="Role" onChange={e => setRoleId(e.target.value)}>
                  <MenuItem value=""><em>Select Role</em></MenuItem>
                  {roles.map(r => <MenuItem key={r._id} value={r._id}>{r.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Permission</InputLabel>
                <Select value={permissionId} label="Permission" onChange={e => setPermissionId(e.target.value)}>
                  <MenuItem value=""><em>Select Permission</em></MenuItem>
                  {permissions.map(p => <MenuItem key={p._id} value={p._id}>{p.name} ({p.level})</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button onClick={handleAssign} variant="contained" color="primary" sx={{ mr: 1 }}>Assign</Button>
              <Button onClick={handleRemove} variant="outlined" color="error">Remove</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default AssignPermissionToRole;
