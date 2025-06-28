import { Stack, Typography, Divider, Chip, Switch } from '@mui/material';

export default function BlockView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={2}>
            <Typography variant="h6">{data.name}</Typography>
            <Divider />
            
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Category:</Typography>
                <Chip 
                    label={data.category} 
                    color={
                        data.category === 'Urban' ? 'primary' : 
                        data.category === 'Rural' ? 'secondary' : 
                        data.category === 'Semi-Urban' ? 'info' : 'warning'
                    } 
                    size="small" 
                />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>State:</Typography>
                {data.state_id ? (
                    <Chip label={data.state_id.name} color="primary" size="small" />
                ) : (
                    <Typography variant="caption">No state assigned</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>District:</Typography>
                {data.district_id ? (
                    <Chip label={data.district_id.name} color="secondary" size="small" />
                ) : (
                    <Typography variant="caption">No district assigned</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Division:</Typography>
                {data.division_id ? (
                    <Chip label={data.division_id.name} color="info" size="small" />
                ) : (
                    <Typography variant="caption">No division assigned</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Assembly:</Typography>
                {data.assembly_id ? (
                    <Chip label={data.assembly_id.name} color="success" size="small" />
                ) : (
                    <Typography variant="caption">No assembly assigned</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Parliament:</Typography>
                {data.parliament_id ? (
                    <Chip label={data.parliament_id.name} color="warning" size="small" />
                ) : (
                    <Typography variant="caption">No parliament assigned</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Status:</Typography>
                <Switch checked={data.is_active} disabled color="success" />
                <Typography>{data.is_active ? 'Active' : 'Inactive'}</Typography>
            </Stack>

            <Typography>Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography>Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}