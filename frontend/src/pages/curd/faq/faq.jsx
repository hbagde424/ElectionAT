// react
import React, { useState, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

// icons
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';

// project-imports
import MainCard from 'components/MainCard';

// Styled components
const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  marginBottom: theme.spacing(1),
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: `${theme.spacing(1)} 0`,
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: theme.palette.primary.lighter,
  '&.Mui-expanded': {
    backgroundColor: theme.palette.primary.light,
  },
  '& .MuiAccordionSummary-content': {
    alignItems: 'center',
  },
}));

const CategoryCard = styled(Card)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.lighter,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

export default function FAQ() {
  const theme = useTheme();
  
  // State for dynamic data
  const [faqData, setFaqData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Fetch FAQ data from API
  useEffect(() => {
    const token = localStorage.getItem('serviceToken');
    if (!token) {
      console.warn('No serviceToken, skipping public FAQ data fetch');
      setFaqData([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    fetchFAQData();
  }, []);

  const fetchFAQData = async () => {
    try {
      setLoading(true);
      // Fetch all active FAQs
      const token = localStorage.getItem('serviceToken');
      if (!token) {
        console.warn('No serviceToken inside fetchFAQData, aborting');
        setFaqData([]);
        setCategories([]);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/faqs?is_active=true&all=true`, { headers });
      const result = await response.json();
      
      if (result.success && result.data) {
        const faqs = result.data;
        
        // Group FAQs by category
        const groupedFAQs = faqs.reduce((acc, faq) => {
          const category = faq.category || 'Other';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push({
            id: faq._id,
            question: faq.question,
            answer: faq.answer
          });
          return acc;
        }, {});

        // Convert to array format
        const faqDataArray = Object.keys(groupedFAQs).map(category => ({
          category,
          questions: groupedFAQs[category].sort((a, b) => a.order_index - b.order_index)
        }));

        setFaqData(faqDataArray);
        
        // Generate dynamic categories
        const dynamicCategories = Object.keys(groupedFAQs).map((category, index) => {
          let icon = <HelpOutlineIcon />;
          let description = 'Information and guidance';
          
          // Set icons and descriptions based on category
          switch (category) {
            case 'General Questions':
              icon = <HelpOutlineIcon />;
              description = 'Basic information about ElectionAT platform';
              break;
            case 'Account & Login':
              icon = <ContactSupportIcon />;
              description = 'Account management and login related queries';
              break;
            case 'Data & Analytics':
              icon = <QuestionAnswerIcon />;
              description = 'Questions about election data and analytics';
              break;
            case 'Technical Support':
              icon = <QuestionAnswerIcon />;
              description = 'Technical assistance and troubleshooting';
              break;
            default:
              icon = <HelpOutlineIcon />;
              description = `${category} related questions and answers`;
          }
          
          return {
            id: index + 1,
            title: category,
            icon: icon,
            description: description
          };
        });
        
        setCategories(dynamicCategories);
      }
    } catch (error) {
      console.error('Error fetching FAQ data:', error);
      // Fallback to empty data
      setFaqData([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  if (loading) {
    return (
      <MainCard title="Frequently Asked Questions">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard title="Frequently Asked Questions">
      <Grid container spacing={4}>
        {/* Header Section */}
        <Grid item xs={12}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom color="primary">
              How can we help you?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Find answers to commonly asked questions about ElectionAT platform
            </Typography>
          </Box>
        </Grid>

        {/* FAQ Categories */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 3 }}>
            Browse by Category
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {categories.length > 0 ? categories.map((category) => (
              <Grid item xs={12} sm={4} key={category.id}>
                <CategoryCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {React.cloneElement(category.icon, { fontSize: 'large' })}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {category.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {category.description}
                    </Typography>
                  </CardContent>
                </CategoryCard>
              </Grid>
            )) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No FAQ categories available at the moment.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* FAQ Accordion */}
        <Grid item xs={12}>
          {faqData.length > 0 ? faqData.map((category, categoryIndex) => (
            <Box key={category.category} sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom color="primary" sx={{ mb: 2 }}>
                {category.category}
              </Typography>
              
              {category.questions.map((faq) => (
                <StyledAccordion
                  key={faq.id}
                  expanded={expanded === `panel${faq.id}`}
                  onChange={handleChange(`panel${faq.id}`)}
                >
                  <StyledAccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`panel${faq.id}bh-content`}
                    id={`panel${faq.id}bh-header`}
                  >
                    <HelpOutlineIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      {faq.question}
                    </Typography>
                  </StyledAccordionSummary>
                  <AccordionDetails sx={{ p: 3 }}>
                    <Box 
                      sx={{ lineHeight: 1.7 }}
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </AccordionDetails>
                </StyledAccordion>
              ))}
            </Box>
          )) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" gutterBottom color="text.secondary">
                No FAQs available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Please check back later or contact support if you need assistance.
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Contact Section */}
        <Grid item xs={12}>
          <Box 
            sx={{ 
              textAlign: 'center', 
              mt: 4, 
              p: 3, 
              backgroundColor: 'primary.lighter',
              borderRadius: 2 
            }}
          >
            <Typography variant="h6" gutterBottom color="primary">
              Still have questions?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Can't find the answer you're looking for? Contact our support team.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visit our <strong>Help Center</strong> to get in touch with our support team.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </MainCard>
  );
}