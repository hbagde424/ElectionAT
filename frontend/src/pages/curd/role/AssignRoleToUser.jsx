import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Grid, MenuItem, Paper, Select, Typography, FormControl, InputLabel } from '@mui/material';

const AssignRoleToUser = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userId, setUserId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [scopeType, setScopeType] = useState('State');
  const [scopeId, setScopeId] = useState('');
  const [scopes, setScopes] = useState([]);

  useEffect(() => {
    axios.get('/api/users').then(res => setUsers(Array.isArray(res.data) ? res.data : res.data.data || []));
    axios.get('/api/roles').then(res => setRoles(Array.isArray(res.data) ? res.data : res.data.data || []));
  }, []);

  useEffect(() => {
    if (scopeType) {
      axios.get(`/api/${scopeType.toLowerCase()}s`).then(res => setScopes(Array.isArray(res.data) ? res.data : res.data.data || []));
    }
  }, [scopeType]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!userId || !roleId || !scopeType || !scopeId) {
      alert('Please select all fields.');
      return;
    }
    await axios.post('/api/user-roles/assign', { userId, roleId, scope_type: scopeType, scope_id: scopeId });
    alert('Role assigned to user');
  };

  const handleRemove = async (e) => {
    e.preventDefault();
    if (!userId || !roleId || !scopeType || !scopeId) {
      alert('Please select all fields.');
      return;
    }
    await axios.post('/api/user-roles/remove', { userId, roleId, scope_type: scopeType, scope_id: scopeId });
    alert('Role removed from user');
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Assign/Remove Role to User (with Scope)</Typography>
      <Paper sx={{ p: 2, maxWidth: 600 }}>
        <form>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>User</InputLabel>
                <Select value={userId} label="User" onChange={e => setUserId(e.target.value)}>
                  <MenuItem value=""><em>Select User</em></MenuItem>
                  {users.map(u => <MenuItem key={u._id} value={u._id}>{u.username}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
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
                <InputLabel>Scope Type</InputLabel>
                <Select value={scopeType} label="Scope Type" onChange={e => setScopeType(e.target.value)}>
                  <MenuItem value="State">State</MenuItem>
                  <MenuItem value="Division">Division</MenuItem>
                  <MenuItem value="Assembly">Assembly</MenuItem>
                  <MenuItem value="Parliament">Parliament</MenuItem>
                  <MenuItem value="Block">Block</MenuItem>
                  <MenuItem value="Booth">Booth</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>{`Select ${scopeType}`}</InputLabel>
                <Select value={scopeId} label={`Select ${scopeType}`} onChange={e => setScopeId(e.target.value)}>
                  <MenuItem value=""><em>Select {scopeType}</em></MenuItem>
                  {scopes.map(s => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
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

export default AssignRoleToUser;
