import { Stack, Typography, Divider } from '@mui/material';

export default function VolunteerView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={1}>
            <Typography variant="h6">{data.name}</Typography>
            <Divider />
            <Typography>Email: {data.email}</Typography>
            <Typography>Phone: {data.phone}</Typography>
            <Typography>Booth: {data.booth_id?.name}</Typography>
            <Typography>Party: {data.party_id?.name}</Typography>
            <Typography>Area Responsibility: {data.area_responsibility}</Typography>
            <Typography>Remarks: {data.remarks}</Typography>
        </Stack>
    );
}
