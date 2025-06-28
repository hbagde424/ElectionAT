import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function DivisionView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={2}>
            <Typography variant="h6">{data.name}</Typography>
            <Divider />
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>State:</Typography>
                {data.state_id ? (
                    <Chip label={data.state_id.name} color="primary" size="small" />
                ) : (
                    <Typography variant="caption">No state assigned</Typography>
                )}
            </Stack>
            <Typography>Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography>Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}