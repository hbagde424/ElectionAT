import React, { useState, useEffect } from 'react';
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
    Tooltip
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import axiosServices from 'utils/axios';

const PermissionManager = () => {
    const [permissions, setPermissions] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentPermission, setCurrentPermission] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchPermissions();
    }, []);

    const fetchPermissions = async () => {
        try {
            const response = await axiosServices.get('/permissions');
            setPermissions(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    };

    const handleOpen = (permission = null) => {
        setCurrentPermission(permission);
        setName(permission ? permission.name : '');
        setDescription(permission ? permission.description : '');
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentPermission(null);
        setName('');
        setDescription('');
    };

    const handleSave = async () => {
        const payload = { name, description };
        try {
            if (currentPermission) {
                await axiosServices.put(`/permissions/${currentPermission._id}`, payload);
            } else {
                await axiosServices.post('/permissions', payload);
            }
            fetchPermissions();
            handleClose();
        } catch (error) {
            console.error('Error saving permission:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosServices.delete(`/permissions/${id}`);
            fetchPermissions();
        } catch (error) {
            console.error('Error deleting permission:', error);
        }
    };

    return (
        <Box>
            <Typography variant="h5" mb={2}>Manage Permissions</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
                Add Permission
            </Button>

            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {permissions.map((permission) => (
                            <TableRow key={permission._id}>
                                <TableCell>{permission.name}</TableCell>
                                <TableCell>{permission.description}</TableCell>
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
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        type="text"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        type="text"
                        fullWidth
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PermissionManager;
