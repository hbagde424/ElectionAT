import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function BoothVotesView({ data }) {
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Booth Vote Details</Typography>
      <Divider />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Candidate:</Typography>
        <Typography>{data.candidate?.name || 'N/A'}</Typography>
        {data.candidate?.party && (
          <Chip label={data.candidate.party.name} color="primary" size="small" />
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Total Votes:</Typography>
        <Chip
          label={data.total_votes.toLocaleString()}
          color="success"
          size="small"
          variant="outlined"
        />
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Election Year:</Typography>
        <Typography>{data.election_year?.year || 'N/A'}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Booth:</Typography>
        {data.booth ? (
          <Typography>{data.booth.name} (No: {data.booth.booth_number})</Typography>
        ) : (
          <Typography variant="caption">No booth assigned</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Block:</Typography>
        {data.block ? (
          <Chip label={data.block.name} color="info" size="small" />
        ) : (
          <Typography variant="caption">No block assigned</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Assembly:</Typography>
        {data.assembly ? (
          <Chip label={data.assembly.name} color="success" size="small" />
        ) : (
          <Typography variant="caption">No assembly assigned</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Parliament:</Typography>
        {data.parliament ? (
          <Chip label={data.parliament.name} color="warning" size="small" />
        ) : (
          <Typography variant="caption">No parliament assigned</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Division:</Typography>
        {data.division ? (
          <Chip label={data.division.name} color="secondary" size="small" />
        ) : (
          <Typography variant="caption">No division assigned</Typography>
        )}
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">State:</Typography>
        {data.state ? (
          <Chip label={data.state.name} color="primary" size="small" />
        ) : (
          <Typography variant="caption">No state assigned</Typography>
        )}
      </Stack>

      <Divider />
      <Typography variant="caption">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
      <Typography variant="caption">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
    </Stack>
  );
}