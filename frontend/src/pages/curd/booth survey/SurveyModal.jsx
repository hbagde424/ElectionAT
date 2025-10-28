import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    TextField,
    InputLabel,
    Select,
    MenuItem,
    FormControl,
    FormHelperText,
    Alert,
    CircularProgress,
    Grid
} from '@mui/material';
import { useEffect, useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { usePermissions } from 'contexts/PermissionContext';

export default function BoothSurveyModal({
    open,
    modalToggler,
    survey,
    booths,
    users,
    states,
    divisions,
    parliaments,
    assemblies,
    blocks,
    refresh
}) {
    const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
    const [formData, setFormData] = useState({
        booth_id: '',
        survey_date: new Date(),
        // New respondent fields
        respondent_name: '',
        respondent_mobile: '',
        // Q3-Q36 fields
        q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: '', q11: '', q12: '',
        q13: '', q14: '', q15: '', q16: '', q17: '', q18: '', q19: '', q20: '', q21: '', q22: '',
        q23: '', q24: '', q25: '', q26: '', q27: '', q28: '', q29: '', q30: '', q31: '', q32: '',
        q33: '', q34: '', q35: '', q36: '',
        remark: '',
        state_id: '',
        division_id: '',
        parliament_id: '',
        assembly_id: '',
        block_id: ''
    });

    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtered data based on hierarchy
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    // Filtered data based on user hierarchy permissions
    const [hierarchyFilteredStates, setHierarchyFilteredStates] = useState([]);
    const [hierarchyFilteredDivisions, setHierarchyFilteredDivisions] = useState([]);
    const [hierarchyFilteredParliaments, setHierarchyFilteredParliaments] = useState([]);
    const [hierarchyFilteredAssemblies, setHierarchyFilteredAssemblies] = useState([]);
    const [hierarchyFilteredBlocks, setHierarchyFilteredBlocks] = useState([]);
    const [hierarchyFilteredBooths, setHierarchyFilteredBooths] = useState([]);

    // Status options
    const statusOptions = ['Pending', 'In Progress', 'Completed', 'Verified', 'Rejected'];

    // Question option lists
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

    // Filter available options based on user hierarchy
    useEffect(() => {
        if (!userHierarchy) {
            // No restrictions - show all options
            setHierarchyFilteredStates(states);
            setHierarchyFilteredDivisions(divisions);
            setHierarchyFilteredParliaments(parliaments);
            setHierarchyFilteredAssemblies(assemblies);
            setHierarchyFilteredBlocks(blocks);
            setHierarchyFilteredBooths(booths);
            return;
        }

        const highestLevel = getUserHighestLevel();
        if (!highestLevel) {
            // No restrictions - show all options
            setHierarchyFilteredStates(states);
            setHierarchyFilteredDivisions(divisions);
            setHierarchyFilteredParliaments(parliaments);
            setHierarchyFilteredAssemblies(assemblies);
            setHierarchyFilteredBlocks(blocks);
            setHierarchyFilteredBooths(booths);
            return;
        }

        const userEntityId = userHierarchy[highestLevel]?._id || userHierarchy[highestLevel];
        if (!userEntityId) {
            // No restrictions - show all options
            setHierarchyFilteredStates(states);
            setHierarchyFilteredDivisions(divisions);
            setHierarchyFilteredParliaments(parliaments);
            setHierarchyFilteredAssemblies(assemblies);
            setHierarchyFilteredBlocks(blocks);
            setHierarchyFilteredBooths(booths);
            return;
        }

        // Filter based on user's hierarchy level
        switch (highestLevel) {
            case 'state':
                setHierarchyFilteredStates(states.filter(s => s._id === userEntityId));
                setHierarchyFilteredDivisions(divisions.filter(d => d.state_id?._id === userEntityId));
                setHierarchyFilteredParliaments(parliaments.filter(p => p.state_id?._id === userEntityId));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a.state_id?._id === userEntityId));
                setHierarchyFilteredBlocks(blocks.filter(b => b.state_id?._id === userEntityId));
                setHierarchyFilteredBooths(booths.filter(b => b.state_id?._id === userEntityId));
                break;
            case 'division':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state?._id || s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userEntityId));
                setHierarchyFilteredParliaments(parliaments.filter(p => p.division_id?._id === userEntityId));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a.division_id?._id === userEntityId));
                setHierarchyFilteredBlocks(blocks.filter(b => b.division_id?._id === userEntityId));
                setHierarchyFilteredBooths(booths.filter(b => b.division_id?._id === userEntityId));
                break;
            case 'parliament':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state?._id || s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division?._id || d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userEntityId));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a.parliament_id?._id === userEntityId));
                setHierarchyFilteredBlocks(blocks.filter(b => b.parliament_id?._id === userEntityId));
                setHierarchyFilteredBooths(booths.filter(b => b.parliament_id?._id === userEntityId));
                break;
            case 'assembly':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state?._id || s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division?._id || d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament?._id || p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userEntityId));
                setHierarchyFilteredBlocks(blocks.filter(b => b.assembly_id?._id === userEntityId));
                setHierarchyFilteredBooths(booths.filter(b => b.assembly_id?._id === userEntityId));
                break;
            case 'block':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state?._id || s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division?._id || d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament?._id || p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userHierarchy.assembly?._id || a._id === userHierarchy.assembly));
                setHierarchyFilteredBlocks(blocks.filter(b => b._id === userEntityId));
                setHierarchyFilteredBooths(booths.filter(b => b.block_id?._id === userEntityId));
                break;
            case 'booth':
                setHierarchyFilteredStates(states.filter(s => s._id === userHierarchy.state?._id || s._id === userHierarchy.state));
                setHierarchyFilteredDivisions(divisions.filter(d => d._id === userHierarchy.division?._id || d._id === userHierarchy.division));
                setHierarchyFilteredParliaments(parliaments.filter(p => p._id === userHierarchy.parliament?._id || p._id === userHierarchy.parliament));
                setHierarchyFilteredAssemblies(assemblies.filter(a => a._id === userHierarchy.assembly?._id || a._id === userHierarchy.assembly));
                setHierarchyFilteredBlocks(blocks.filter(b => b._id === userHierarchy.block?._id || b._id === userHierarchy.block));
                setHierarchyFilteredBooths(booths.filter(b => b._id === userEntityId));
                break;
            default:
                setHierarchyFilteredStates(states);
                setHierarchyFilteredDivisions(divisions);
                setHierarchyFilteredParliaments(parliaments);
                setHierarchyFilteredAssemblies(assemblies);
                setHierarchyFilteredBlocks(blocks);
                setHierarchyFilteredBooths(booths);
        }
    }, [userHierarchy, states, divisions, parliaments, assemblies, blocks, booths]);

    useEffect(() => {
        if (survey) {
            setFormData({
                booth_id: survey.booth_id?._id || '',
                survey_date: new Date(survey.survey_date) || new Date(),
                respondent_name: survey.respondent_name || '',
                respondent_mobile: survey.respondent_mobile || '',
                q3: survey.q3 || '', q4: survey.q4 || '', q5: survey.q5 || '', q6: survey.q6 || '',
                q7: survey.q7 || '', q8: survey.q8 || '', q9: survey.q9 || '', q10: survey.q10 || '',
                q11: survey.q11 || '', q12: survey.q12 || '', q13: survey.q13 || '', q14: survey.q14 || '',
                q15: survey.q15 || '', q16: survey.q16 || '', q17: survey.q17 || '', q18: survey.q18 || '',
                q19: survey.q19 || '', q20: survey.q20 || '', q21: survey.q21 || '', q22: survey.q22 || '',
                q23: survey.q23 || '', q24: survey.q24 || '', q25: survey.q25 || '', q26: survey.q26 || '',
                q27: survey.q27 || '', q28: survey.q28 || '', q29: survey.q29 || '', q30: survey.q30 || '',
                q31: survey.q31 || '', q32: survey.q32 || '', q33: survey.q33 || '', q34: survey.q34 || '',
                q35: survey.q35 || '', q36: survey.q36 || '',
                remark: survey.remark || '',
                state_id: survey.state_id?._id || '',
                division_id: survey.division_id?._id || '',
                parliament_id: survey.parliament_id?._id || '',
                assembly_id: survey.assembly_id?._id || '',
                block_id: survey.block_id?._id || ''
            });
        } else {
            setFormData({
                booth_id: '',
                survey_date: new Date(),
                respondent_name: '',
                respondent_mobile: '',
                q3: '', q4: '', q5: '', q6: '', q7: '', q8: '', q9: '', q10: '', q11: '', q12: '',
                q13: '', q14: '', q15: '', q16: '', q17: '', q18: '', q19: '', q20: '', q21: '', q22: '',
                q23: '', q24: '', q25: '', q26: '', q27: '', q28: '', q29: '', q30: '', q31: '', q32: '',
                q33: '', q34: '', q35: '', q36: '',
                remark: '',
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: ''
            });
        }
        setErrors({});
        setSubmitError('');
    }, [survey, open]);

    // Filter divisions by state
    useEffect(() => {
        if (formData.state_id) {
            const filtered = hierarchyFilteredDivisions.filter(div => div.state_id?._id === formData.state_id);
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions([]);
            setFormData(prev => ({
                ...prev,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.state_id, hierarchyFilteredDivisions]);

    // Filter parliaments by division
    useEffect(() => {
        if (formData.division_id) {
            const filtered = hierarchyFilteredParliaments.filter(par => par.division_id?._id === formData.division_id);
            setFilteredParliaments(filtered);
        } else {
            setFilteredParliaments([]);
            setFormData(prev => ({
                ...prev,
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.division_id, hierarchyFilteredParliaments]);

    // Filter assemblies by parliament
    useEffect(() => {
        if (formData.parliament_id) {
            const filtered = hierarchyFilteredAssemblies.filter(asm => asm.parliament_id?._id === formData.parliament_id);
            setFilteredAssemblies(filtered);
        } else {
            setFilteredAssemblies([]);
            setFormData(prev => ({
                ...prev,
                assembly_id: '',
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.parliament_id, hierarchyFilteredAssemblies]);

    // Filter blocks by assembly
    useEffect(() => {
        if (formData.assembly_id) {
            const filtered = hierarchyFilteredBlocks.filter(blk => blk.assembly_id?._id === formData.assembly_id);
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks([]);
            setFormData(prev => ({
                ...prev,
                block_id: '',
                booth_id: ''
            }));
        }
    }, [formData.assembly_id, hierarchyFilteredBlocks]);

    // Filter booths by block
    useEffect(() => {
        if (formData.block_id) {
            const filtered = hierarchyFilteredBooths.filter(booth => booth.block_id?._id === formData.block_id);
            setFilteredBooths(filtered);
        } else {
            setFilteredBooths([]);
            setFormData(prev => ({
                ...prev,
                booth_id: ''
            }));
        }
    }, [formData.block_id, hierarchyFilteredBooths]);

    // Validate individual field
    const validateField = (name, value) => {
        switch (name) {
            case 'booth_id':
                if (!value) return 'Booth selection is required';
                break;
            // surveyor removed
            case 'state_id':
                if (!value) return 'State selection is required';
                break;
            case 'division_id':
                if (!value) return 'Division selection is required';
                break;
            case 'parliament_id':
                if (!value) return 'Parliament selection is required';
                break;
            case 'assembly_id':
                if (!value) return 'Assembly selection is required';
                break;
            case 'block_id':
                if (!value) return 'Block selection is required';
                break;
            // status removed
            case 'respondent_name':
                if (value && value.length > 200) return 'Respondent name cannot exceed 200 characters';
                break;
            case 'respondent_mobile':
                if (value && value.length > 20) return 'Respondent mobile cannot exceed 20 characters';
                break;
            case 'remark':
                if (value && value.trim().length > 500) return 'Remarks cannot exceed 500 characters';
                break;
            case 'poll_result':
                if (value && value.trim().length > 200) return 'Poll result cannot exceed 200 characters';
                break;
            default:
                break;
        }
        return '';
    };

    // Validate entire form
    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ['booth_id', 'state_id', 'division_id', 'parliament_id', 'assembly_id', 'block_id'];

        requiredFields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        // Validate optional fields
        ['remark', 'respondent_name', 'respondent_mobile'].forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) newErrors[field] = error;
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (submitError) setSubmitError('');

        setFormData(prev => {
            // Handle cascading resets
            if (name === 'state_id') {
                return {
                    ...prev,
                    [name]: value,
                    division_id: '',
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'division_id') {
                return {
                    ...prev,
                    [name]: value,
                    parliament_id: '',
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'parliament_id') {
                return {
                    ...prev,
                    [name]: value,
                    assembly_id: '',
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'assembly_id') {
                return {
                    ...prev,
                    [name]: value,
                    block_id: '',
                    booth_id: ''
                };
            }
            if (name === 'block_id') {
                return {
                    ...prev,
                    [name]: value,
                    booth_id: ''
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, survey_date: date }));
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const method = survey ? 'PUT' : 'POST';
            const token = localStorage.getItem('serviceToken');
            const url = survey
                ? `${import.meta.env.VITE_APP_API_URL}/booth-surveys/${survey._id}`
                : `${import.meta.env.VITE_APP_API_URL}/booth-surveys`;

            const payload = {
                ...formData,
                survey_date: formData.survey_date.toISOString()
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                modalToggler(false);
                refresh();
            } else {
                // Handle server-side validation errors
                if (data.errors) {
                    const serverErrors = {};
                    Object.keys(data.errors).forEach(key => {
                        serverErrors[key] = data.errors[key].message;
                    });
                    setErrors(serverErrors);
                } else if (data.message) {
                    setSubmitError(data.message);
                } else {
                    setSubmitError('An error occurred while saving the survey');
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderSelect = (label, name, options, labelKey = 'name', required = false, disabled = false) => (
        <Grid item xs={12} sm={6} key={name}>
            <Stack spacing={1}>
                <InputLabel required={required} sx={{ whiteSpace: 'normal' }}>{label}</InputLabel>
                <FormControl fullWidth error={!!errors[name]} disabled={disabled || isSubmitting}>
                    <Select name={name} value={formData[name]} onChange={handleChange}>
                        <MenuItem value="">
                            <em>कृपया चुनें {label}</em>
                        </MenuItem>
                        {options.map((opt) => (
                            <MenuItem key={opt._id} value={opt._id}>
                                {opt[labelKey] || 'Unknown'}{opt.booth_number ? ` (${opt.booth_number})` : ''}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors[name] && <FormHelperText>{errors[name]}</FormHelperText>}
                </FormControl>
            </Stack>
        </Grid>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Dialog open={open} onClose={() => modalToggler(false)} fullWidth maxWidth="md">
                <DialogTitle>{survey ? 'Edit Booth Survey' : 'Add Booth Survey'}</DialogTitle>
                <DialogContent>
                    {submitError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {submitError}
                        </Alert>
                    )}

                    <Stack spacing={2} mt={2}>
                        {/* Hierarchy Dropdowns */}
                        <Grid container spacing={2}>
                            {renderSelect('State', 'state_id', hierarchyFilteredStates, 'name', true)}
                            {renderSelect('Division', 'division_id', filteredDivisions, 'name', true, !formData.state_id)}
                        </Grid>

                        <Grid container spacing={2}>
                            {renderSelect('Parliament', 'parliament_id', filteredParliaments, 'name', true, !formData.division_id)}
                            {renderSelect('Assembly', 'assembly_id', filteredAssemblies, 'name', true, !formData.parliament_id)}
                        </Grid>

                        <Grid container spacing={2}>
                            {renderSelect('Block', 'block_id', filteredBlocks, 'name', true, !formData.assembly_id)}
                            {renderSelect('Booth', 'booth_id', filteredBooths, 'name', true, !formData.block_id)}
                        </Grid>

                        {/* Survey Details */}
                        <Grid container spacing={2}>
                            {/* Surveyor removed - replaced with respondent fields */}
                            <Grid item xs={12} sm={6}>
                                <Stack spacing={1}>
                                    <InputLabel required sx={{ whiteSpace: 'normal' }}>सर्वेक्षण तिथि</InputLabel>
                                    <DatePicker
                                        value={formData.survey_date}
                                        onChange={handleDateChange}
                                        disabled={isSubmitting}
                                        renderInput={(params) => <TextField fullWidth {...params} />}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                        {/* Respondent fields: name + mobile */}
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Stack spacing={1}>
                                    <InputLabel sx={{ whiteSpace: 'normal' }}>उत्तरदाता का नाम</InputLabel>
                                    <TextField
                                        name="respondent_name"
                                        value={formData.respondent_name}
                                        onChange={handleChange}
                                        fullWidth
                                        error={!!errors.respondent_name}
                                        helperText={errors.respondent_name}
                                        disabled={isSubmitting}
                                    />
                                </Stack>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Stack spacing={1}>
                                    <InputLabel sx={{ whiteSpace: 'normal' }}>उत्तरदाता का मोबाइल</InputLabel>
                                    <TextField
                                        name="respondent_mobile"
                                        value={formData.respondent_mobile}
                                        onChange={handleChange}
                                        fullWidth
                                        error={!!errors.respondent_mobile}
                                        helperText={errors.respondent_mobile}
                                        disabled={isSubmitting}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>

                        {/* Questions 3-12 (dropdowns) */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('लिंग', 'q3', q3Options, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('आयु समूह', 'q4', q4Options, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('निवास', 'q5', q5Options, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('शिक्षा', 'q6', q6Options, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('व्यवसाय', 'q7', q7Options, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('आर्थिक स्थिति', 'q8', q8Options, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('परंपरागत पार्टी', 'q9', q9Options, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('पिछली चुनाव में वही पार्टी?', 'q10', yesNoOptions, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('जीवन से संतोष', 'q11', opinionOptions, 'name')}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {renderSelect('भविष्य के बारे में चिंता', 'q12', opinionOptions, 'name')}
                            </Grid>
                        </Grid>

                        {/* Questions 17-25 (dropdowns) */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या किसी परिवार के सदस्य को पिछले 5 वर्षों में सरकारी नौकरी मिली?', 'q16', yesNoOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या किसी परिवार के सदस्य ने वोट खो दिया?', 'q17', yesNoOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या पिछले 5 वर्षों में सुधार हुआ?', 'q18', improvementOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या वर्तमान विधायक से संतुष्ट हैं?', 'q19', yesNoOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या आप फिर से वर्तमान विधायक को चुनेंगे?', 'q20', yesNoOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या आप राज्य सरकार से संतुष्ट हैं?', 'q21', yesNoOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या आप प्रधानमंत्री से संतुष्ट हैं?', 'q22', yesNoOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या आप केंद्रीय सरकार से संतुष्ट हैं?', 'q23', yesNoOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या आप वर्तमान मुख्यमंत्री से संतुष्ट हैं?', 'q24', yesNoOptions)}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('क्या आपको लगता है चुनाव के बाद जीवन सुधरेगा?', 'q25', improvementOptions)}</Grid>
                        </Grid>

                        {/* Questions 31-32 (dropdowns) */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>{renderSelect('अगले विधायक को चुनने में सबसे महत्वपूर्ण क्या है?', 'q31', [{ _id: 'party', name: 'पार्टी' }, { _id: 'cm', name: 'मुख्यमंत्री' }, { _id: 'candidate', name: 'उम्मीदवार' }, { _id: 'public_opinion', name: 'समाज की राय' }, { _id: 'dontknow', name: 'कह नहीं सकते' }])}</Grid>
                            <Grid item xs={12} sm={6}>{renderSelect('अगली सरकार की शीर्ष प्राथमिकता क्या होनी चाहिए?', 'q32', priorityOptions)}</Grid>
                        </Grid>

                        {/* Questions 33-36 (free text answers) */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Stack spacing={1}>
                                    <InputLabel sx={{ whiteSpace: 'normal' }}>कौन सा सामाजिक समूह?</InputLabel>
                                    <TextField name="q33" value={formData.q33} onChange={handleChange} fullWidth />
                                </Stack>
                            </Grid>
                            <Grid item xs={12}>
                                <Stack spacing={1}>
                                    <InputLabel sx={{ whiteSpace: 'normal' }}>पिछले विधानसभा चुनाव में आपने किसे वोट दिया? (2020)</InputLabel>
                                    <TextField name="q34" value={formData.q34} onChange={handleChange} fullWidth />
                                </Stack>
                            </Grid>
                            <Grid item xs={12}>
                                <Stack spacing={1}>
                                    <InputLabel sx={{ whiteSpace: 'normal' }}>पिछले लोकसभा चुनाव में आपने किसे वोट दिया? (2024)</InputLabel>
                                    <TextField name="q35" value={formData.q35} onChange={handleChange} fullWidth />
                                </Stack>
                            </Grid>
                            <Grid item xs={12}>
                                <Stack spacing={1}>
                                    <InputLabel sx={{ whiteSpace: 'normal' }}>यदि चुनाव आज होते, आप किस पार्टी को वोट देते?</InputLabel>
                                    <TextField name="q36" value={formData.q36} onChange={handleChange} fullWidth />
                                </Stack>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Stack spacing={1}>
                                    <InputLabel sx={{ whiteSpace: 'normal' }}>टिप्पणी</InputLabel>
                                    <TextField
                                        name="remark"
                                        value={formData.remark}
                                        onChange={handleChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                        error={!!errors.remark}
                                        helperText={errors.remark || 'Maximum 500 characters'}
                                        inputProps={{ maxLength: 500 }}
                                        disabled={isSubmitting}
                                    />
                                </Stack>
                            </Grid>
                        </Grid>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => modalToggler(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                    >
                        {isSubmitting ? 'Saving...' : (survey ? 'Update' : 'Submit')}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}
