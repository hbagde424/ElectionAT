import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function UserView({ data }) {
  if (!data) return null;

  const formatArray = (items) => {
    if (!items || items.length === 0) return 'None';
    return items.map(item => item.name).join(', ');
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">User Details</Typography>
      <Divider />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Username:</Typography>
        <Typography>{data.username}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Mobile:</Typography>
        <Typography>{data.mobile}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Email:</Typography>
        <Typography>{data.email}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Role:</Typography>
        <Chip
          label={data.role}
          color={
            data.role === 'superAdmin' ? 'error' :
            data.role === 'Admin' ? 'warning' : 'primary'
          }
          size="small"
        />
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Status:</Typography>
        <Chip
          label={data.isActive ? 'Active' : 'Inactive'}
          color={data.isActive ? 'success' : 'error'}
          size="small"
        />
      </Stack>

      {data.state_ids?.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">States:</Typography>
          <Typography>{formatArray(data.state_ids)}</Typography>
        </Stack>
      )}

      {data.division_ids?.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Divisions:</Typography>
          <Typography>{formatArray(data.division_ids)}</Typography>
        </Stack>
      )}

      {data.parliament_ids?.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Parliaments:</Typography>
          <Typography>{formatArray(data.parliament_ids)}</Typography>
        </Stack>
      )}

      {data.assembly_ids?.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Assemblies:</Typography>
          <Typography>{formatArray(data.assembly_ids)}</Typography>
        </Stack>
      )}

      {data.block_ids?.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Blocks:</Typography>
          <Typography>{formatArray(data.block_ids)}</Typography>
        </Stack>
      )}

      {data.booth_ids?.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Booths:</Typography>
          <Typography>{formatArray(data.booth_ids)}</Typography>
        </Stack>
      )}

      <Divider />
      <Typography variant="caption">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
      <Typography variant="caption">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
    </Stack>
  );
}