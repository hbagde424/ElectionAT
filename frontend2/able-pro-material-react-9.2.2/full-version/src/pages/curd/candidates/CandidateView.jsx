// === CandidateView.jsx ===
import { Stack, Typography, Divider, Avatar } from '@mui/material';

export default function CandidateView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={1}>
            <Typography variant="h6">{data.name}</Typography>
            <Divider />
            <Stack direction="row" spacing={2} alignItems="center">
                {data.photo && <Avatar src={data.photo} alt={data.name} sx={{ width: 64, height: 64 }} />}
                <Stack>
                    <Typography>Party: {data.party?.name}</Typography>
                    <Typography>Assembly: {data.assembly?.name}</Typography>
                    <Typography>Election Year: {data.election_year?.year}</Typography>
                    <Typography>Caste: {data.caste}</Typography>
                    <Typography>Votes: {data.votes}</Typography>
                    <Typography>Criminal Cases: {data.criminal_cases}</Typography>
                    <Typography>Assets: {data.assets}</Typography>
                    <Typography>Liabilities: {data.liabilities}</Typography>
                    <Typography>Education: {data.education}</Typography>
                    <Typography>Status: {data.is_active ? 'Active' : 'Inactive'}</Typography>
                </Stack>
            </Stack>
        </Stack>
    );
}
