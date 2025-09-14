// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

// icons
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

// third-party
import { useFormik } from 'formik';
import * as yup from 'yup';

// project-imports
import MainCard from 'components/MainCard';
import trimFc from 'utils/trimFc';
import { openSnackbar } from 'api/snackbar';

// Styled components for contact boxes
const ContactCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const ContactIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(1),
  '& svg': {
    fontSize: '3rem',
  },
}));

// validation schema for contact form
const validationSchema = yup.object({
  name: yup.string().required('Name is required').min(2, 'Name must be at least 2 characters'),
  mobile: yup.string()
    .required('Mobile number is required')
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'),
  email: yup.string().email('Invalid email').required('Email is required'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
});

export default function HelpCenter() {
  const theme = useTheme();

  // Contact information
  const contactInfo = {
    email: 'support@electionat.com',
    mobile: '+91 98765 43210',
    whatsapp: '+91 98765 43210'
  };

  const formik = useFormik({
    initialValues: {
      name: '',
      mobile: '',
      email: '',
      description: ''
    },
    validationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        // Send form data to backend API
        console.log('Sending form data:', values);
        
        const response = await fetch('/api/help-center/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok && data.success) {
          openSnackbar({
            open: true,
            message: data.message,
            variant: 'alert',
            alert: {
              color: 'success'
            }
          });
          resetForm();
        } else {
          throw new Error(data.message || 'Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        
        openSnackbar({
          open: true,
          message: error.message || 'Failed to send message. Please try again.',
          variant: 'alert',
          alert: {
            color: 'error'
          }
        });
      } finally {
        setSubmitting(false);
      }
    }
  });

  const handleContactClick = (type, value) => {
    switch (type) {
      case 'email':
        window.open(`mailto:${value}`, '_blank');
        break;
      case 'mobile':
        window.open(`tel:${value}`, '_blank');
        break;
      case 'whatsapp':
        const whatsappNumber = value.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${whatsappNumber}`, '_blank');
        break;
      default:
        break;
    }
  };

  return (
    <MainCard title="Help Center">
      <Grid container spacing={4}>
        {/* Contact Information Section */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            Get in Touch
          </Typography>
          
          <Grid container spacing={3}>
            {/* Email Card */}
            <Grid item xs={12} sm={4}>
              <ContactCard onClick={() => handleContactClick('email', contactInfo.email)}>
                <CardContent>
                  <ContactIcon>
                    <EmailIcon />
                  </ContactIcon>
                  <Typography variant="h6" gutterBottom>
                    Email
                  </Typography>
                  <Typography variant="body2">
                    {contactInfo.email}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Click to send email
                  </Typography>
                </CardContent>
              </ContactCard>
            </Grid>

            {/* Mobile Card */}
            <Grid item xs={12} sm={4}>
              <ContactCard onClick={() => handleContactClick('mobile', contactInfo.mobile)}>
                <CardContent>
                  <ContactIcon>
                    <PhoneIcon />
                  </ContactIcon>
                  <Typography variant="h6" gutterBottom>
                    Mobile
                  </Typography>
                  <Typography variant="body2">
                    {contactInfo.mobile}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Click to call
                  </Typography>
                </CardContent>
              </ContactCard>
            </Grid>

            {/* WhatsApp Card */}
            <Grid item xs={12} sm={4}>
              <ContactCard onClick={() => handleContactClick('whatsapp', contactInfo.whatsapp)}>
                <CardContent>
                  <ContactIcon>
                    <WhatsAppIcon />
                  </ContactIcon>
                  <Typography variant="h6" gutterBottom>
                    WhatsApp
                  </Typography>
                  <Typography variant="body2">
                    {contactInfo.whatsapp}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    Click to chat
                  </Typography>
                </CardContent>
              </ContactCard>
            </Grid>
          </Grid>
        </Grid>

        {/* Divider */}
        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
        </Grid>

        {/* Contact Form Section */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            Send us a Message
          </Typography>
          
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Name Field */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel>Name *</InputLabel>
                  <TextField
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formik.values.name}
                    onChange={trimFc(formik)}
                    onBlur={formik.handleBlur}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    fullWidth
                  />
                </Stack>
              </Grid>

              {/* Mobile Field */}
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <InputLabel>Mobile Number *</InputLabel>
                  <TextField
                    id="mobile"
                    name="mobile"
                    placeholder="Enter your mobile number"
                    value={formik.values.mobile}
                    onChange={trimFc(formik)}
                    onBlur={formik.handleBlur}
                    error={formik.touched.mobile && Boolean(formik.errors.mobile)}
                    helperText={formik.touched.mobile && formik.errors.mobile}
                    fullWidth
                  />
                </Stack>
              </Grid>

              {/* Email Field */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel>Email *</InputLabel>
                  <TextField
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formik.values.email}
                    onChange={trimFc(formik)}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    fullWidth
                  />
                </Stack>
              </Grid>

              {/* Description Field */}
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel>Description *</InputLabel>
                  <TextField
                    id="description"
                    name="description"
                    placeholder="Describe your query or issue in detail..."
                    value={formik.values.description}
                    onChange={trimFc(formik)}
                    onBlur={formik.handleBlur}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                    multiline
                    rows={4}
                    fullWidth
                  />
                </Stack>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Stack direction="row" justifyContent="center" spacing={2}>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    type="button" 
                    onClick={() => formik.resetForm()}
                    disabled={formik.isSubmitting}
                  >
                    Reset
                  </Button>
                  <Button 
                    variant="contained" 
                    type="submit" 
                    disabled={formik.isSubmitting}
                    sx={{ minWidth: 120 }}
                  >
                    {formik.isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        </Grid>

        {/* Additional Help Information */}
        <Grid item xs={12}>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              For urgent matters, please call us directly at <strong>{contactInfo.mobile}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              We typically respond to emails within 24 hours during business days.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </MainCard>
  );
}
