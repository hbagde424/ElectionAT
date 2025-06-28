import { Stack, Typography, Divider, Chip, Box } from '@mui/material';
// import { MapOutlined } from '@mui/icons-material';
// import { Stack, Typography, Divider, Chip } from '@mui/material';
export default function BoothView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={2}>
            <Typography variant="h6">{data.name} (Booth: {data.booth_number})</Typography>
            <Divider />
            
            <Stack spacing={1}>
                <Typography fontWeight="bold">Address:</Typography>
                <Typography>{data.full_address}</Typography>
            </Stack>

            {(data.latitude && data.longitude) && (
                <Stack direction="row" spacing={1} alignItems="center">
                    <MapOutlined color="primary" />
                    <Typography>
                        Coordinates: {data.latitude}, {data.longitude}
                    </Typography>
                </Stack>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>State:</Typography>
                        {data.state_id ? (
                            <Chip label={data.state_id.name} color="primary" size="small" />
                        ) : (
                            <Typography variant="caption">No state</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>District:</Typography>
                        {data.district_id ? (
                            <Chip label={data.district_id.name} color="secondary" size="small" />
                        ) : (
                            <Typography variant="caption">No district</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>Division:</Typography>
                        {data.division_id ? (
                            <Chip label={data.division_id.name} color="info" size="small" />
                        ) : (
                            <Typography variant="caption">No division</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>Block:</Typography>
                        {data.block_id ? (
                            <Chip label={data.block_id.name} color="warning" size="small" />
                        ) : (
                            <Typography variant="caption">No block</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>Assembly:</Typography>
                        {data.assembly_id ? (
                            <Chip label={data.assembly_id.name} color="success" size="small" />
                        ) : (
                            <Typography variant="caption">No assembly</Typography>
                        )}
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>Parliament:</Typography>
                        {data.parliament_id ? (
                            <Chip label={data.parliament_id.name} color="error" size="small" />
                        ) : (
                            <Typography variant="caption">No parliament</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Typography>Created At: {new Date(data.created_at).toLocaleString()}</Typography>
            <Typography>Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
    );
}