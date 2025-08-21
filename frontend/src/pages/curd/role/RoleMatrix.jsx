import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, MenuItem, Select, TextField, Typography, Paper, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import axios from 'axios';

const MODULES = [
  'Dashboard',
  'Users',
  'Roles',
  'UserCount',
  'MemberList',
  // Add more modules as needed
];
const PERMISSIONS = ['Total', 'List', 'Create', 'Edit', 'Delete'];

export default function RoleMatrix() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [status, setStatus] = useState('Active');
  const [matrix, setMatrix] = useState(() => {
    const obj = {};
    MODULES.forEach(m => {
      obj[m] = {};
      PERMISSIONS.forEach(p => { obj[m][p] = false; });
    });
    return obj;
  });

  // Fetch all roles on mount
  useEffect(() => {
    axios.get('/api/roles').then(res => {
      const arr = Array.isArray(res.data) ? res.data : res.data.data || [];
      setRoles(arr);
    });
  }, []);

  // Fetch permissions for selected role
  useEffect(() => {
    if (!selectedRole) return;
    // Get status for selected role
    const roleObj = roles.find(r => r._id === selectedRole);
    if (roleObj && roleObj.status) setStatus(roleObj.status);
    // Reset matrix
    const newMatrix = {};
    MODULES.forEach(m => {
      newMatrix[m] = {};
      PERMISSIONS.forEach(p => { newMatrix[m][p] = false; });
    });
    // Fetch permissions for this role
    axios.get(`/api/role-permissions/${selectedRole}`).then(res => {
      const perms = Array.isArray(res.data) ? res.data : res.data.data || [];
      perms.forEach(perm => {
        // permission name format: Module_Permission
        const [mod, per] = perm.name.split('_');
        if (newMatrix[mod] && newMatrix[mod][per]) {
          newMatrix[mod][per] = true;
        }
      });
      setMatrix(newMatrix);
    });
  }, [selectedRole, roles]);

  const handleMatrixChange = (module, perm) => {
    setMatrix(prev => ({
      ...prev,
      [module]: { ...prev[module], [perm]: !prev[module][perm] }
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) {
      alert('Please select a role.');
      return;
    }
    try {
      // 1. Update status if changed
      await axios.put(`/api/roles/${selectedRole}`, { status });
      // 2. Get all permissions for this role
      const existingPermsRes = await axios.get(`/api/role-permissions/${selectedRole}`);
      const existingPerms = Array.isArray(existingPermsRes.data) ? existingPermsRes.data : existingPermsRes.data.data || [];
      const existingPermNames = existingPerms.map(p => p.name);
      // 3. For each permission in matrix, add or remove as needed
      for (const module of MODULES) {
        for (const perm of PERMISSIONS) {
          const permName = `${module}_${perm}`;
          const shouldHave = matrix[module][perm];
          const hasAlready = existingPermNames.includes(permName);
          let permissionId = null;
          // Ensure permission exists
          if (shouldHave) {
            try {
              const permRes = await axios.post('/api/permissions', {
                name: permName,
                description: `${perm} permission for ${module}`,
                level: 'State'
              });
              permissionId = permRes.data._id;
            } catch (err) {
              if (err.response && err.response.data && err.response.data.error && err.response.data.error.includes('duplicate')) {
                const existing = await axios.get('/api/permissions');
                const found = (Array.isArray(existing.data) ? existing.data : existing.data.data || []).find(p => p.name === permName);
                if (found) permissionId = found._id;
              } else {
                throw err;
              }
            }
            // Assign if not already assigned
            if (!hasAlready && permissionId) {
              await axios.post('/api/roles/assign-permission', { roleId: selectedRole, permissionId });
            }
          } else {
            // Remove if currently assigned
            if (hasAlready) {
              const found = existingPerms.find(p => p.name === permName);
              if (found) {
                await axios.post('/api/roles/remove-permission', { roleId: selectedRole, permissionId: found._id });
              }
            }
          }
        }
      }
      alert('Permissions updated!');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleReset = () => {
    setSelectedRole('');
    setStatus('Active');
    setMatrix(() => {
      const obj = {};
      MODULES.forEach(m => {
        obj[m] = {};
        PERMISSIONS.forEach(p => { obj[m][p] = false; });
      });
      return obj;
    });
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Roles Management <small style={{fontWeight:400}}>/ Assign Permissions to Role</small></Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                displayEmpty
                fullWidth
                required
              >
                <MenuItem value="" disabled>Select Role</MenuItem>
                {roles.map(role => (
                  <MenuItem key={role._id} value={role._id}>{role.name}</MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Select label="Status" value={status} onChange={e => setStatus(e.target.value)} fullWidth>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button type="submit" variant="contained" sx={{ mr: 1 }}>Save Permissions</Button>
              <Button variant="outlined" onClick={handleReset}>Reset</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      {selectedRole && (
        <>
          <Typography variant="h6" mb={1}>Role Access Matrix</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Modules</TableCell>
                  {PERMISSIONS.map(perm => (
                    <TableCell key={perm} align="center">{perm}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {MODULES.map(module => (
                  <TableRow key={module}>
                    <TableCell>{module}</TableCell>
                    {PERMISSIONS.map(perm => (
                      <TableCell align="center" key={perm}>
                        <Checkbox
                          checked={matrix[module][perm]}
                          onChange={() => handleMatrixChange(module, perm)}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
