import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, Tooltip
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';
import {
    getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel,
    useReactTable, flexRender
} from '@tanstack/react-table';
import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import IconButton from 'components/@extended/IconButton';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';

import BoothDemographicsModal from './BoothDemographicModal';
import AlertBoothDemographicsDelete from './AlertBoothDemographicDelete';
import BoothDemographicsView from './BoothDemographicView';

export default function BoothDemographicsListPage() {
    const theme = useTheme();

    const [selectedDemographic, setSelectedDemographic] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [deleteId, setDeleteId] = useState('');
    const [demographics, setDemographics] = useState([]);
    const [booths, setBooths] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    const fetchReferenceData = async () => {
        try {
            const [
                boothsRes,
                statesRes,
                divisionsRes,
                parliamentsRes,
                assembliesRes,
                blocksRes
            ] = await Promise.all([
                fetch('http://localhost:5000/api/booths?all=true'),
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/divisions'),
                fetch('http://localhost:5000/api/parliaments'),
                fetch('http://localhost:5000/api/assemblies'),
                fetch('http://localhost:5000/api/blocks')
            ]);

            const [
                boothsData,
                statesData,
                divisionsData,
                parliamentsData,
                assembliesData,
                blocksData
            ] = await Promise.all([
                boothsRes.json(),
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                blocksRes.json()
            ]);

            if (boothsData.success) setBooths(boothsData.data);
            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (blocksData.success) setBlocks(blocksData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchDemographics = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const res = await fetch(`http://localhost:5000/api/booth-demographics?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setDemographics(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch booth demographics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDemographics(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const handleDeleteOpen = (id) => {
        setDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toLocaleString();
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const columns = useMemo(() => [
        {
            header: '#',
            accessorKey: '_id',
            cell: ({ row }) => <Typography>{row.index + 1}</Typography>
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Typography fontWeight="medium">
                    {getValue()?.name || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Booth Number',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.booth_number || 'N/A'}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Electors',
            accessorFn: (row) => ({
                total: row.total_electors,
                male: row.male_electors,
                female: row.female_electors,
                other: row.other_electors
            }),
            cell: ({ getValue }) => {
                const { total, male, female, other } = getValue();
                return (
                    <Tooltip title={`Male: ${male}, Female: ${female}, Other: ${other}`}>
                        <Typography>{formatNumber(total)}</Typography>
                    </Tooltip>
                );
            }
        },
        {
            header: 'Population',
            accessorKey: 'total_population',
            cell: ({ getValue }) => <Typography>{formatNumber(getValue())}</Typography>
        },
        // {
        //     header: 'Age Groups',
        //     accessorFn: (row) => ({
        //         young: row.age_groups?._18_25,
        //         adult: row.age_groups?._26_40,
        //         middle: row.age_groups?._41_60,
        //         senior: row.age_groups?._60_above
        //     }),
        //     cell: ({ getValue }) => {
        //         const { young, adult, middle, senior } = getValue();
        //         return (
        //             <Tooltip title={`18-25: ${young}, 26-40: ${adult}, 41-60: ${middle}, 60+: ${senior}`}>
        //                 <Typography>{formatNumber(young + adult + middle + senior)}</Typography>
        //             </Tooltip>
        //         );
        //     }
        // },
        {
            header: '18-25 Age Group',
            accessorFn: row => row.age_groups?._18_25 || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: '26-40 Age Group',
            accessorFn: row => row.age_groups?._26_40 || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: '41-60 Age Group',
            accessorFn: row => row.age_groups?._41_60 || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: '60+ Age Group',
            accessorFn: row => row.age_groups?._60_above || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        }
        ,
        {
            header: 'SC Population',
            accessorFn: row => row.caste_population?.sc || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: 'ST Population',
            accessorFn: row => row.caste_population?.st || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: 'OBC Population',
            accessorFn: row => row.caste_population?.obc || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: 'General Population',
            accessorFn: row => row.caste_population?.general || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: 'Literate',
            accessorFn: row => row.education?.educated || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: 'Illiterate',
            accessorFn: row => row.education?.illiterate || 0,
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="info"
                    size="small"
                    variant="outlined"
                />
            )
        },
         {
                    header: 'Created By',
                    accessorKey: 'created_by',
                    cell: ({ getValue }) => (
                        <Typography>
                            {getValue()?.username || 'N/A'}
                        </Typography>
                    )
                },
                {
                    header: 'Updated By',
                    accessorKey: 'updated_by',
                    cell: ({ getValue }) => (
                        <Typography>
                            {getValue()?.username || 'N/A'}
                        </Typography>
                    )
                },
        {
            header: 'Created At',
            accessorKey: 'created_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Updated At',
            accessorKey: 'updated_at',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Actions',
            meta: { className: 'cell-center' },
            cell: ({ row }) => {
                const isExpanded = row.getIsExpanded();
                const expandIcon = isExpanded ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} /> : <Eye />;
                return (
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                        <IconButton color="secondary" onClick={row.getToggleExpandedHandler()}>
                            {expandIcon}
                        </IconButton>
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedDemographic(row.original); setOpenModal(true); }}>
                            <Edit />
                        </IconButton>
                        <IconButton color="error" onClick={(e) => { e.stopPropagation(); handleDeleteOpen(row.original._id); }}>
                            <Trash />
                        </IconButton>
                    </Stack>
                );
            }
        }
    ], [theme]);

    const table = useReactTable({
        data: demographics,
        columns,
        state: { pagination, globalFilter },
        pageCount,
        manualPagination: true,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getRowCanExpand: () => true
    });

    const fetchAllDemographicsForCsv = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/booth-demographics?all=true');
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all demographics for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllDemographicsForCsv();
        setCsvData(allData.map(item => ({
            'Booth Name': item.booth_id?.name || '',
            'Booth Number': item.booth_id?.booth_number || '',
            'Total Population': item.total_population,
            'Total Electors': item.total_electors,
            'Male Electors': item.male_electors,
            'Female Electors': item.female_electors,
            'Other Electors': item.other_electors,
            'SC Population': item.caste_population?.sc || 0,
            'ST Population': item.caste_population?.st || 0,
            'OBC Population': item.caste_population?.obc || 0,
            'General Population': item.caste_population?.general || 0,
            '18-25 Age Group': item.age_groups?._18_25 || 0,
            '26-40 Age Group': item.age_groups?._26_40 || 0,
            '41-60 Age Group': item.age_groups?._41_60 || 0,
            '60+ Age Group': item.age_groups?._60_above || 0,
            'Illiterate': item.education?.illiterate || 0,
            'Literate': item.education?.educated || 0,
            'State': item.state_id?.name || '',
            'Assembly': item.assembly_id?.name || '',
            'Created By': item.created_by?.username || '',
            'Updated By': item.updated_by?.username || '',
            'Created At': item.created_at,
            'Updated At': item.updated_at
        })));
        setCsvLoading(false);
        setTimeout(() => {
            if (csvLinkRef.current) {
                csvLinkRef.current.link.click();
            }
        }, 100);
    };

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${demographics.length} demographics records...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="booth_demographics_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedDemographic(null); setOpenModal(true); }}>
                            Add Demographics
                        </Button>
                    </Stack>
                </Stack>

                <ScrollX>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableCell
                                                key={header.id}
                                                onClick={header.column.getToggleSortingHandler()}
                                                sx={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
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
                                                    <BoothDemographicsView data={row.original} />
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

            <BoothDemographicsModal
                open={openModal}
                modalToggler={setOpenModal}
                demographic={selectedDemographic}
                booths={booths}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                blocks={blocks}
                refresh={() => fetchDemographics(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertBoothDemographicsDelete
                id={deleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchDemographics(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}