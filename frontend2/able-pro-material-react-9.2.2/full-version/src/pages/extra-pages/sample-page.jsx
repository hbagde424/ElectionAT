// material-ui
import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

// third-party
import { useFormik } from 'formik';
import * as yup from 'yup';

// project-imports
import MainCard from 'components/MainCard';
import trimFc from 'utils/trimFc';

// validation schema
const validationSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  role: yup.string().required('Role is required'),
  accessLevel: yup.string().required('Access level is required'),
  regionIds: yup.array().when('role', {
    is: (role) => role !== 'SuperAdmin',
    then: yup.array().min(1, 'At least one region is required'),
    otherwise: yup.array()
  }),
  regionModel: yup.string().when('role', {
    is: (role) => role !== 'SuperAdmin',
    then: yup.string().required('Region type is required'),
    otherwise: yup.string()
  })
});

// role options
const roles = [
  'SuperAdmin',
  'Admin',
  'Booth',
  'Division',
  'Parliament',
  'Block',
  'Assembly'
];

// region model options
const regionModels = [
  'Division',
  'Parliament',
  'Block',
  'Assembly',
  'Booth'
];

// access level options
const accessLevels = [
  { value: 'editor', label: 'Editor' },
  { value: 'viewOnly', label: 'View Only' }
];

export default function UserForm({ initialValues, onSubmit, isEdit = false }) {
  const theme = useTheme();

  const formik = useFormik({
    initialValues: initialValues || {
      email: '',
      password: '',
      role: '',
      accessLevel: 'viewOnly',
      regionIds: [],
      regionModel: '',
      isActive: true
    },
    validationSchema,
    onSubmit: async (values) => {
      await onSubmit(values);
    }
  });

  return (
    <MainCard title={isEdit ? "Edit User" : "Create Admin/User"}>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3.5}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <InputLabel>Email*</InputLabel>
              <TextField
                id="email"
                name="email"
                placeholder="Enter email"
                value={formik.values.email}
                onChange={trimFc(formik)}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                fullWidth
                disabled={isEdit}
              />
            </Stack>
          </Grid>
          
          {!isEdit && (
            <Grid item xs={12} sm={6}>
              <Stack spacing={1}>
                <InputLabel>Password*</InputLabel>
                <TextField
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formik.values.password}
                  onChange={trimFc(formik)}
                  onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password}
                  fullWidth
                />
              </Stack>
            </Grid>
          )}
          
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <InputLabel>Role*</InputLabel>
              <TextField
                id="role"
                name="role"
                select
                value={formik.values.role}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.role && Boolean(formik.errors.role)}
                helperText={formik.touched.role && formik.errors.role}
                fullWidth
              >
                {roles.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <InputLabel>Access Level*</InputLabel>
              <TextField
                id="accessLevel"
                name="accessLevel"
                select
                value={formik.values.accessLevel}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.accessLevel && Boolean(formik.errors.accessLevel)}
                helperText={formik.touched.accessLevel && formik.errors.accessLevel}
                fullWidth
              >
                {accessLevels.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Grid>
          
          {formik.values.role !== 'SuperAdmin' && (
            <>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel>Region Type*</InputLabel>
                  <TextField
                    id="regionModel"
                    name="regionModel"
                    select
                    value={formik.values.regionModel}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.regionModel && Boolean(formik.errors.regionModel)}
                    helperText={formik.touched.regionModel && formik.errors.regionModel}
                    fullWidth
                  >
                    {regionModels.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel>Region IDs*</InputLabel>
                  <TextField
                    id="regionIds"
                    name="regionIds"
                    placeholder="Enter region IDs (comma separated)"
                    value={formik.values.regionIds.join(',')}
                    onChange={(e) => {
                      const value = e.target.value.split(',').map(item => item.trim());
                      formik.setFieldValue('regionIds', value);
                    }}
                    onBlur={formik.handleBlur}
                    error={formik.touched.regionIds && Boolean(formik.errors.regionIds)}
                    helperText={formik.touched.regionIds && formik.errors.regionIds}
                    fullWidth
                  />
                </Stack>
              </Grid>
            </>
          )}
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.isActive}
                  onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                  name="isActive"
                  color="primary"
                />
              }
              label="Active User"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          <Grid item xs={12}>
            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={2}>
              <Button variant="outlined" color="secondary" type="reset" onClick={() => formik.resetForm()}>
                Reset
              </Button>
              <Button variant="contained" type="submit" disabled={formik.isSubmitting}>
                {isEdit ? 'Update User' : 'Create User'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </MainCard>
  );
}