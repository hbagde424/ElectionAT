
// VisitView.jsx
import { Stack, Typography, Divider } from '@mui/material';

export default function VisitView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={1}>
            <Typography variant="h6">{data.person_name}</Typography>
            <Divider />
            <Typography>Post: {data.post}</Typography>
            <Typography>Date: {data.date?.slice(0, 10)}</Typography>
            <Typography>Declaration: {data.declaration}</Typography>
            <Typography>Remark: {data.remark}</Typography>
            <Typography>Division: {data.division_id?.name}</Typography>
            <Typography>Parliament: {data.parliament_id?.name}</Typography>
            <Typography>Assembly: {data.assembly_id?.name}</Typography>
            <Typography>Block: {data.block_id?.name}</Typography>
            <Typography>Booth: {data.booth_id?.name}</Typography>
        </Stack>
    );
}
