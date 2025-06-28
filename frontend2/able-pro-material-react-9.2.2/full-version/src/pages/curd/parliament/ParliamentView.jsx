import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function ParliamentView({ data }) {
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

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Division:</Typography>
                {data.division_id ? (
                    <Chip label={data.division_id.name} color="secondary" size="small" />
                ) : (
                    <Typography variant="caption">No division assigned</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Assembly:</Typography>
                {data.assembly_id ? (
                    <Chip label={data.assembly_id.name} color="info" size="small" />
                ) : (
                    <Typography variant="caption">No assembly assigned</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Category:</Typography>
                <Chip 
                    label={data.category} 
                    color={
                        data.category === 'reserved' ? 'success' : 
                        data.category === 'special' ? 'warning' : 'info'
                    } 
                    size="small" 
                />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Regional Type:</Typography>
                <Chip 
                    label={data.regional_type} 
                    color={
                        data.regional_type === 'urban' ? 'primary' : 
                        data.regional_type === 'rural' ? 'secondary' : 'default'
                    } 
                    size="small" 
                />
            </Stack>

            <Typography>Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography>Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}