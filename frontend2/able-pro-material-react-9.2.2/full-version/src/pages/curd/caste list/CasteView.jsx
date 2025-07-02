import { Stack, Typography, Divider, Chip, Box, Grid } from '@mui/material';

export default function CasteListView({ data }) {
    if (!data) return null;

    const categoryColors = {
        'SC': 'error',
        'ST': 'warning',
        'OBC': 'info',
        'General': 'success',
        'Other': 'primary'
    };

    return (
        <Stack spacing={2} sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h6">{data.caste}</Typography>
                <Chip 
                    label={data.category} 
                    color={categoryColors[data.category]} 
                    size="medium" 
                />
            </Stack>
            <Divider />

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Division:</Typography>
                        {data.division_id ? (
                            <Chip label={data.division_id.name} color="primary" size="small" />
                        ) : (
                            <Typography variant="caption">No division</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Parliament:</Typography>
                        {data.parliament_id ? (
                            <Chip label={data.parliament_id.name} color="secondary" size="small" />
                        ) : (
                            <Typography variant="caption">No parliament</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Assembly:</Typography>
                        {data.assembly_id ? (
                            <Chip label={data.assembly_id.name} color="info" size="small" />
                        ) : (
                            <Typography variant="caption">No assembly</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Block:</Typography>
                        {data.block_id ? (
                            <Chip label={data.block_id.name} color="warning" size="small" />
                        ) : (
                            <Typography variant="caption">No block</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12}>
                    <Stack spacing={1}>
                        <Typography fontWeight="bold">Booth:</Typography>
                        {data.booth_id ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Chip 
                                    label={data.booth_id.name} 
                                    color="success" 
                                    size="small" 
                                />
                                <Typography variant="body2">
                                    (Booth Number: {data.booth_id.booth_number})
                                </Typography>
                            </Stack>
                        ) : (
                            <Typography variant="caption">No booth</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Divider />
            <Typography variant="caption">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography variant="caption">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}