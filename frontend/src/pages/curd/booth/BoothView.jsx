import { Grid, Stack, Typography, Chip, Divider } from '@mui/material';

export default function BoothView({ data }) {
    return (
        <Grid container spacing={3} sx={{ p: 2 }}>
            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Booth Name</Typography>
                    <Typography variant="body1">{data.name || 'N/A'}</Typography>
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Booth Number</Typography>
                    <Chip label={data.booth_number || 'N/A'} color="primary" size="small" />
                </Stack>
            </Grid>

            <Grid item xs={12}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Full Address</Typography>
                    <Typography variant="body2">{data.full_address || 'N/A'}</Typography>
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Coordinates</Typography>
                    <Typography variant="body2">Latitude: {data.latitude || 0}</Typography>
                    <Typography variant="body2">Longitude: {data.longitude || 0}</Typography>
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Voter Count</Typography>
                    <Typography variant="body2">Male: {data.Male_Count || 0}</Typography>
                    <Typography variant="body2">Female: {data.Female_Count || 0}</Typography>
                    <Typography variant="body2">Others: {data.others_Count || 0}</Typography>
                    <Typography variant="body2" fontWeight="bold">Total: {data.Total || 0}</Typography>
                </Stack>
            </Grid>

            <Grid item xs={12}>
                <Divider />
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Block</Typography>
                    <Chip label={data.block_id?.name || 'N/A'} color="secondary" size="small" variant="outlined" />
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Assembly</Typography>
                    <Chip label={data.assembly_id?.name || 'N/A'} color="info" size="small" variant="outlined" />
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Parliament</Typography>
                    <Chip label={data.parliament_id?.name || 'N/A'} color="warning" size="small" variant="outlined" />
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Division</Typography>
                    <Chip label={data.division_id?.name || 'N/A'} color="success" size="small" variant="outlined" />
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">State</Typography>
                    <Chip label={data.state_id?.name || 'N/A'} color="primary" size="small" variant="outlined" />
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Polygon</Typography>
                    <Chip label={data.polygon ? 'Available' : 'Not Available'} color={data.polygon ? 'success' : 'default'} size="small" />
                </Stack>
            </Grid>

            <Grid item xs={12}>
                <Divider />
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Created By</Typography>
                    <Typography variant="body2">{data.created_by?.username || 'N/A'}</Typography>
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Updated By</Typography>
                    <Typography variant="body2">{data.updated_by?.username || 'N/A'}</Typography>
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Created At</Typography>
                    <Typography variant="body2">
                        {data.created_at ? new Date(data.created_at).toLocaleString() : 'N/A'}
                    </Typography>
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Updated At</Typography>
                    <Typography variant="body2">
                        {data.updated_at ? new Date(data.updated_at).toLocaleString() : 'N/A'}
                    </Typography>
                </Stack>
            </Grid>
        </Grid>
    );
}
