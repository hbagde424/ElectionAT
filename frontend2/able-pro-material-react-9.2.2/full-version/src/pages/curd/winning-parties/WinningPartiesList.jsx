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

import WinningPartyModal from './WinningPartyModal';
import AlertWinningPartyDelete from './AlertWinningPartyDelete';
import WinningPartyView from './WinningPartyView';

export default function WinningPartyListPage() {
    const theme = useTheme();

    const [selectedWinningParty, setSelectedWinningParty] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [winningPartyDeleteId, setWinningPartyDeleteId] = useState('');
    const [winningParties, setWinningParties] = useState([]);
    const [states, setStates] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [parties, setParties] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [years, setYears] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');
    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const fetchReferenceData = async () => {
        try {
            const [
                statesRes,
                assembliesRes,
                parliamentsRes,
                partiesRes,
                candidatesRes,
                yearsRes
            ] = await Promise.all([
                fetch('http://localhost:5000/api/states'),
                fetch('http://localhost:5000/api/assemblies'),
                fetch('http://localhost:5000/api/parliaments'),
                fetch('http://localhost:5000/api/parties'),
                fetch('http://localhost:5000/api/candidates'),
                fetch('http://localhost:5000/api/years')
            ]);

            const [
                statesData,
                assembliesData,
                parliamentsData,
                partiesData,
                candidatesData,
                yearsData
            ] = await Promise.all([
                statesRes.json(),
                assembliesRes.json(),
                parliamentsRes.json(),
                partiesRes.json(),
                candidatesRes.json(),
                yearsRes.json()
            ]);

            if (statesData.success) setStates(statesData.data);
            if (assembliesData.success) setAssemblies(assembliesData.data);
            if (parliamentsData.success) setParliaments(parliamentsData.data);
            if (partiesData.success) setParties(partiesData.data);
            if (candidatesData.success) setCandidates(candidatesData.data);
            if (yearsData.success) setYears(yearsData.data);

        } catch (error) {
            console.error('Failed to fetch reference data:', error);
        }
    };

    const fetchWinningParties = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            const query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            const res = await fetch(`http://localhost:5000/api/winning-parties?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setWinningParties(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch winning parties:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWinningParties(pagination.pageIndex, pagination.pageSize, globalFilter);
        fetchReferenceData();
    }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

    const handleDeleteOpen = (id) => {
        setWinningPartyDeleteId(id);
        setOpenDelete(true);
    };

    const handleDeleteClose = () => setOpenDelete(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    const columns = useMemo(() => [
        { header: '#', accessorKey: '_id', cell: ({ row }) => <Typography>{row.index + 1}</Typography> },
        { header: 'Year', accessorKey: 'year_id', cell: ({ getValue }) => <Chip label={getValue()?.year || 'N/A'} color="primary" size="small" /> },
        { header: 'State', accessorKey: 'state_id', cell: ({ getValue }) => <Typography>{getValue()?.name || 'N/A'}</Typography> },
        { header: 'Assembly', accessorKey: 'assembly_id', cell: ({ getValue }) => <Typography>{getValue()?.name || 'N/A'}</Typography> },
        { header: 'Parliament', accessorKey: 'parliament_id', cell: ({ getValue }) => <Typography>{getValue()?.name || 'N/A'}</Typography> },
        { header: 'Party', accessorKey: 'party_id', cell: ({ getValue }) => <Chip label={getValue()?.name || 'N/A'} color="secondary" size="small" /> },
        { header: 'Candidate', accessorKey: 'candidate_id', cell: ({ getValue }) => <Typography>{getValue()?.name || 'N/A'}</Typography> },
        { header: 'Votes', accessorKey: 'votes', cell: ({ getValue }) => <Typography>{getValue()}</Typography> },
        { header: 'Margin', accessorKey: 'margin', cell: ({ getValue }) => <Typography>{getValue()}</Typography> },
        { header: 'Created At', accessorKey: 'created_at', cell: ({ getValue }) => <Typography>{formatDate(getValue())}</Typography> },
        {
            header: 'Actions',
            cell: ({ row }) => (
                <Stack direction="row" spacing={1}>
                    <IconButton onClick={() => row.toggleExpanded()}><Eye /></IconButton>
                    <IconButton color="primary" onClick={() => { setSelectedWinningParty(row.original); setOpenModal(true); }}><Edit /></IconButton>
                    <IconButton color="error" onClick={() => handleDeleteOpen(row.original._id)}><Trash /></IconButton>
                </Stack>
            )
        }
    ], [theme]);

    const table = useReactTable({
        data: winningParties,
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

    const fetchAllWinningPartiesForCsv = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/winning-parties?all=true');
            const json = await res.json();
            return json.success ? json.data : [];
        } catch (error) {
            console.error('CSV fetch failed:', error);
            return [];
        }
    };

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllWinningPartiesForCsv();
        setCsvData(allData.map(item => ({
            Year: item.year_id?.year,
            State: item.state_id?.name,
            Assembly: item.assembly_id?.name,
            Parliament: item.parliament_id?.name,
            Party: item.party_id?.name,
            Candidate: item.candidate_id?.name,
            Votes: item.votes,
            Margin: item.margin,
            'Created At': item.created_at
        })));
        setCsvLoading(false);
        setTimeout(() => csvLinkRef.current?.link?.click(), 100);
    };

    if (loading) return <EmptyReactTable />;

    return (
        <>
            <MainCard content={false}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ padding: 3 }}>
                    <DebouncedInput value={globalFilter} onFilterChange={setGlobalFilter} placeholder="Search winning parties..." />
                    <Stack direction="row" spacing={1}>
                        <CSVLink data={csvData} filename="winning_parties.csv" style={{ display: 'none' }} ref={csvLinkRef} />
                        <Button onClick={handleDownloadCsv} disabled={csvLoading}>{csvLoading ? 'Preparing...' : 'Download CSV'}</Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedWinningParty(null); setOpenModal(true); }}>Add</Button>
                    </Stack>
                </Stack>
                <ScrollX>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <TableCell key={header.id}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box>{flexRender(header.column.columnDef.header, header.getContext())}</Box>
                                                    <HeaderSort column={header.column} />
                                                </Stack>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHead>
                            <TableBody>
                                {table.getRowModel().rows.map(row => (
                                    <Fragment key={row.id}>
                                        <TableRow>
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                            ))}
                                        </TableRow>
                                        {row.getIsExpanded() && (
                                            <TableRow>
                                                <TableCell colSpan={row.getVisibleCells().length}>
                                                    <WinningPartyView data={row.original} />
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
                            setPageSize={(size) => setPagination(prev => ({ ...prev, pageSize: size }))}
                            setPageIndex={(index) => setPagination(prev => ({ ...prev, pageIndex: index }))}
                            getState={table.getState}
                            getPageCount={() => pageCount}
                        />
                    </Box>
                </ScrollX>
            </MainCard>
            <WinningPartyModal
                open={openModal}
                modalToggler={setOpenModal}
                winningParty={selectedWinningParty}
                states={states}
                assemblies={assemblies}
                parliaments={parliaments}
                parties={parties}
                candidates={candidates}
                years={years}
                refresh={() => fetchWinningParties(pagination.pageIndex, pagination.pageSize)}
            />
            <AlertWinningPartyDelete
                id={winningPartyDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchWinningParties(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}