import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip
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

import VisitModal from './VisitModal';
import AlertVisitsDelete from './AlertVisitDelete';
import VisitView from './VisitView';

export default function VisitsListPage() {
    const theme = useTheme();

    const [selectedVisit, setSelectedVisit] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [visitDeleteId, setVisitDeleteId] = useState('');
    const [visits, setVisits] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [users, setUsers] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes, 
                divisionsRes, 
                parliamentsRes, 
                assembliesRes, 
                districtsRes,
                blocksRes,
                boothsRes
            ] = await Promise.all([
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/divisions'),
                fetch('http://localhost:5000/api/parliaments'),
                fetch('http://localhost:5000/api/assemblies'),
                fetch('http://localhost:5000/api/districts'),
                fetch('http://localhost:5000/api/blocks'),
                fetch('http://localhost:5000/api/booths')
            ]);

            const token = localStorage.getItem('serviceToken');
            const [usersRes] = await Promise.all([
                fetch('http://localhost:5000/api/users', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            ]);

            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            const [
                statesData, 
                divisionsData, 
                parliamentsData, 
                assembliesData, 
                districtsData,
                blocksData,
                boothsData
            ] = await Promise.all([
                statesRes.json(),
                divisionsRes.json(),
                parliamentsRes.json(),
                assembliesRes.json(),
                districtsRes.json(),
                blocksRes.json(),
                boothsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (divisionsData.success) setDivisions(divisionsData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (districtsData.success) setDistricts(districtsData.data);
            if (blocksData.success) setBlocks(blocksData.data);
            if (boothsData.success) setBooths(boothsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchVisits = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const res = await fetch(`http://localhost:5000/api/visits?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setVisits(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch visits:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const handleDeleteOpen = (id) => {
        setVisitDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

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
        // ... your existing imports and setup remain the same

        },
        {
            header: 'Person Name',
            accessorKey: 'person_name',
            cell: ({ getValue }) => <Typography>{getValue()}</Typography>
        },
        {
            header: 'Post',
            accessorKey: 'post'
        },
        {
            header: 'State',
            accessorKey: 'state_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="primary" size="small" variant="outlined" />
            )
        },
        {
            header: 'Division',
            accessorKey: 'division_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="warning" size="small" variant="outlined" />
            )
        },
        {
            header: 'Parliament',
            accessorKey: 'parliament_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="secondary" size="small" variant="outlined" />
            )
        },
        {
            header: 'Assembly',
            accessorKey: 'assembly_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="info" size="small" variant="outlined" />
            )
        },
        {
            header: 'Block',
            accessorKey: 'block_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} size="small" variant="outlined" />
            )
        },
        {
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip label={getValue()?.name || 'N/A'} color="success" size="small" variant="outlined" />
            )
        },
        {
            header: 'Visit Date',
            accessorKey: 'date',
            cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography>
        },
        {
            header: 'Declaration',
            accessorKey: 'declaration',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getValue() || '—'}
                </Typography>
            )
        },
        {
            header: 'Remark',
            accessorKey: 'remark',
            cell: ({ getValue }) => (
                <Typography sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getValue() || '—'}
                </Typography>
            )
        },
        {
            header: 'Created By',
            accessorKey: 'created_by',
            cell: ({ getValue }) => <Typography>{getValue()?.username || 'N/A'}</Typography>
        },
        {
            header: 'Updated By',
            accessorKey: 'updated_by',
            cell: ({ getValue }) => <Typography>{getValue()?.username || '—'}</Typography>
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
            cell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <IconButton onClick={() => row.toggleExpanded()}><Eye /></IconButton>
                    <IconButton color="primary" onClick={() => { setSelectedVisit(row.original); setOpenModal(true); }}><Edit /></IconButton>
                    <IconButton color="error" onClick={() => handleDeleteOpen(row.original._id)}><Trash /></IconButton>
                </Stack>
            )
        }
    ], [theme]);

    const table = useReactTable({
        data: visits,
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

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const fetchAllVisitsForCsv = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/visits?all=true');
            const json = await res.json();
            if (json.success) return json.data;
        } catch (err) {
            console.error('CSV fetch failed:', err);
        }
        return [];
    };

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const all = await fetchAllVisitsForCsv();
        setCsvData(all.map(v => ({
            Name: v.person_name,
            Post: v.post,
            State: v.state_id?.name || '',
            Division: v.division_id?.name || '',
            Parliament: v.parliament_id?.name || '',
            Assembly: v.assembly_id?.name || '',
            Block: v.block_id?.name || '',
            Booth: v.booth_id?.name || '',
            Date: v.date,
            Declaration: v.declaration,
            Remark: v.remark,
            'Created By': v.created_by?.username || '',
            'Updated By': v.updated_by?.username || '',
            'Created At': v.created_at,
            'Updated At': v.updated_at
        })));
        setCsvLoading(false);
        setTimeout(() => csvLinkRef.current?.link?.click(), 200);
    };

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput
                        value={globalFilter}
                        onFilterChange={setGlobalFilter}
                        placeholder={`Search ${visits.length} visits...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="visits_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedVisit(null); setOpenModal(true); }}>
                            Add Visit
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
                                                    <VisitView data={row.original} />
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

            <VisitModal
                open={openModal}
                modalToggler={setOpenModal}
                visit={selectedVisit}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                districts={districts}
                blocks={blocks}
                booths={booths}
                users={users}
                refresh={() => fetchVisits(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertVisitsDelete
                id={visitDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchVisits(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
