import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function VolunteerView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={2}>
            <Typography variant="h6">Volunteer Details</Typography>
            <Divider />

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Name:</Typography>
                <Typography>{data.name}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Role:</Typography>
                <Typography>{data.role || 'Not specified'}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Email:</Typography>
                <Typography>{data.email}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Phone:</Typography>
                <Typography>{data.phone}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">State:</Typography>
                {data.state_id ? (
                    <Chip label={data.state_id.name} color="success" size="small" variant="outlined" />
                ) : (
                    <Typography variant="caption">No state</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Division:</Typography>
                {data.division_id ? (
                    <Chip label={data.division_id.name} color="warning" size="small" />
                ) : (
                    <Typography variant="caption">No division</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Booth:</Typography>
                {data.booth_id ? (
                    <Typography>{data.booth_id.name} (No: {data.booth_id.booth_number})</Typography>
                ) : (
                    <Typography variant="caption">No booth</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Party:</Typography>
                {data.party_id ? (
                    <Chip label={data.party_id.name} color="primary" size="small" />
                ) : (
                    <Typography variant="caption">No party</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Area Responsibility:</Typography>
                <Typography>{data.area_responsibility || 'Not specified'}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Activity Level:</Typography>
                <Chip
                    label={data.activity_level || 'Medium'}
                    color={data.activity_level === 'High' ? 'success' : data.activity_level === 'Low' ? 'error' : 'warning'}
                    size="small"
                />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Remarks:</Typography>
                <Typography>{data.remarks || 'No remarks'}</Typography>
            </Stack>

            <Divider />

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Created By:</Typography>
                <Typography>{data.created_by?.name || 'Unknown'}</Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight="bold">Updated By:</Typography>
                <Typography>{data.updated_by?.name || 'Not updated'}</Typography>
            </Stack>
        </Stack>
    );
}
