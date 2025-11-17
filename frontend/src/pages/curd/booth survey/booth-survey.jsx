import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Stack, Box, Typography, Divider, Chip, Avatar, Alert,
  TextField, MenuItem
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash, User, CalendarTick, DocumentDownload, MessageText1 } from 'iconsax-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from 'contexts/PermissionContext';

// third-party
import {
  getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
  useReactTable, flexRender
} from '@tanstack/react-table';

// project imports
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';

// custom views and modals
import BoothSurveyModal from 'pages/curd/booth survey/SurveyModal';
import AlertBoothSurveyDelete from 'pages/curd/booth survey/AlertSurveyDelete';
import BoothSurveyView from 'pages/curd/booth survey/SurveyView';
import { Tooltip } from '@mui/material';

export default function BoothSurveyListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { userHierarchy, getUserHighestLevel, canAccessLevel } = usePermissions();
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [surveyDeleteId, setSurveyDeleteId] = useState('');
  const [surveys, setSurveys] = useState([]);
  const [booths, setBooths] = useState([]);
  const [users, setUsers] = useState([]);
  const [states, setStates] = useState([]);

  // Import states
  const csvLinkRef = useRef();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const importInputRef = useRef();
  const [divisions, setDivisions] = useState([]);
  const [parliaments, setParliaments] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    state_id: '',
    division_id: '',
    parliament_id: '',
    assembly_id: '',
    block_id: '',
    booth_id: ''
  });

  const statusColors = {
    'Pending': 'default',
    'In Progress': 'info',
    'Completed': 'primary',
    'Verified': 'success',
    'Rejected': 'error'
  };

  // Get user's access scope information
  const getUserAccessScope = () => {
    if (!userHierarchy) {
      return { level: 'All', description: 'आपको सभी बूथ सर्वेक्षण डेटा तक पहुँच है' };
    }

    const highestLevel = getUserHighestLevel();
    if (!highestLevel) {
      return { level: 'All', description: 'आपको सभी बूथ सर्वेक्षण डेटा तक पहुँच है' };
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

  const fetchSurveys = async (pageIndex, pageSize, filterParams = filters) => {
    setLoading(true);
    setError('');
    try {
      let isSearching = !!filterParams.search || !!filterParams.globalFilter;
      let url;
      let baseUrl = `${import.meta.env.VITE_APP_API_URL}/booth-surveys`;
      let params = [];

      // Apply hierarchy-based filtering
      if (userHierarchy) {
        const highestLevel = getUserHighestLevel();
        if (highestLevel) {
          const entityId = userHierarchy[highestLevel]?._id || userHierarchy[highestLevel];
          if (entityId) {
            params.push(`${highestLevel}_id=${entityId}`);
          }
        }
      }

      // Apply user-selected filters
      if (filterParams.state_id) params.push(`state_id=${filterParams.state_id}`);
      if (filterParams.division_id) params.push(`division=${filterParams.division_id}`);
      if (filterParams.parliament_id) params.push(`parliament_id=${filterParams.parliament_id}`);
      if (filterParams.assembly_id) params.push(`assembly_id=${filterParams.assembly_id}`);
      if (filterParams.block_id) params.push(`block_id=${filterParams.block_id}`);
      if (filterParams.booth_id) params.push(`booth_id=${filterParams.booth_id}`);
      // If searching, fetch all matching data (ignore pagination)
      if (filterParams.search || (typeof filterParams.globalFilter === 'string' && filterParams.globalFilter.trim() !== '')) {
        let searchVal = filterParams.search || filterParams.globalFilter;
        params.push(`search=${encodeURIComponent(searchVal)}`);
        url = `${baseUrl}?page=1&limit=10000${params.length ? '&' + params.join('&') : ''}`;
      } else {
        url = `${baseUrl}?page=${pageIndex + 1}&limit=${pageSize}${params.length ? '&' + params.join('&') : ''}`;
      }
      const token = localStorage.getItem('serviceToken');
      const res = await fetch(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      const json = await res.json();
      if (json.success) {
        setSurveys(json.data);
        setPageCount((filterParams.search || (typeof filterParams.globalFilter === 'string' && filterParams.globalFilter.trim() !== '')) ? 1 : json.pages);
      } else {
        setError('Failed to fetch booth surveys');
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
      setError('Failed to fetch booth surveys');
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const token = localStorage.getItem('serviceToken');
      const fetchOpts = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
      const [boothsRes, usersRes, statesRes, divisionsRes, parliamentsRes, assembliesRes, blocksRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_APP_API_URL}/booths`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/users`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/states`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`, fetchOpts),
        fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`, fetchOpts)
      ]);

      const boothsJson = await boothsRes.json();
      const usersJson = await usersRes.json();
      const statesJson = await statesRes.json();
      const divisionsJson = await divisionsRes.json();
      const parliamentsJson = await parliamentsRes.json();
      const assembliesJson = await assembliesRes.json();
      const blocksJson = await blocksRes.json();

      if (boothsJson.success) setBooths(boothsJson.data);
      if (usersJson.success) setUsers(usersJson.data);
      if (statesJson.success) setStates(statesJson.data);
      if (divisionsJson.success) setDivisions(divisionsJson.data);
      if (parliamentsJson.success) setParliaments(parliamentsJson.data);
      if (assembliesJson.success) setAssemblies(assembliesJson.data);
      if (blocksJson.success) setBlocks(blocksJson.data);
    } catch (error) {
      console.error('Failed to fetch reference data:', error);
    }
  };

  useEffect(() => {
    fetchSurveys(pagination.pageIndex, pagination.pageSize);
    fetchReferenceData();
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDeleteOpen = (id) => {
    setSurveyDeleteId(id);
    setOpenDelete(true);
  };

  const handleDeleteClose = () => setOpenDelete(false);

  const handleDownloadExcelTemplate = async () => {
    const XLSX = await import('xlsx');
    const headers = ['survey_date', 'total_voters', 'surveyed_count', 'favorable_count', 'unfavorable_count', 'neutral_count', 'remark', 'state', 'division_code', 'parliament_no', 'assembly_no', 'block', 'booth_number'];
    const exampleData = [['2024-01-15', '1000', '500', '250', '150', '100', 'Good response', 'Maharashtra', 'DIV001', 'PC01', 'AC001', 'Block A', 'B001']];
    const worksheetData = [headers, ...exampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Booth Survey');
    XLSX.writeFile(workbook, 'booth_survey_template.xlsx');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const normalizedData = jsonData.map((row) => {
        const normalized = {};
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
          normalized[normalizedKey] = row[key];
        });
        return normalized;
      });
      const filteredRows = normalizedData.filter((r) => r.survey_date);
      const token = localStorage.getItem('serviceToken');
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/api/booth-surveys/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: JSON.stringify({ rows: filteredRows })
      });
      const result = await response.json();
      if (response.ok) {
        setImportResult({ success: true, imported: result.imported || 0, total: result.total || 0, errors: result.errors || [] });
        fetchSurveys(pagination.pageIndex, pagination.pageSize);
      } else {
        setImportResult({ success: false, message: result.message || 'Import failed' });
      }
    } catch (error) {
      setImportResult({ success: false, message: error.message || 'Import failed' });
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleCSVDownload = () => {
    if (surveys.length === 0) return;

    const headers = [
      'सर्वेक्षण ID',
      'बूथ',
      'सर्वेक्षण तिथि',
      'उत्तरदाता का नाम',
      'उत्तरदाता मोबाइल',
      // questions q3..q36 will be included here
      'लिंग', 'आयु समूह', 'निवास', 'शिक्षा', 'व्यवसाय', 'आर्थिक स्थिति', 'परंपरागत पार्टी', 'पिछली चुनाव में वही पार्टी?', 'जीवन से संतोष', 'भविष्य के बारे में चिंता',
      'Q13', 'Q14', 'Q15', 'पिछले 5 वर्षों में सरकारी नौकरी?', 'परिवार ने वोट खोया?', 'सुधार हुआ?', 'वर्तमान विधायक से संतुष्ट?', 'फिर से विधायक चुनेंगे?', 'राज्य सरकार से संतुष्ट?', 'प्रधानमंत्री से संतुष्ट?', 'केंद्रीय सरकार से संतुष्ट?', 'मुख्यमंत्री से संतुष्ट?', 'जीवन में सुधार की धारणा',
      'Q26', 'Q27', 'Q28', 'Q29', 'Q30', 'अगले विधायक चयन प्राथमिकता', 'अगली सरकार की प्राथमिकता', 'कौन सा सामाजिक समूह', 'पिछले विधानसभा वोट (2020)', 'पिछले लोकसभा वोट (2024)', 'यदि आज चुनाव होते तो',
      'टिप्पणी',
      'राज्य',
      'मंडल',
      'संसद',
      'विधानसभा',
      'ब्लॉक',
      'निर्माता',
      'अद्यतनकर्ता',
      'निर्माण तिथि',
      'अद्यतन तिथि'
    ];

    const mapOpt = (options, val) => {
      if (!val) return '';
      const found = options.find(o => o._id === val || o.name === val);
      return found ? found.name : val;
    };

    // define same option lists (minimal) to map values
    const q3Options = [{ _id: 'male', name: 'पुरुष' }, { _id: 'female', name: 'महिला' }, { _id: 'other', name: 'अन्य' }];
    const q4Options = [{ _id: '18-23', name: '18-23' }, { _id: '24-30', name: '24-30' }, { _id: '31-35', name: '31-35' }, { _id: '36-45', name: '36-45' }, { _id: '46-60', name: '46-60' }, { _id: '60+', name: '60+' }];
    const q5Options = [{ _id: 'rural', name: 'ग्रामीण' }, { _id: 'kuragi', name: 'कृषि' }, { _id: 'urban', name: 'शहरी' }];
    const q6Options = [{ _id: 'illiterate', name: 'अशिक्षित' }, { _id: 'literate', name: 'अशिक्षित नहीं' }, { _id: 'primary', name: 'प्राइमरी' }, { _id: '10pass', name: 'दसवीं पास' }, { _id: '12pass', name: 'बारहवीं पास' }, { _id: 'graduate', name: 'स्नातक/स्नातकोत्तर' }];
    const q7Options = [{ _id: 'govt_job', name: 'सरकारी नौकरी' }, { _id: 'private_job', name: 'प्राइवेट नौकरी' }, { _id: 'other_govt', name: 'अन्य सरकारी नौकरी' }, { _id: 'farm_own', name: 'अपनी जमीन पर खेती' }, { _id: 'farm_rent', name: 'किराए की जमीन पर खेती' }, { _id: 'contractor', name: 'ठेकेदारी' }, { _id: 'shopkeeper', name: 'दुकानदार' }, { _id: 'teacher', name: 'शिक्षक' }, { _id: 'student', name: 'छात्र' }, { _id: 'selfhelp', name: 'स्व सहायता समूह' }, { _id: 'housewife', name: 'गृहिणी' }, { _id: 'vendor', name: 'रेहड़ी-ठेड़ा' }, { _id: 'construction', name: 'भवन निर्माण मज़दूर' }, { _id: 'daily_wage', name: 'साधारण दिहाड़ी मज़दूर' }, { _id: 'agri_wage', name: 'कृषि दिहाड़ी मज़दूर' }, { _id: 'unemployed', name: 'बेरोज़गार' }, { _id: 'hotel_small', name: 'होटल/दुकानदार/छोटा व्यवसाय' }, { _id: 'other', name: 'अन्य' }];
    const q8Options = [{ _id: 'affluent', name: 'संपन्न' }, { _id: 'middle', name: 'मध्यम वर्ग' }, { _id: 'poor', name: 'गरीब' }, { _id: 'bpl', name: 'बीपीएल (BPL)' }];
    const q9Options = [{ _id: 'no_party', name: 'नहीं - किसी पार्टी से नहीं' }, { _id: 'bjp', name: 'हां - भाजपा' }, { _id: 'rjd', name: 'हां - राजद' }, { _id: 'jd_u', name: 'हां - जदयू' }, { _id: 'congress', name: 'हां - कांग्रेस' }, { _id: 'ljp', name: 'हां - लोजपा' }, { _id: 'janasuraj', name: 'हां - जन सुराज' }, { _id: 'cpi', name: 'हां - CPI' }, { _id: 'cpi_m', name: 'हां - CPI(M)' }, { _id: 'other', name: 'हां - अन्य पार्टी' }];

    const csvData = surveys.map(survey => [
      survey._id?.slice(-8) || '',
      survey.booth_id?.name || 'No booth',
      survey.survey_date ? new Date(survey.survey_date).toLocaleDateString() : '',
      survey.respondent_name || '',
      survey.respondent_mobile || '',
      // questions q3..q36 mapped
      mapOpt(q3Options, survey.q3),
      mapOpt(q4Options, survey.q4),
      mapOpt(q5Options, survey.q5),
      mapOpt(q6Options, survey.q6),
      mapOpt(q7Options, survey.q7),
      mapOpt(q8Options, survey.q8),
      mapOpt(q9Options, survey.q9),
      survey.q10 || '',
      survey.q11 || '',
      survey.q12 || '',
      survey.q13 || '',
      survey.q14 || '',
      survey.q15 || '',
      survey.q16 || '',
      survey.q17 || '',
      survey.q18 || '',
      survey.q19 || '',
      survey.q20 || '',
      survey.q21 || '',
      survey.q22 || '',
      survey.q23 || '',
      survey.q24 || '',
      survey.q25 || '',
      survey.q26 || '',
      survey.q27 || '',
      survey.q28 || '',
      survey.q29 || '',
      survey.q30 || '',
      survey.q31 || '',
      survey.q32 || '',
      survey.q33 || '',
      survey.q34 || '',
      survey.q35 || '',
      survey.q36 || '',
      survey.remark || '',
      survey.state_id?.name || '',
      survey.division_id?.name || '',
      survey.parliament_id?.name || '',
      survey.assembly_id?.name || '',
      survey.block_id?.name || '',
      survey.created_by?.username || '',
      survey.updated_by?.username || '',
      survey.created_at ? new Date(survey.created_at).toLocaleString() : '',
      survey.updated_at ? new Date(survey.updated_at).toLocaleString() : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `booth-surveys-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const columns = useMemo(() => [
    {
      header: '#',
      accessorKey: '_id',
      cell: ({ row }) => <Typography variant="body2" color="text.secondary">{row.index + 1}</Typography>
    },
    // {
    //   header: 'Survey ID',
    //   accessorKey: '_id',
    //   cell: ({ getValue }) => (
    //     <Typography variant="body2" fontWeight="medium" color="primary.main">
    //       {getValue()?.slice(-8)}
    //     </Typography>
    //   )
    // },
    {
      header: 'Booth',
      accessorKey: 'booth_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Box>
            <Typography variant="body2" fontWeight="medium">{getValue().name}</Typography>
            <Typography variant="caption" color="text.secondary">Booth: {getValue().booth_number}</Typography>
          </Box> :
          <Typography variant="caption" color="text.secondary">No booth assigned</Typography>
      )
    },
    {
      header: 'Respondent',
      accessorKey: 'respondent_name',
      cell: ({ getValue, row }) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">{getValue() || 'Unknown'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.original.respondent_mobile || ''}</Typography>
        </Box>
      )
    },
    {
      header: 'Survey Date',
      accessorKey: 'survey_date',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CalendarTick size={14} />
          <Typography variant="body2">{new Date(getValue()).toLocaleDateString()}</Typography>
        </Stack>
      )
    },
    {
      header: 'Gender (Q3)',
      accessorKey: 'q3',
      cell: ({ getValue }) => {
        const genderMap = {
          'male': 'पुरुष',
          'female': 'महिला',
          'other': 'अन्य'
        };
        const value = getValue();
        return (
          <Typography variant="body2">
            {genderMap[value] || value || 'N/A'}
          </Typography>
        );
      }
    },
    {
      header: 'Age Group (Q4)',
      accessorKey: 'q4',
      cell: ({ getValue }) => (
        <Typography variant="body2">{getValue() || 'N/A'}</Typography>
      )
    },
    {
      header: 'Area Type (Q5)',
      accessorKey: 'q5',
      cell: ({ getValue }) => {
        const areaMap = {
          'rural': 'ग्रामीण',
          'kuragi': 'कृषि',
          'urban': 'शहरी'
        };
        const value = getValue();
        return (
          <Typography variant="body2">
            {areaMap[value] || value || 'N/A'}
          </Typography>
        );
      }
    },
    {
      header: 'Education (Q6)',
      accessorKey: 'q6',
      cell: ({ getValue }) => {
        const educationMap = {
          'illiterate': 'अशिक्षित',
          'literate': 'अशिक्षित नहीं',
          'primary': 'प्राइमरी',
          '10pass': 'दसवीं पास',
          '12pass': 'बारहवीं पास',
          'graduate': 'स्नातक/स्नातकोत्तर'
        };
        const value = getValue();
        return (
          <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {educationMap[value] || value || 'N/A'}
          </Typography>
        );
      }
    },
    {
      header: 'Party Affiliation (Q9)',
      accessorKey: 'q9',
      cell: ({ getValue }) => {
        const partyMap = {
          'no_party': 'नहीं',
          'bjp': 'भाजपा',
          'rjd': 'राजद',
          'jd_u': 'जदयू',
          'congress': 'कांग्रेस',
          'ljp': 'लोजपा',
          'janasuraj': 'जन सुराज',
          'cpi': 'CPI',
          'cpi_m': 'CPI(M)',
          'other': 'अन्य'
        };
        const value = getValue();
        return (
          <Chip
            label={partyMap[value] || value || 'N/A'}
            size="small"
            variant="outlined"
            color={value === 'no_party' ? 'default' : 'primary'}
          />
        );
      }
    },
    {
      header: 'Remark',
      accessorKey: 'remark',
      cell: ({ getValue }) => {
        const remark = getValue();
        return (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {remark || 'No remark'}
          </Typography>
        );
      }
    },
    // Poll Result removed
    {
      header: 'State',
      accessorKey: 'state_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="secondary" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No state</Typography>
      )
    },
    {
      header: 'Division',
      accessorKey: 'division_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="info" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No division</Typography>
      )
    },
    {
      header: 'Parliament',
      accessorKey: 'parliament_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="warning" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No parliament</Typography>
      )
    },
    {
      header: 'Assembly',
      accessorKey: 'assembly_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="success" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No assembly</Typography>
      )
    },
    {
      header: 'Block',
      accessorKey: 'block_id',
      cell: ({ getValue }) => (
        getValue() ?
          <Chip label={getValue().name} color="error" size="small" variant="outlined" /> :
          <Typography variant="caption" color="text.secondary">No block</Typography>
      )
    },
    {
      header: 'Occupation (Q7)',
      accessorKey: 'q7',
      cell: ({ getValue }) => {
        const occupationMap = {
          'govt_job': 'सरकारी नौकरी',
          'private_job': 'प्राइवेट नौकरी',
          'farm_own': 'अपनी खेती',
          'farm_rent': 'किराए की खेती',
          'contractor': 'ठेकेदारी',
          'shopkeeper': 'दुकानदार',
          'teacher': 'शिक्षक',
          'student': 'छात्र',
          'housewife': 'गृहिणी',
          'unemployed': 'बेरोज़गार',
          'other': 'अन्य'
        };
        const value = getValue();
        return (
          <Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {occupationMap[value] || value || 'N/A'}
          </Typography>
        );
      }
    },
    {
      header: 'Economic Status (Q8)',
      accessorKey: 'q8',
      cell: ({ getValue }) => {
        const statusMap = {
          'affluent': 'संपन्न',
          'middle': 'मध्यम वर्ग',
          'poor': 'गरीब',
          'bpl': 'बीपीएल'
        };
        const value = getValue();
        const getStatusColor = (status) => {
          switch (status) {
            case 'affluent': return 'success';
            case 'middle': return 'info';
            case 'poor': return 'warning';
            case 'bpl': return 'error';
            default: return 'default';
          }
        };
        return (
          <Chip
            label={statusMap[value] || value || 'N/A'}
            size="small"
            variant="outlined"
            color={getStatusColor(value)}
          />
        );
      }
    },
    {
      header: 'Voting Likelihood (Q10)',
      accessorKey: 'q10',
      cell: ({ getValue }) => {
        const value = getValue();
        const yesNoMap = { 'yes': 'हां', 'no': 'नहीं' };
        return (
          <Chip
            label={yesNoMap[value] || value || 'N/A'}
            size="small"
            variant="outlined"
            color={value === 'yes' ? 'success' : value === 'no' ? 'error' : 'default'}
          />
        );
      }
    },
    {
      header: 'Priority Issue (Q16)',
      accessorKey: 'q16',
      cell: ({ getValue }) => {
        const priorityMap = {
          'unemployment': 'बेरोजगारी',
          'inflation': 'महंगाई',
          'migration': 'पलायन',
          'agriculture': 'कृषि',
          'education': 'शिक्षा',
          'health': 'स्वास्थ्य',
          'law': 'कानून व्यवस्था',
          'social': 'सामाजिक समान',
          'dontknow': 'नहीं जानते'
        };
        const value = getValue();
        return (
          <Typography variant="body2" sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {priorityMap[value] || value || 'N/A'}
          </Typography>
        );
      }
    },
    {
      header: 'Gov Satisfaction (Q11)',
      accessorKey: 'q11',
      cell: ({ getValue }) => {
        const satisfactionMap = {
          'satisfied': 'संतोष',
          'some': 'थोड़ा संतोष',
          'dissatisfied': 'असंतोष',
          'dontknow': 'कह नहीं सकते'
        };
        const value = getValue();
        const getColor = (val) => {
          switch (val) {
            case 'satisfied': return 'success';
            case 'some': return 'warning';
            case 'dissatisfied': return 'error';
            default: return 'default';
          }
        };
        return (
          <Chip
            label={satisfactionMap[value] || value || 'N/A'}
            size="small"
            variant="outlined"
            color={getColor(value)}
          />
        );
      }
    },
    {
      header: 'Free Text (Q33)',
      accessorKey: 'q33',
      cell: ({ getValue }) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {getValue() || 'N/A'}
        </Typography>
      )
    },
    {
      header: 'Free Text (Q34)',
      accessorKey: 'q34',
      cell: ({ getValue }) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 150,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {getValue() || 'N/A'}
        </Typography>
      )
    },
    {
      header: 'Current MLA Satisfied (Q19)',
      accessorKey: 'q19',
      cell: ({ getValue }) => {
        const value = getValue();
        const satisfactionMap = {
          'satisfied': 'संतोष',
          'some': 'थोड़ा संतोष',
          'dissatisfied': 'असंतोष',
          'dontknow': 'कह नहीं सकते'
        };
        const getColor = (val) => {
          switch (val) {
            case 'satisfied': return 'success';
            case 'some': return 'warning';
            case 'dissatisfied': return 'error';
            default: return 'default';
          }
        };
        return (
          <Chip
            label={satisfactionMap[value] || value || 'N/A'}
            size="small"
            variant="outlined"
            color={getColor(value)}
          />
        );
      }
    },
    {
      header: 'Next Election Vote (Q36)',
      accessorKey: 'q36',
      cell: ({ getValue }) => (
        <Typography
          variant="body2"
          sx={{
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {getValue() || 'N/A'}
        </Typography>
      )
    },
    {
      header: 'Created By',
      accessorKey: 'created_by',
      cell: ({ getValue }) => {
        const createdBy = getValue();
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <User size={14} />
            <Typography variant="caption">{createdBy?.username || 'Unknown'}</Typography>
          </Stack>
        );
      }
    },
    {
      header: 'Updated By',
      accessorKey: 'updated_by',
      cell: ({ getValue }) => {
        const updatedBy = getValue();
        return (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <User size={14} />
            <Typography variant="caption">{updatedBy?.username || 'Unknown'}</Typography>
          </Stack>
        );
      }
    },
    {
      header: 'Created At',
      accessorKey: 'created_at',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CalendarTick size={14} />
          <Typography variant="caption">{formatDateTime(getValue())}</Typography>
        </Stack>
      )
    },
    {
      header: 'Updated At',
      accessorKey: 'updated_at',
      cell: ({ getValue }) => (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <CalendarTick size={14} />
          <Typography variant="caption">{formatDateTime(getValue())}</Typography>
        </Stack>
      )
    },
    {
      header: 'Actions',
      meta: { className: 'cell-center' },
      cell: ({ row }) => {
        const isExpanded = row.getIsExpanded();
        const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
        return (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <Tooltip title="View Details">
              <IconButton
                color="secondary"
                onClick={() => navigate(`/Booth-Survey/${row.original._id}`)}
              >
                <Eye />
              </IconButton>
            </Tooltip>
            <Tooltip title="Expand Row">

            </Tooltip>
            <Tooltip title="Edit Survey">
              <IconButton
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSurvey(row.original);
                  setOpenModal(true);
                }}
              >
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Survey">
              <IconButton
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteOpen(row.original._id);
                }}
              >
                <Trash />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      }
    }
  ], [theme]);

  const table = useReactTable({
    data: surveys,
    columns,
    state: {
      pagination
    },
    pageCount,
    manualPagination: true,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowCanExpand: () => true
  });

  if (loading) return <EmptyReactTable />;

  return (
    <>
      <MainCard content={false}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* Access Scope Information */}
        <Alert
          severity="info"
          sx={{ m: 2 }}
        >
          <Typography variant="body2">
            <strong>डेटा पहुँच:</strong> {accessScope.description}
          </Typography>
        </Alert>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          sx={{ p: 2, gap: 2 }}
        >

          <DebouncedInput
            value={table.getState().globalFilter || ''}
            onFilterChange={(value) => table.setGlobalFilter(String(value))}
            placeholder={`खोजें ${surveys.length} बूथ सर्वेक्षण...`}
            sx={{ width: { xs: '100%', sm: 250 } }}
          />
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <Button
              variant="outlined"
              startIcon={<DocumentDownload />}
              onClick={handleCSVDownload}
              disabled={surveys.length === 0}
              size="small"
            >
              सभी सर्वेक्षण CSV डाउनलोड करें

            </Button>
            <Button variant="outlined" onClick={handleDownloadExcelTemplate} size="small">
              Excel Template डाउनलोड करें
            </Button>
            <Button variant="outlined" onClick={() => importInputRef.current?.click()} disabled={importing} size="small">
              {importing ? 'Import हो रहा है...' : 'Excel Import करें'}
            </Button>
            <Button variant="contained"
              startIcon={<Add />}
              onClick={() => { setSelectedSurvey(null); setOpenModal(true); }}
              size="small">
              सर्वेक्षण जोड़ें
            </Button>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ p: 2, flexWrap: 'wrap', gap: 2 }}
        >
          <TextField
            select
            label="State"
            value={filters.state_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                state_id: e.target.value,
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
          >
            <MenuItem value="">All States</MenuItem>
            {states.map((state) => (
              <MenuItem key={state._id} value={state._id}>
                {state.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Division"
            value={filters.division_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                division_id: e.target.value,
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.state_id}
          >
            <MenuItem value="">All Divisions</MenuItem>
            {divisions
              .filter(division => !filters.state_id || division.state_id?._id === filters.state_id)
              .map((division) => (
                <MenuItem key={division._id} value={division._id}>
                  {division.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Parliament"
            value={filters.parliament_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                parliament_id: e.target.value,
                assembly_id: '',
                block_id: '',
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.division_id}
          >
            <MenuItem value="">All Parliaments</MenuItem>
            {parliaments
              .filter(parliament => !filters.division_id || parliament.division_id?._id === filters.division_id)
              .map((parliament) => (
                <MenuItem key={parliament._id} value={parliament._id}>
                  {parliament.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Assembly"
            value={filters.assembly_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                assembly_id: e.target.value,
                block_id: '',
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.parliament_id}
          >
            <MenuItem value="">All Assemblies</MenuItem>
            {assemblies
              .filter(assembly => !filters.parliament_id || assembly.parliament_id?._id === filters.parliament_id)
              .map((assembly) => (
                <MenuItem key={assembly._id} value={assembly._id}>
                  {assembly.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Block"
            value={filters.block_id}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                block_id: e.target.value,
                booth_id: ''
              }));
            }}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.assembly_id}
          >
            <MenuItem value="">All Blocks</MenuItem>
            {blocks
              .filter(block => !filters.assembly_id || block.assembly_id?._id === filters.assembly_id)
              .map((block) => (
                <MenuItem key={block._id} value={block._id}>
                  {block.name}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Booth"
            value={filters.booth_id}
            onChange={(e) => setFilters(prev => ({ ...prev, booth_id: e.target.value }))}
            sx={{ minWidth: 150 }}
            size="small"
            disabled={!filters.block_id}
          >
            <MenuItem value="">All Booths</MenuItem>
            {booths
              .filter(booth => !filters.block_id || booth.block_id?._id === filters.block_id)
              .map((booth) => (
                <MenuItem key={booth._id} value={booth._id}>
                  {booth.name}
                </MenuItem>
              ))}
          </TextField>

          <Button
            variant="contained"
            onClick={() => fetchSurveys(pagination.pageIndex, pagination.pageSize, filters)}
            size="small"
          >
            लागू करें
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setFilters({
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
              });
              fetchSurveys(pagination.pageIndex, pagination.pageSize, {
                state_id: '',
                division_id: '',
                parliament_id: '',
                assembly_id: '',
                block_id: '',
                booth_id: ''
              });
            }}
            size="small"
          >
            साफ़ करें
          </Button>
        </Stack>

        <ScrollX>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableCell
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        sx={{
                          cursor: header.column.getCanSort() ? 'pointer' : 'default',
                          color: 'white',
                          fontWeight: 'bold',
                          backgroundColor: 'primary.main'
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
                          {header.column.getCanSort() && <HeaderSort column={header.column} />}
                        </Stack>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <Fragment key={row.id}>
                    <TableRow>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={row.getVisibleCells().length}>
                          <BoothSurveyView data={row.original} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <Box sx={{ p: 2 }}>
            <TablePagination
              setPageSize={(size) => setPagination((prev) => ({ ...prev, pageSize: size }))}
              setPageIndex={(index) => setPagination((prev) => ({ ...prev, pageIndex: index }))}
              getState={table.getState}
              getPageCount={() => pageCount}
            />
          </Box>
        </ScrollX>
      </MainCard>

      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        ref={importInputRef}
        style={{ display: 'none' }}
        onChange={handleImportFile}
      />

      {importResult && (
        <Alert
          severity={importResult.success ? 'success' : 'error'}
          onClose={() => setImportResult(null)}
          sx={{ m: 2 }}
        >
          {importResult.success ? (
            <>
              Successfully imported {importResult.imported} out of {importResult.total} records.
              {importResult.errors && importResult.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" fontWeight="bold">Errors:</Typography>
                  {importResult.errors.slice(0, 5).map((err, idx) => (
                    <Typography key={idx} variant="caption" display="block">
                      Row {err.row}: {err.error}
                    </Typography>
                  ))}
                  {importResult.errors.length > 5 && (
                    <Typography variant="caption" display="block">
                      ... and {importResult.errors.length - 5} more errors
                    </Typography>
                  )}
                </Box>
              )}
            </>
          ) : (
            importResult.message
          )}
        </Alert>
      )}

      <BoothSurveyModal
        open={openModal}
        modalToggler={setOpenModal}
        survey={selectedSurvey}
        booths={booths}
        users={users}
        states={states}
        divisions={divisions}
        parliaments={parliaments}
        assemblies={assemblies}
        blocks={blocks}
        refresh={() => fetchSurveys(pagination.pageIndex, pagination.pageSize)}
      />

      <AlertBoothSurveyDelete
        id={surveyDeleteId}
        open={openDelete}
        handleClose={handleDeleteClose}
        refresh={() => fetchSurveys(pagination.pageIndex, pagination.pageSize)}
      />
    </>
  );
}
