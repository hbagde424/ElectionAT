import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Grid, Paper, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(null);

  const fetchRoles = async () => {
    const res = await axios.get('/api/roles');
    setRoles(Array.isArray(res.data) ? res.data : res.data.data || []);
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/roles/${editing._id}`, { name, description });
    } else {
      await axios.post('/api/roles', { name, description });
    }
    setName(''); setDescription(''); setEditing(null); fetchRoles();
  };

  const handleEdit = (role) => {
    setEditing(role);
    setName(role.name);
    setDescription(role.description || '');
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/roles/${id}`);
    fetchRoles();
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Roles</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={5}>
              <TextField label="Role Name" value={name} onChange={e => setName(e.target.value)} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button type="submit" variant="contained" color="primary" sx={{ mr: 1 }}>{editing ? 'Update' : 'Add'} Role</Button>
              {editing && <Button variant="outlined" color="secondary" onClick={() => { setEditing(null); setName(''); setDescription(''); }}>Cancel</Button>}
            </Grid>
          </Grid>
        </form>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map(role => (
              <TableRow key={role._id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleEdit(role)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(role._id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RoleList;
