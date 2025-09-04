import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip,
    InputAdornment,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Snackbar
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import axiosServices from 'utils/axios';

const PermissionManager = () => {
    const [permissions, setPermissions] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentPermission, setCurrentPermission] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [level, setLevel] = useState('');
    const [searchFilter, setSearchFilter] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const levelOptions = ['State', 'Division', 'Assembly', 'Parliament', 'Block', 'Booth'];

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const response = await axiosServices.get('/permissions');
            setPermissions(response.data.data || response.data);
            setError('');
        } catch (error) {
            console.error('Error fetching permissions:', error);
            setError('Failed to fetch permissions');
        }
    };

    const handleOpen = (permission = null) => {
        setCurrentPermission(permission);
        setName(permission ? permission.name : '');
        setDescription(permission ? permission.description : '');
        setLevel(permission ? permission.level : '');
        setError('');
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentPermission(null);
        setName('');
        setDescription('');
        setLevel('');
        setError('');
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Permission name is required');
            return;
        }
        if (!level) {
            setError('Permission level is required');
            return;
        }

        const payload = { name: name.trim(), description: description.trim(), level };
        try {
            if (currentPermission) {
                await axiosServices.put(`/permissions/${currentPermission._id}`, payload);
                setSuccess('Permission updated successfully');
            } else {
                await axiosServices.post('/permissions', payload);
                setSuccess('Permission created successfully');
            }
            fetchPermissions();
            handleClose();
        } catch (error) {
            console.error('Error saving permission:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to save permission';
            setError(errorMessage);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this permission?')) {
            return;
        }

        try {
            await axiosServices.delete(`/permissions/${id}`);
            fetchPermissions();
            setSuccess('Permission deleted successfully');
        } catch (error) {
            console.error('Error deleting permission:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Failed to delete permission';
            setError(errorMessage);
        }
    };

    // Filter permissions based on search using useMemo
    const filteredPermissions = useMemo(() => {
        if (!permissions || permissions.length === 0) return [];
        if (!searchFilter) return permissions;
        return permissions.filter(permission =>
            permission && permission.name && (
                permission.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                (permission.description && permission.description.toLowerCase().includes(searchFilter.toLowerCase()))
            )
        );
    }, [permissions, searchFilter]);

    return (
        <Box>
            <Typography variant="h5" mb={2}>Manage Permissions</Typography>

            <Grid container spacing={2} alignItems="center" mb={2}>
                <Grid item xs={12} md={8}>
                    <TextField
                        fullWidth
                        label="Search Permissions"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search by name or description..."
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        size="small"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpen()}
                        fullWidth
                    >
                        Add Permission
                    </Button>
                </Grid>
                {searchFilter && (
                    <Grid item xs={12}>
                        <Typography variant="body2" color="primary">
                            Filtering permissions: "{searchFilter}" (showing {filteredPermissions.length} of {permissions.length})
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Level</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPermissions.map((permission) => (
                            <TableRow key={permission._id}>
                                <TableCell>{permission.name}</TableCell>
                                <TableCell>{permission.description}</TableCell>
                                <TableCell>{permission.level}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Edit">
                                        <IconButton onClick={() => handleOpen(permission)}>
                                            <Edit />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                        <IconButton onClick={() => handleDelete(permission._id)}>
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>{currentPermission ? 'Edit Permission' : 'Add Permission'}</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        type="text"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <FormControl fullWidth margin="dense" required>
                        <InputLabel>Level</InputLabel>
                        <Select
                            value={level}
                            label="Level"
                            onChange={(e) => setLevel(e.target.value)}
                        >
                            {levelOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess('')}
            >
                <Alert onClose={() => setSuccess('')} severity="success">
                    {success}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error && !open}
                autoHideDuration={6000}
                onClose={() => setError('')}
            >
                <Alert onClose={() => setError('')} severity="error">
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PermissionManager;
