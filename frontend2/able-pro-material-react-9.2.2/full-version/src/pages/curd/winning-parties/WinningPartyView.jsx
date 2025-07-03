import { Stack, Typography, Divider } from '@mui/material';

export default function WinningPartyView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={1}>
            <Typography variant="h6">Winning Party Details</Typography>
            <Divider />
            <Typography>Candidate: {data.candidate_id?.name || data.candidate_id}</Typography>
            <Typography>Assembly: {data.assembly_id?.name || data.assembly_id}</Typography>
            <Typography>Parliament: {data.parliament_id?.name || data.parliament_id}</Typography>
            <Typography>Party: {data.party_id?.name || data.party_id}</Typography>
            <Typography>Year: {data.year_id?.year || data.year_id}</Typography>
            <Typography>Votes: {data.votes}</Typography>
            <Typography>Margin: {data.margin}</Typography>
        </Stack>
    );
}
