import { Grid, Stack, Typography, Chip, Divider } from '@mui/material';

export default function AssemblyView({ data }) {
    return (
        <Grid container spacing={3} sx={{ p: 2 }}>
            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Assembly Name</Typography>
                    <Typography variant="body1">{data.name || 'N/A'}</Typography>
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">AC Number</Typography>
                    <Chip label={data.AC_NO || 'N/A'} color="primary" size="small" />
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Type</Typography>
                    <Chip label={data.type || 'N/A'} color="secondary" size="small" variant="outlined" />
                </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                    <Chip label={data.category || 'N/A'} color="info" size="small" variant="outlined" />
                </Stack>
            </Grid>

            <Grid item xs={12}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                    <Typography variant="body2">{data.description || 'N/A'}</Typography>
                </Stack>
            </Grid>

            <Grid item xs={12}>
                <Divider />
            </Grid>

            <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                    <Typography variant="subtitle2" color="textSecondary">State</Typography>
                    <Chip label={data.state_id?.name || 'N/A'} color="primary" size="small" variant="outlined" />
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
                    <Typography variant="subtitle2" color="textSecondary">Parliament</Typography>
                    <Chip label={data.parliament_id?.name || 'N/A'} color="warning" size="small" variant="outlined" />
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
