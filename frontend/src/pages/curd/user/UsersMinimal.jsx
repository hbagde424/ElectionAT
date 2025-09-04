import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import axiosServices from 'utils/axios';
import JWTContext from 'contexts/JWTContext';

const UsersMinimal = () => {
    const { user } = useContext(JWTContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosServices.get('/users');
            setUsers(response.data.data || response.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Error fetching users: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <Box p={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">
                    User Management & Permissions
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => {
                        console.log('Add user clicked');
                    }}
                >
                    Add User
                </Button>
            </Stack>

            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}

            <Typography>
                {loading ? 'Loading users...' : `Found ${users.length} users`}
            </Typography>

            {users.length > 0 && (
                <Box mt={2}>
                    {users.map((user) => (
                        <Typography key={user._id}>
                            {user.username} - {user.email}
                        </Typography>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default UsersMinimal;
