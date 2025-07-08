import { Stack, Typography, Divider, Chip } from '@mui/material';

export default function BoothVolunteerView({ data }) {
  if (!data) return null;

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Volunteer Details</Typography>
      <Divider />

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Name:</Typography>
        <Typography>{data.name}</Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Phone:</Typography>
        <Typography>{data.phone}</Typography>
      </Stack>

      {data.email && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Email:</Typography>
          <Typography>{data.email}</Typography>
        </Stack>
      )}

      {data.role && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Role:</Typography>
          <Typography>{data.role}</Typography>
        </Stack>
      )}

      {data.area_responsibility && (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight="bold">Area Responsibility:</Typography>
          <Typography>{data.area_responsibility}</Typography>
        </Stack>
      )}

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Activity Level:</Typography>
        <Chip
          label={data.activity_level}
          color={
            data.activity_level === 'High' ? 'success' :
            data.activity_level === 'Medium' ? 'warning' : 'error'
          }
          size="small"
        />
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography fontWeight="bold">Party:</Typography>
        {data.party ? (
          <Chip label={data.party.name} color="primary" size="small" />
        ) : (
          <Typography variant="caption">No party assigned</Typography>
        )}
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

      {data.remarks && (
        <>
          <Typography fontWeight="bold">Remarks:</Typography>
          <Typography>{data.remarks}</Typography>
        </>
      )}

      <Divider />
      <Typography variant="caption">Created At: {new Date(data.created_at).toLocaleString()}</Typography>
      <Typography variant="caption">Updated At: {new Date(data.updated_at).toLocaleString()}</Typography>
    </Stack>
  );
}