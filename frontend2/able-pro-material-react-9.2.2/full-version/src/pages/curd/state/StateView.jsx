import { Stack, Typography, Divider } from '@mui/material';

export default function StateView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={1}>
            <Typography variant="h6">{data.name}</Typography>
            <Divider />
            <Typography>Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography>Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}