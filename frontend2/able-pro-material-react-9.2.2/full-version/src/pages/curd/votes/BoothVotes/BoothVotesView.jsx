// BoothVotesView.js
import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function BoothVotesView({ data }) {
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Booth Vote Details</Typography>
      <Divider />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Candidate:</Typography>
        <Typography>{data.candidate_id?.name}</Typography>
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
        <Typography fontWeight="bold">Parliament:</Typography>
        {data.parliament_id ? (
          <Chip label={data.parliament_id.name} color="info" size="small" />
        ) : (
          <Typography variant="caption">No parliament</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Assembly:</Typography>
        {data.assembly_id ? (
          <Chip label={data.assembly_id.name} color="secondary" size="small" />
        ) : (
          <Typography variant="caption">No assembly</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Block:</Typography>
        {data.block_id ? (
          <Chip label={data.block_id.name} color="primary" size="small" />
        ) : (
          <Typography variant="caption">No block</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Booth:</Typography>
        <Typography>{data.booth_id?.name} (No: {data.booth_id?.booth_number})</Typography>
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

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Created By:</Typography>
        <Typography>{data.created_by?.name || 'Unknown'}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Updated By:</Typography>
        <Typography>{data.updated_by?.name || 'Unknown'}</Typography>
      </Stack>

      <Typography variant="caption">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
      <Typography variant="caption">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
    </Stack>
  );
}