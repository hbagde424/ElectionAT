// ParliamentVotesView.js
import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function ParliamentVotesView({ data }) {
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Parliament Vote Details</Typography>
      <Divider />
      
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Candidate:</Typography>
        <Typography>{data.candidate_id.name}</Typography>
      </Stack>
      
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Parliament:</Typography>
        <Typography>{data.parliament_id.name}</Typography>
      </Stack>
      
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Assembly:</Typography>
        <Typography>{data.assembly_id.name}</Typography>
      </Stack>
      
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Block:</Typography>
        <Typography>{data.block_id.name}</Typography>
      </Stack>
      
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Booth:</Typography>
        <Typography>{data.booth_id.name} (No: {data.booth_id.booth_number})</Typography>
      </Stack>
      
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Election Year:</Typography>
        <Typography>{data.election_year_id.year}</Typography>
      </Stack>
      
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Total Votes:</Typography>
        <Chip label={data.total_votes} color="primary" />
      </Stack>
      
      <Divider />
      <Typography variant="caption">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
      <Typography variant="caption">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
    </Stack>
  );
}