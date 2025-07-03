
// PartyView.jsx
import { Stack, Typography, Divider } from '@mui/material';

export default function PartyView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={1}>
            <Typography variant="h6">{data.name}</Typography>
            <Divider />
            <Typography>Abbreviation: {data.abbreviation}</Typography>
            <Typography>Symbol: {data.symbol}</Typography>
            <Typography>Founded Year: {data.founded_year}</Typography>
        </Stack>
    );
}
