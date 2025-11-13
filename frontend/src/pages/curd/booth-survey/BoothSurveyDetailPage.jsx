import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Container,
    Typography,
    Grid,
    CardContent,
    Stack,
    Button,
    IconButton,
    LinearProgress,
    Alert,
    Breadcrumbs,
    Link,
    Paper
} from '@mui/material';
import { ArrowBack, Phone, Room } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';
import axiosServices from 'utils/axios';
import DetailRenderer from 'components/DetailRenderer';
import { usePermissions } from 'contexts/PermissionContext';

const BoothSurveyDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams();
    const { userHierarchy, getUserHighestLevel } = usePermissions();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSurveyDetails();
    }, [id]);

    const fetchSurveyDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('serviceToken');
            const response = await axiosServices.get(`/booth-surveys/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setSurvey(response.data.data);
                setError(null);
            } else {
                setError('Failed to fetch survey details');
            }
        } catch (err) {
            console.error('Error fetching survey details:', err);
            setError('Error loading survey details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleBack = () => navigate('/booth-survey');

    // Get user's access scope information
    const getUserAccessScope = () => {
        if (!userHierarchy) {
            return { level: 'All', description: 'आपको सभी बूथ सर्वेक्षण डेटा तक पहुँच है' };
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            return { level: 'All', description: 'You have access to all booth survey data' };
        }

        const levelNames = {
            state: 'State',
            division: 'Division',
            parliament: 'Parliament',
            assembly: 'Assembly',
            block: 'Block',
            booth: 'Booth'
        };

        const levelName = levelNames[highestLevel] || highestLevel;
        const entityName = userHierarchy[highestLevel]?.name || 'Unknown';

        return {
            level: levelName,
            entity: entityName,
            description: `${entityName} ${levelName} और उसके अंतर्गत सभी क्षेत्रों के बूथ सर्वेक्षण डेटा तक आपको पहुँच है`
        };
    };

    const accessScope = getUserAccessScope();

    // Question labels and option mappings (Hindi)
    const questionLabels = {
        q3: 'लिंग',
        q4: 'आयु समूह',
        q5: 'निवास',
        q6: 'शिक्षा',
        q7: 'व्यवसाय',
        q8: 'आर्थिक स्थिति',
        q9: 'परंपरागत पार्टी',
        q10: 'पिछली चुनाव में वही पार्टी?',
        q11: 'जीवन से संतोष',
        q12: 'भविष्य के बारे में चिंता',
        q13: 'प्रश्न 13',
        q14: 'प्रश्न 14',
        q15: 'प्रश्न 15',
        q16: 'पिछले 5 वर्षों में सरकारी नौकरी?',
        q17: 'परिवार ने वोट खोया?',
        q18: 'सुधार हुआ?',
        q19: 'वर्तमान विधायक से संतुष्ट?',
        q20: 'फिर से विधायक चुनेंगे?',
        q21: 'राज्य सरकार से संतुष्ट?',
        q22: 'प्रधानमंत्री से संतुष्ट?',
        q23: 'केंद्रीय सरकार से संतुष्ट?',
        q24: 'मुख्यमंत्री से संतुष्ट?',
        q25: 'जीवन में सुधार की धारणा',
        q26: 'प्रश्न 26',
        q27: 'प्रश्न 27',
        q28: 'प्रश्न 28',
        q29: 'प्रश्न 29',
        q30: 'प्रश्न 30',
        q31: 'अगले विधायक चयन प्राथमिकता',
        q32: 'अगली सरकार की प्राथमिकता',
        q33: 'कौन सा सामाजिक समूह',
        q34: 'पिछले विधानसभा वोट (2020)',
        q35: 'पिछले लोकसभा वोट (2024)',
        q36: 'यदि आज चुनाव होते तो'
    };

    const optionMaps = {
        q3: { male: 'पुरुष', female: 'महिला', other: 'अन्य' },
        q4: { '18-23': '18-23', '24-30': '24-30', '31-35': '31-35', '36-45': '36-45', '46-60': '46-60', '60+': '60+' },
        q5: { rural: 'ग्रामीण', kuragi: 'कृषि', urban: 'शहरी' },
        q6: { illiterate: 'अशिक्षित', literate: 'अशिक्षित नहीं', primary: 'प्राइमरी', '10pass': 'दसवीं पास', '12pass': 'बारहवीं पास', graduate: 'स्नातक/स्नातकोत्तर' },
        q7: { govt_job: 'सरकारी नौकरी', private_job: 'प्राइवेट नौकरी', other_govt: 'अन्य सरकारी नौकरी', farm_own: 'अपनी जमीन पर खेती', farm_rent: 'किराए की जमीन पर खेती', contractor: 'ठेकेदारी', shopkeeper: 'दुकानदार', teacher: 'शिक्षक', student: 'छात्र', selfhelp: 'स्व सहायता समूह', housewife: 'गृहिणी', vendor: 'रेहड़ी-ठेड़ा', construction: 'भवन निर्माण मज़दूर', daily_wage: 'साधारण दिहाड़ी मज़दूर', agri_wage: 'कृषि दिहाड़ी मज़दूर', unemployed: 'बेरोज़गार', hotel_small: 'होटल/दुकानदार/छोटा व्यवसाय', other: 'अन्य' },
        q8: { affluent: 'संपन्न', middle: 'मध्यम वर्ग', poor: 'गरीब', bpl: 'बीपीएल (BPL)' },
        q9: { no_party: 'नहीं - किसी पार्टी से नहीं', bjp: 'हां - भाजपा', rjd: 'हां - राजद', jd_u: 'हां - जदयू', congress: 'हां - कांग्रेस', ljp: 'हां - लोजपा', janasuraj: 'हां - जन सुराज', cpi: 'हां - CPI', cpi_m: 'हां - CPI(M)', other: 'हां - अन्य पार्टी' },
        q10: { yes: 'हां', no: 'नहीं' },
        q11: { satisfied: 'संतोष', some: 'थोड़ा संतोष / थोड़ा असंतोष', dissatisfied: 'असंतोष', dontknow: 'कह नहीं सकते' },
        q12: { satisfied: 'संतोष', some: 'थोड़ा संतोष / थोड़ा असंतोष', dissatisfied: 'असंतोष', dontknow: 'कह नहीं सकते' },
        q16: { yes: 'हां', no: 'नहीं' },
        q17: { yes: 'हां', no: 'नहीं' },
        q18: { yes: 'हां', some: 'हां - कुछ हद तक', nochange: 'कोई परिवर्तन नहीं', worse: 'पहले से खराब' },
        q19: { yes: 'हां', no: 'नहीं' },
        q20: { yes: 'हां', no: 'नहीं' },
        q21: { yes: 'हां', no: 'नहीं' },
        q22: { yes: 'हां', no: 'नहीं' },
        q23: { yes: 'हां', no: 'नहीं' },
        q24: { yes: 'हां', no: 'नहीं' },
        q25: { yes: 'हां', some: 'हां - कुछ हद तक', nochange: 'कोई परिवर्तन नहीं', worse: 'पहले से खराब' },
        q31: { party: 'पार्टी', cm: 'मुख्यमंत्री', candidate: 'उम्मीदवार', public_opinion: 'समाज की राय', dontknow: 'कह नहीं सकते' },
        q32: { unemployment: 'बेरोजगारी', inflation: 'महंगाई कम करना', migration: 'पलायन रोकना', agriculture: 'कृषि का विकास', education: 'शिक्षा व्यवस्था', health: 'स्वास्थ्य व्यवस्था', law: 'कानून व्यवस्था', social: 'सभी वर्गों का सामाजिक समान', dontknow: 'नहीं जानते' }
    };

    const getAnswerText = (question, value) => {
        if (!value) return 'N/A';
        const map = optionMaps[question];
        return map && map[value] ? map[value] : value;
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <LinearProgress />
                <Box sx={{ mt: 2 }}>
                    <Typography>सर्वेक्षण विवरण लोड हो रहे हैं...</Typography>
                </Box>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>सर्वेक्षणों पर वापस जाएं</Button>
            </Container>
        );
    }

    if (!survey) {
        return (
            <Container maxWidth="lg" sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>सर्वेक्षण नहीं मिला</Alert>
                <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>सर्वेक्षणों पर वापस जाएं</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton onClick={handleBack} sx={{ color: theme.palette.primary.main }}>
                        <ArrowBack />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h4" component="h1">सर्वेक्षण विवरण</Typography>
                        <Typography variant="body2" color="text.secondary">{formatDateTime(survey.created_at)}</Typography>
                    </Box>
                </Stack>
                <Breadcrumbs aria-label="breadcrumb">
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>डैशबोर्ड</Link>
                    <Link underline="hover" color="inherit" href="#" onClick={(e) => { e.preventDefault(); navigate('/booth-survey'); }}>बूथ सर्वेक्षण</Link>
                    <Typography color="text.primary">सर्वेक्षण {survey._id}</Typography>
                </Breadcrumbs>
            </Box>

            {/* Access Scope Information */}
            <Alert
                severity="info"
                sx={{ mb: 3 }}
            >
                <Typography variant="body2">
                    <strong>डेटा पहुँच:</strong> {accessScope.description}
                </Typography>
            </Alert>

            <MainCard>
                <Box sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', p: 2, borderRadius: '8px 8px 0 0' }}>
                    <Grid container alignItems="center">
                        <Grid item xs>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>सर्वेक्षण {survey._id || ''}</Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>{survey.respondent_name ? survey.respondent_name : 'बूथ सर्वेक्षण'}</Typography>
                        </Grid>
                        <Grid item>
                            <Stack direction="row" spacing={1}>
                                {survey.contact_number && (
                                    <Button variant="outlined" color="inherit" startIcon={<Phone />} href={`tel:${survey.contact_number}`}>कॉल करें</Button>
                                )}
                                {survey.latitude && survey.longitude && (
                                    <Button variant="outlined" color="inherit" startIcon={<Room />} onClick={() => window.open(`https://www.google.com/maps?q=${survey.latitude},${survey.longitude}`, '_blank')}>मानचित्र खोलें</Button>
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>सर्वेक्षण प्रश्न और उत्तर</Typography>
                                <Stack spacing={1.5}>
                                    {/* Basic Info */}
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">बूथ:</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.booth_id?.name || 'N/A'} {survey.booth_id?.booth_number ? `(${survey.booth_id.booth_number})` : ''}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">सर्वेक्षण तिथि:</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.survey_date ? formatDate(survey.survey_date) : 'N/A'}</Typography>
                                    </Box>
                                    {survey.respondent_name && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">उत्तरदाता का नाम:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.respondent_name}</Typography>
                                        </Box>
                                    )}
                                    {survey.respondent_mobile && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">उत्तरदाता का मोबाइल:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.respondent_mobile}</Typography>
                                        </Box>
                                    )}

                                    {/* Questions - display in two responsive columns */}
                                    <Grid container spacing={1.5} sx={{ mt: 1 }}>
                                        {Object.keys(questionLabels).map((q) => (
                                            survey[q] ? (
                                                <Grid item xs={12} sm={6} key={q}>
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">{questionLabels[q]}:</Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{getAnswerText(q, survey[q])}</Typography>
                                                    </Box>
                                                </Grid>
                                            ) : null
                                        ))}
                                    </Grid>

                                    {/* Location Info */}
                                    {survey.state_id && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">राज्य:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.state_id.name}</Typography>
                                        </Box>
                                    )}
                                    {survey.division_id && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">मंडल:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.division_id.name}</Typography>
                                        </Box>
                                    )}
                                    {survey.parliament_id && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">संसद:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.parliament_id.name}</Typography>
                                        </Box>
                                    )}
                                    {survey.assembly_id && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">विधानसभा:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.assembly_id.name}</Typography>
                                        </Box>
                                    )}
                                    {survey.block_id && (
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">ब्लॉक:</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>{survey.block_id.name}</Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">मेटाडेटा और क्रियाएँ</Typography>
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2">निर्माण: {formatDateTime(survey.created_at)}</Typography>
                                    <Typography variant="body2">अद्यतन: {formatDateTime(survey.updated_at)}</Typography>
                                    <Typography variant="body2">निर्माता: {survey.created_by?.username || survey.created_by?.name || 'N/A'}</Typography>
                                    <Typography variant="body2">अद्यतनकर्ता: {survey.updated_by?.username || survey.updated_by?.name || 'N/A'}</Typography>
                                    {survey.contact_number && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>संपर्क: {survey.contact_number}</Typography>
                                    )}
                                    {survey.latitude && survey.longitude && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>निर्देशांक: {survey.latitude}, {survey.longitude}</Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper' }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>टिप्पणी</Typography>
                                <Box sx={{ mt: 1 }}>
                                    {survey.remark || survey.note || survey.description ? (
                                        <Typography variant="body1">{survey.remark || survey.note || survey.description}</Typography>
                                    ) : (
                                        <Typography variant="body1" color="text.secondary">कोई टिप्पणी नहीं दी गई।</Typography>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </CardContent>
            </MainCard>
        </Container>
    );
};

export default BoothSurveyDetailPage;
