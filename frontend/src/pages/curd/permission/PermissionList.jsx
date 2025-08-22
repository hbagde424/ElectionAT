import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Grid, MenuItem, Paper, Select, Typography, FormControl, InputLabel, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const PermissionList = () => {
  const [permissions, setPermissions] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('State');
  const [editing, setEditing] = useState(null);

  const fetchPermissions = async () => {
    const res = await axios.get('/api/permissions');
    setPermissions(Array.isArray(res.data) ? res.data : res.data.data || []);
  };

  useEffect(() => { fetchPermissions(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/permissions/${editing._id}`, { name, description, level });
    } else {
      await axios.post('/api/permissions', { name, description, level });
    }
    setName(''); setDescription(''); setLevel('State'); setEditing(null); fetchPermissions();
  };

  const handleEdit = (perm) => {
    setEditing(perm);
    setName(perm.name);
    setDescription(perm.description || '');
    setLevel(perm.level);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/permissions/${id}`);
    fetchPermissions();
  };

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>Permissions</Typography>
      <Paper sx={{ p: 2, maxWidth: 700, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                value={name}
                onChange={e => setName(e.target.value)}
                label="Permission Name"
                required
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                value={description}
                onChange={e => setDescription(e.target.value)}
                label="Description"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select value={level} label="Level" onChange={e => setLevel(e.target.value)}>
                  <MenuItem value="State">State</MenuItem>
                  <MenuItem value="Division">Division</MenuItem>
                  <MenuItem value="Assembly">Assembly</MenuItem>
                  <MenuItem value="Parliament">Parliament</MenuItem>
                  <MenuItem value="Block">Block</MenuItem>
                  <MenuItem value="Booth">Booth</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2} display="flex" alignItems="center">
              <Button type="submit" variant="contained" color="primary" sx={{ mr: 1 }}>{editing ? 'Update' : 'Add'}</Button>
              {editing && (
                <Button onClick={() => { setEditing(null); setName(''); setDescription(''); setLevel('State'); }} variant="outlined" color="secondary">Cancel</Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>
      <TableContainer component={Paper} sx={{ maxWidth: 700 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map(perm => (
              <TableRow key={perm._id}>
                <TableCell>{perm.name}</TableCell>
                <TableCell>{perm.level}</TableCell>
                <TableCell>{perm.description}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleEdit(perm)} color="primary"><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(perm._id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PermissionList;
