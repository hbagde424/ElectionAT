// AssemblyVotesView.js
import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function AssemblyVotesView({ data }) {
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Vote Details</Typography>
      <Divider />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Candidate:</Typography>
        <Typography>{data.candidate?.name || 'N/A'}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">State:</Typography>
        {data.state ? (
          <Chip label={data.state.name} color="success" size="small" variant="outlined" />
        ) : (
          <Typography variant="caption">No state</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Division:</Typography>
        {data.division ? (
          <Chip label={data.division.name} color="warning" size="small" />
        ) : (
          <Typography variant="caption">No division</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Parliament:</Typography>
        {data.parliament ? (
          <Chip label={data.parliament.name} color="info" size="small" />
        ) : (
          <Typography variant="caption">No parliament</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Assembly:</Typography>
        <Typography>{data.assembly?.name || 'N/A'}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Block:</Typography>
        <Typography>{data.block?.name || 'N/A'}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Booth:</Typography>
        <Typography>{data.booth?.name || 'N/A'} (No: {data.booth?.booth_number || 'N/A'})</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Election Year:</Typography>
        <Typography>{data.election_year?.year || 'N/A'}</Typography>
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

      {data.updated_by && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Updated By:</Typography>
          <Typography>{data.updated_by?.name || 'Unknown'}</Typography>
        </Stack>
      )}

      <Typography variant="caption">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
      <Typography variant="caption">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
    </Stack>
  );
}