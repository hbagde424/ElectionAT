import { Stack, Typography, Divider, Chip, Avatar, Grid, Box, Paper } from '@mui/material';
import { User, CalendarTick, MessageText1, Award, Buildings2, Location } from 'iconsax-react';

export default function BoothSurveyView({ data }) {
    if (!data) return null;

    const statusColors = {
        'Pending': 'default',
        'In Progress': 'info',
        'Completed': 'primary',
        'Verified': 'success',
        'Rejected': 'error'
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Question option lists (same as modal) to map stored values to display names
    const q3Options = [
        { _id: 'male', name: 'पुरुष' },
        { _id: 'female', name: 'महिला' },
        { _id: 'other', name: 'अन्य' }
    ];
    const q4Options = [
        { _id: '18-23', name: '18-23' },
        { _id: '24-30', name: '24-30' },
        { _id: '31-35', name: '31-35' },
        { _id: '36-45', name: '36-45' },
        { _id: '46-60', name: '46-60' },
        { _id: '60+', name: '60+' }
    ];
    const q5Options = [
        { _id: 'rural', name: 'ग्रामीण' },
        { _id: 'kuragi', name: 'कृषि' },
        { _id: 'urban', name: 'शहरी' }
    ];
    const q6Options = [
        { _id: 'illiterate', name: 'अशिक्षित' },
        { _id: 'literate', name: 'अशिक्षित नहीं' },
        { _id: 'primary', name: 'प्राइमरी' },
        { _id: '10pass', name: 'दसवीं पास' },
        { _id: '12pass', name: 'बारहवीं पास' },
        { _id: 'graduate', name: 'स्नातक/स्नातकोत्तर' }
    ];
    const q7Options = [
        { _id: 'govt_job', name: 'सरकारी नौकरी' },
        { _id: 'private_job', name: 'प्राइवेट नौकरी' },
        { _id: 'other_govt', name: 'अन्य सरकारी नौकरी' },
        { _id: 'farm_own', name: 'अपनी जमीन पर खेती' },
        { _id: 'farm_rent', name: 'किराए की जमीन पर खेती' },
        { _id: 'contractor', name: 'ठेकेदारी' },
        { _id: 'shopkeeper', name: 'दुकानदार' },
        { _id: 'teacher', name: 'शिक्षक' },
        { _id: 'student', name: 'छात्र' },
        { _id: 'selfhelp', name: 'स्व सहायता समूह' },
        { _id: 'housewife', name: 'गृहिणी' },
        { _id: 'vendor', name: 'रेहड़ी-ठेड़ा' },
        { _id: 'construction', name: 'भवन निर्माण मज़दूर' },
        { _id: 'daily_wage', name: 'साधारण दिहाड़ी मज़दूर' },
        { _id: 'agri_wage', name: 'कृषि दिहाड़ी मज़दूर' },
        { _id: 'unemployed', name: 'बेरोज़गार' },
        { _id: 'hotel_small', name: 'होटल/दुकानदार/छोटा व्यवसाय' },
        { _id: 'other', name: 'अन्य' }
    ];
    const q8Options = [
        { _id: 'affluent', name: 'संपन्न' },
        { _id: 'middle', name: 'मध्यम वर्ग' },
        { _id: 'poor', name: 'गरीब' },
        { _id: 'bpl', name: 'बीपीएल (BPL)' }
    ];
    const q9Options = [
        { _id: 'no_party', name: 'नहीं - किसी पार्टी से नहीं' },
        { _id: 'bjp', name: 'हां - भाजपा' },
        { _id: 'rjd', name: 'हां - राजद' },
        { _id: 'jd_u', name: 'हां - जदयू' },
        { _id: 'congress', name: 'हां - कांग्रेस' },
        { _id: 'ljp', name: 'हां - लोजपा' },
        { _id: 'janasuraj', name: 'हां - जन सुराज' },
        { _id: 'cpi', name: 'हां - CPI' },
        { _id: 'cpi_m', name: 'हां - CPI(M)' },
        { _id: 'other', name: 'हां - अन्य पार्टी' }
    ];
    const yesNoOptions = [
        { _id: 'yes', name: 'हां' },
        { _id: 'no', name: 'नहीं' }
    ];
    const opinionOptions = [
        { _id: 'satisfied', name: 'संतोष' },
        { _id: 'some', name: 'थोड़ा संतोष / थोड़ा असंतोष' },
        { _id: 'dissatisfied', name: 'असंतोष' },
        { _id: 'dontknow', name: 'कह नहीं सकते' }
    ];
    const improvementOptions = [
        { _id: 'yes', name: 'हां' },
        { _id: 'some', name: 'हां - कुछ हद तक' },
        { _id: 'nochange', name: 'कोई परिवर्तन नहीं' },
        { _id: 'worse', name: 'पहले से खराब' }
    ];
    const priorityOptions = [
        { _id: 'unemployment', name: 'बेरोजगारी' },
        { _id: 'inflation', name: 'महंगाई कम करना' },
        { _id: 'migration', name: 'पलायन रोकना' },
        { _id: 'agriculture', name: 'कृषि का विकास' },
        { _id: 'education', name: 'शिक्षा व्यवस्था' },
        { _id: 'health', name: 'स्वास्थ्य व्यवस्था' },
        { _id: 'law', name: 'कानून व्यवस्था' },
        { _id: 'social', name: 'सभी वर्गों का सामाजिक समान' },
        { _id: 'dontknow', name: 'नहीं जानते' }
    ];

    const mapOption = (options, val) => {
        if (!val) return 'N/A';
        const found = options.find(o => o._id === val || o.name === val);
        return found ? found.name : val;
    };

    // Create hierarchy breadcrumb
    const hierarchy = [
        { label: 'State', data: data.state_id, color: 'secondary' },
        { label: 'Division', data: data.division_id, color: 'info' },
        { label: 'Parliament', data: data.parliament_id, color: 'warning' },
        { label: 'Assembly', data: data.assembly_id, color: 'success' },
        { label: 'Block', data: data.block_id, color: 'error' },
        { label: 'Booth', data: data.booth_id, color: 'primary' }
    ].filter(item => item.data);

    return (
        <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                    <Buildings2 size={32} />
                </Avatar>
                <Box>
                    <Typography variant="h6">बूथ सर्वेक्षण - {data._id?.slice(-8)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {data.booth_id?.name || 'No Booth'} • {data.state_id?.name || 'No State'}
                    </Typography>
                </Box>
                {/* Status removed - show respondent info instead */}
                <Box sx={{ ml: 'auto' }}>
                    <Typography variant="body2">उत्तरदाता: {data.respondent_name || 'N/A'}</Typography>
                    <Typography variant="caption" color="text.secondary">{data.respondent_mobile || ''}</Typography>
                </Box>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Hierarchy Breadcrumb */}
            {hierarchy.length > 0 && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                        <Location size={16} />
                        <Typography variant="subtitle2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>प्रशासनिक पदानुक्रम</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        {hierarchy.map((item, index) => (
                            <Stack key={item.label} direction="row" alignItems="center" spacing={0.5}>
                                <Chip
                                    label={`${item.label}: ${item.data.name}`}
                                    color={item.color}
                                    size="small"
                                    variant="outlined"
                                />
                                {index < hierarchy.length - 1 && (
                                    <Typography variant="caption" color="text.secondary">→</Typography>
                                )}
                            </Stack>
                        ))}
                    </Stack>
                </Paper>
            )}

            <Grid container spacing={3}>
                {/* Left Column - Survey Information */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">सर्वेक्षण जानकारी</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>बूथ</Typography>
                                {data.booth_id ? (
                                    <Box>
                                        <Typography variant="body1" fontWeight="medium">{data.booth_id.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">Booth: {data.booth_id.booth_number}</Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="caption">No booth assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>उत्तरदाता</Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Avatar sx={{ width: 24, height: 24 }}>
                                        <User size={16} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2">{data.respondent_name || 'Unknown'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{data.respondent_mobile || ''}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>सर्वेक्षण तिथि</Typography>
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                    <CalendarTick size={16} />
                                    <Typography variant="body2">{formatDate(data.survey_date)}</Typography>
                                </Stack>
                            </Grid>
                            {/* Status removed */}
                        </Grid>
                    </Stack>
                </Grid>

                {/* Right Column - Administrative Information */}
                <Grid item xs={12} md={6} lg={6} xl={6} sm={12}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">प्रशासनिक जानकारी</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>राज्य</Typography>
                                {data.state_id ? (
                                    <Chip label={data.state_id.name} color="secondary" size="small" />
                                ) : (
                                    <Typography variant="caption">No state assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>मंडल</Typography>
                                {data.division_id ? (
                                    <Chip label={data.division_id.name} color="info" size="small" />
                                ) : (
                                    <Typography variant="caption">No division assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>संसद</Typography>
                                {data.parliament_id ? (
                                    <Chip label={data.parliament_id.name} color="warning" size="small" />
                                ) : (
                                    <Typography variant="caption">No parliament assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>विधानसभा</Typography>
                                {data.assembly_id ? (
                                    <Chip label={data.assembly_id.name} color="success" size="small" />
                                ) : (
                                    <Typography variant="caption">No assembly assigned</Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>ब्लॉक</Typography>
                                {data.block_id ? (
                                    <Chip label={data.block_id.name} color="error" size="small" />
                                ) : (
                                    <Typography variant="caption">No block assigned</Typography>
                                )}
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Questions Display */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">प्रश्न और उत्तर</Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">लिंग</Typography>
                                    <Typography variant="body2">{mapOption(q3Options, data.q3)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">आयु समूह</Typography>
                                    <Typography variant="body2">{mapOption(q4Options, data.q4)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">निवास</Typography>
                                    <Typography variant="body2">{mapOption(q5Options, data.q5)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">शिक्षा</Typography>
                                    <Typography variant="body2">{mapOption(q6Options, data.q6)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">व्यवसाय</Typography>
                                    <Typography variant="body2">{mapOption(q7Options, data.q7)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">आर्थिक स्थिति</Typography>
                                    <Typography variant="body2">{mapOption(q8Options, data.q8)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">परंपरागत पार्टी</Typography>
                                    <Typography variant="body2">{mapOption(q9Options, data.q9)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">पिछली चुनाव में वही पार्टी?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q10)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">जीवन से संतोष</Typography>
                                    <Typography variant="body2">{mapOption(opinionOptions, data.q11)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">भविष्य के बारे में चिंता</Typography>
                                    <Typography variant="body2">{mapOption(opinionOptions, data.q12)}</Typography>
                                </Grid>
                                {/* q13-q15 are currently undefined option sets; show raw values */}
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">प्रश्न 13</Typography>
                                    <Typography variant="body2">{data.q13 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">प्रश्न 14</Typography>
                                    <Typography variant="body2">{data.q14 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">प्रश्न 15</Typography>
                                    <Typography variant="body2">{data.q15 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या किसी परिवार के सदस्य को पिछले 5 वर्षों में सरकारी नौकरी मिली?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q16)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या किसी परिवार के सदस्य ने वोट खो दिया?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q17)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या पिछले 5 वर्षों में सुधार हुआ?</Typography>
                                    <Typography variant="body2">{mapOption(improvementOptions, data.q18)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या वर्तमान विधायक से संतुष्ट हैं?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q19)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या आप फिर से वर्तमान विधायक को चुनेंगे?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q20)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या आप राज्य सरकार से संतुष्ट हैं?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q21)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या आप प्रधानमंत्री से संतुष्ट हैं?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q22)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या आप केंद्रीय सरकार से संतुष्ट हैं?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q23)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या आप वर्तमान मुख्यमंत्री से संतुष्ट हैं?</Typography>
                                    <Typography variant="body2">{mapOption(yesNoOptions, data.q24)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">क्या आपको लगता है चुनाव के बाद जीवन सुधरेगा?</Typography>
                                    <Typography variant="body2">{mapOption(improvementOptions, data.q25)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">अन्य प्रश्न 26</Typography>
                                    <Typography variant="body2">{data.q26 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">अन्य प्रश्न 27</Typography>
                                    <Typography variant="body2">{data.q27 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">अन्य प्रश्न 28</Typography>
                                    <Typography variant="body2">{data.q28 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">अन्य प्रश्न 29</Typography>
                                    <Typography variant="body2">{data.q29 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">अन्य प्रश्न 30</Typography>
                                    <Typography variant="body2">{data.q30 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">अगले विधायक को चुनने में सबसे महत्वपूर्ण क्या है?</Typography>
                                    <Typography variant="body2">{mapOption([{_id:'party', name:'पार्टी'},{_id:'cm', name:'मुख्यमंत्री'},{_id:'candidate', name:'उम्मीदवार'},{_id:'public_opinion', name:'समाज की राय'},{_id:'dontknow', name:'कह नहीं सकते'}], data.q31)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">अगली सरकार की शीर्ष प्राथमिकता क्या होनी चाहिए?</Typography>
                                    <Typography variant="body2">{mapOption(priorityOptions, data.q32)}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">कौन सा सामाजिक समूह?</Typography>
                                    <Typography variant="body2">{data.q33 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">पिछले विधानसभा चुनाव में आपने किसे वोट दिया? (2020)</Typography>
                                    <Typography variant="body2">{data.q34 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">पिछले लोकसभा चुनाव में आपने किसे वोट दिया? (2024)</Typography>
                                    <Typography variant="body2">{data.q35 || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">यदि चुनाव आज होते, आप किस पार्टी को वोट देते?</Typography>
                                    <Typography variant="body2">{data.q36 || 'N/A'}</Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>

            {/* Survey Results Section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">सर्वेक्षण परिणाम</Typography>

                        {data.poll_result ? (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>मत परिणाम</Typography>
                                <Typography variant="body1" sx={{
                                    p: 2,
                                    bgcolor: 'info.50',
                                    borderRadius: 1,
                                    minHeight: 60,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {data.poll_result}
                                </Typography>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No poll results available</Typography>
                        )}
                    </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                        <Typography variant="h6" color="primary">टिप्पणियाँ</Typography>

                        {data.remark ? (
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'normal' }}>सर्वेक्षण टिप्पणियाँ</Typography>
                                <Typography variant="body1" sx={{
                                    p: 2,
                                    bgcolor: 'grey.50',
                                    borderRadius: 1,
                                    minHeight: 60,
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {data.remark}
                                </Typography>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">कोई टिप्पणी उपलब्ध नहीं</Typography>
                        )}
                    </Stack>
                </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Metadata Section */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <User size={16} />
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>निर्माता</Typography>
                            <Typography variant="body2">{data.created_by?.username || 'Unknown'}</Typography>
                        </Box>
                    </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <User size={16} />
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>अद्यतनकर्ता</Typography>
                            <Typography variant="body2">{data.updated_by?.username || 'N/A'}</Typography>
                        </Box>
                    </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CalendarTick size={16} />
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>निर्माण तिथि</Typography>
                            <Typography variant="body2">{formatDateTime(data.created_at)}</Typography>
                        </Box>
                    </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <CalendarTick size={16} />
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>अद्यतन तिथि</Typography>
                            <Typography variant="body2">{formatDateTime(data.updated_at)}</Typography>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}
