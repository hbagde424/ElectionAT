import { Stack, Typography, Divider, Chip, Grid } from '@mui/material';

export default function EventView({ data }) {
    if (!data) return null;

    const typeColors = {
        'event': 'primary',
        'campaign': 'secondary',
        'activity': 'info'
    };

    const statusColors = {
        'done': 'success',
        'incomplete': 'warning',
        'cancelled': 'error',
        'postponed': 'info'
    };

    return (
        <Stack spacing={2}>
            <Typography variant="h6">Event Details</Typography>
            <Divider />
            
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Name:</Typography>
                        <Typography>{data.name}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Type:</Typography>
                        <Chip 
                            label={data.type} 
                            color={typeColors[data.type]} 
                            size="small" 
                            sx={{ textTransform: 'capitalize' }}
                        />
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Status:</Typography>
                        <Chip 
                            label={data.status} 
                            color={statusColors[data.status]} 
                            size="small" 
                            sx={{ textTransform: 'capitalize' }}
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Location:</Typography>
                        <Typography>{data.location}</Typography>
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Start Date:</Typography>
                        <Typography>{new Date(data.start_date).toLocaleString()}</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">End Date:</Typography>
                        <Typography>{new Date(data.end_date).toLocaleString()}</Typography>
                    </Stack>
                </Grid>
            </Grid>

            {data.description && (
                <Stack spacing={1}>
                    <Typography fontWeight="bold">Description:</Typography>
                    <Typography>{data.description}</Typography>
                </Stack>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Booth:</Typography>
                        {data.booth_id ? (
                            <Typography>
                                {data.booth_id.name} (Booth: {data.booth_id.booth_number})
                            </Typography>
                        ) : (
                            <Typography variant="caption">No booth</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Block:</Typography>
                        {data.block_id ? (
                            <Chip label={data.block_id.name} color="primary" size="small" />
                        ) : (
                            <Typography variant="caption">No block</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Assembly:</Typography>
                        {data.assembly_id ? (
                            <Chip label={data.assembly_id.name} color="secondary" size="small" />
                        ) : (
                            <Typography variant="caption">No assembly</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Parliament:</Typography>
                        {data.parliament_id ? (
                            <Chip label={data.parliament_id.name} color="info" size="small" />
                        ) : (
                            <Typography variant="caption">No parliament</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Stack spacing={1}>
                <Typography fontWeight="bold">Division:</Typography>
                {data.division_id ? (
                    <Chip label={data.division_id.name} color="warning" size="small" />
                ) : (
                    <Typography variant="caption">No division</Typography>
                )}
            </Stack>

            <Typography variant="body2">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography variant="body2">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}