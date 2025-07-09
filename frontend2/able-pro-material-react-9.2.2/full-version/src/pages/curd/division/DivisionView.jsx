import { Stack, Typography, Divider, Chip, Switch } from '@mui/material';

export default function DivisionView({ data }) {
    if (!data) return null;

    return (
        <Stack spacing={2}>
            <Typography variant="h6">{data.name}</Typography>
            <Divider />
            
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Code:</Typography>
                <Chip label={data.division_code} color="info" size="small" />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>State:</Typography>
                {data.state_id ? (
                    <Chip label={data.state_id.name} color="primary" size="small" />
                ) : (
                    <Typography variant="caption">No state assigned</Typography>
                )}
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
                <Typography>Status:</Typography>
                <Switch checked={data.is_active} disabled color="success" />
                <Typography>{data.is_active ? 'Active' : 'Inactive'}</Typography>
            </Stack>

            <Stack direction="row" spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Created By:</Typography>
          <Typography>{data.created_by?.username || 'System'}</Typography>
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Created At:</Typography>
          <Typography>{new Date(data.created_at).toLocaleString()}</Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Updated By:</Typography>
          <Typography>{data.updated_by?.username || 'System'}</Typography>
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">Updated At:</Typography>
          <Typography>{new Date(data.updated_at).toLocaleString()}</Typography>
        </Stack>
      </Stack>
        </Stack>
    );
}