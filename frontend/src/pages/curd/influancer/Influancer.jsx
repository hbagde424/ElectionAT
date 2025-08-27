import { useEffect, useMemo, useState, Fragment, useRef } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Typography, Divider, Chip, TextField, MenuItem
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

import InfluencerModal from './InfluancerModal';
import AlertInfluencerDelete from './AlertInfluancerDelete';
import InfluencerView from './InfluancerView';

export default function InfluencersListPage() {
    const theme = useTheme();

    const [selectedInfluencer, setSelectedInfluencer] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);
    const [influencerDeleteId, setInfluencerDeleteId] = useState('');
    const [influencers, setInfluencers] = useState([]);
    const [states, setStates] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [parliaments, setParliaments] = useState([]);
    const [assemblies, setAssemblies] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [booths, setBooths] = useState([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState('');

    // Filter states
    const [selectedState, setSelectedState] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedParliament, setSelectedParliament] = useState('');
    const [selectedAssembly, setSelectedAssembly] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedBlock, setSelectedBlock] = useState('');
    const [selectedBooth, setSelectedBooth] = useState('');

    // Temporary filter states
    const [tempFilters, setTempFilters] = useState({
        state: '',
        division: '',
        parliament: '',
        assembly: '',
        district: '',
        block: '',
        booth: ''
    });

    // Filtered arrays for cascading dropdowns
    const [filteredDivisions, setFilteredDivisions] = useState([]);
    const [filteredParliaments, setFilteredParliaments] = useState([]);
    const [filteredAssemblies, setFilteredAssemblies] = useState([]);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredBlocks, setFilteredBlocks] = useState([]);
    const [filteredBooths, setFilteredBooths] = useState([]);

    // Add useRef to track if reference data has been fetched
    const referenceDataFetched = useRef(false);

    // State -> Division
    useEffect(() => {
        if (tempFilters.state) {
            const filtered = divisions?.filter(division =>
                division.state_id?._id === tempFilters.state ||
                division.state_id === tempFilters.state
            ) || [];
            setFilteredDivisions(filtered);
        } else {
            setFilteredDivisions(divisions || []);
        }
        // Clear dependent fields when state changes
        if (tempFilters.division) {
            setTempFilters(prev => ({
                ...prev,
                division: '',
                parliament: '',
                assembly: '',
                district: '',
                block: '',
                booth: ''
            }));
        }
    }, [tempFilters.state, divisions]);

    // Division -> Parliament
    useEffect(() => {
        if (tempFilters.division) {
            const filtered = parliaments?.filter(parliament =>
                parliament.division_id?._id === tempFilters.division ||
                parliament.division_id === tempFilters.division
            ) || [];
            setFilteredParliaments(filtered);
        } else {
            setFilteredParliaments(parliaments || []);
        }
        // Clear dependent fields when division changes
        if (tempFilters.parliament) {
            setTempFilters(prev => ({
                ...prev,
                parliament: '',
                assembly: '',
                district: '',
                block: '',
                booth: ''
            }));
        }
    }, [tempFilters.division, parliaments]);

    // Parliament -> Assembly (District filtering removed as influencer model doesn't have district_id)
    useEffect(() => {
        if (tempFilters.parliament) {
            const filteredAssembliesList = assemblies?.filter(assembly =>
                assembly.parliament_id?._id === tempFilters.parliament ||
                assembly.parliament_id === tempFilters.parliament
            ) || [];
            setFilteredAssemblies(filteredAssembliesList);

            // For influencers, districts are not directly linked, so show all districts for reference
            setFilteredDistricts(districts || []);
        } else {
            setFilteredAssemblies(assemblies || []);
            setFilteredDistricts(districts || []);
        }
        // Clear dependent fields when parliament changes
        if (tempFilters.assembly || tempFilters.district) {
            setTempFilters(prev => ({
                ...prev,
                assembly: '',
                district: '',
                block: '',
                booth: ''
            }));
        }
    }, [tempFilters.parliament, assemblies, districts]);

    // Assembly -> Block (district filtering is just for display, doesn't affect API)
    useEffect(() => {
        if (tempFilters.assembly) {
            const filtered = blocks?.filter(block =>
                block.assembly_id?._id === tempFilters.assembly ||
                block.assembly_id === tempFilters.assembly
            ) || [];
            setFilteredBlocks(filtered);
        } else {
            setFilteredBlocks(blocks || []);
        }
        // Clear dependent fields when assembly changes
        if (tempFilters.block) {
            setTempFilters(prev => ({
                ...prev,
                block: '',
                booth: ''
            }));
        }
    }, [tempFilters.assembly, blocks]);

    // Block -> Booth
    useEffect(() => {
        if (tempFilters.block) {
            const filtered = booths?.filter(booth =>
                booth.block_id?._id === tempFilters.block ||
                booth.block_id === tempFilters.block
            ) || [];
            setFilteredBooths(filtered);
        } else {
            setFilteredBooths(booths || []);
        }
        // Clear booth when block changes
        if (tempFilters.booth) {
            setTempFilters(prev => ({
                ...prev,
                booth: ''
            }));
        }
    }, [tempFilters.block, booths]);

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
                fetch(`${import.meta.env.VITE_APP_API_URL}/states`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/divisions`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/parliaments`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/assemblies`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/districts`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/blocks`),
                fetch(`${import.meta.env.VITE_APP_API_URL}/booths`)
            ]);

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

    const fetchInfluencers = async (pageIndex, pageSize, globalFilter = '') => {
        setLoading(true);
        try {
            let query = globalFilter ? `&search=${encodeURIComponent(globalFilter)}` : '';
            if (selectedState) query += `&state=${selectedState}`;
            if (selectedDivision) query += `&division=${selectedDivision}`;
            if (selectedParliament) query += `&parliament=${selectedParliament}`;
            if (selectedAssembly) query += `&assembly=${selectedAssembly}`;
            // Note: district filter is not supported by influencer model - skipping district
            if (selectedBlock) query += `&block=${selectedBlock}`;
            if (selectedBooth) query += `&booth=${selectedBooth}`;

            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/influencers?page=${pageIndex + 1}&limit=${pageSize}${query}`);
            const json = await res.json();
            if (json.success) {
                setInfluencers(json.data);
                setPageCount(json.pages);
            }
        } catch (error) {
            console.error('Failed to fetch influencers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!referenceDataFetched.current) {
            fetchReferenceData();
            referenceDataFetched.current = true;
        }
    }, []);

    useEffect(() => {
        fetchInfluencers(pagination.pageIndex, pagination.pageSize, globalFilter);
    }, [
        pagination.pageIndex,
        pagination.pageSize,
        globalFilter,
        selectedState,
        selectedDivision,
        selectedParliament,
        selectedAssembly,
        selectedDistrict,
        selectedBlock,
        selectedBooth
    ]);

    const handleDeleteOpen = (id) => {
        setInfluencerDeleteId(id);
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
               cell: ({ row, table }) => {
                    const { pageIndex, pageSize } = table.getState().pagination;
                    const serialNumber = pageIndex * pageSize + row.index + 1;
                    return <Typography>{serialNumber}</Typography>;
                }
        },
        {
            header: 'Name',
            accessorKey: 'name',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue()}
                </Typography>
            )
        },
        {
            header: 'Contact Number',
            accessorKey: 'contact_number',
            cell: ({ getValue }) => (
                <Typography>
                    {getValue() || 'N/A'}
                </Typography>
            )
        },
        {
            header: 'Email',
            accessorKey: 'email',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {getValue() || 'N/A'}
                </Typography>
            )
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
            header: 'Division',
            accessorKey: 'division_id',
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
            header: 'Parliament',
            accessorKey: 'parliament_id',
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
            header: 'Block',
            accessorKey: 'block_id',
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
            header: 'Booth',
            accessorKey: 'booth_id',
            cell: ({ getValue }) => (
                <Chip
                    label={getValue()?.name || 'N/A'}
                    color="default"
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            header: 'Description',
            accessorKey: 'description',
            cell: ({ getValue }) => (
                <Typography sx={{
                    maxWidth: 250,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                    color: 'text.secondary'
                }}>
                    {/* Strip HTML tags for table preview */}
                    {getValue() ? getValue().replace(/<[^>]+>/g, '').slice(0, 100) : ''}
                </Typography>
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
                        <IconButton color="primary" onClick={(e) => { e.stopPropagation(); setSelectedInfluencer(row.original); setOpenModal(true); }}>
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
        data: influencers,
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

    const fetchAllInfluencersForCsv = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/influencers?all=true`);
            const json = await res.json();
            if (json.success) {
                return json.data;
            }
        } catch (error) {
            console.error('Failed to fetch all influencers for CSV:', error);
        }
        return [];
    };

    const [csvData, setCsvData] = useState([]);
    const [csvLoading, setCsvLoading] = useState(false);
    const csvLinkRef = useRef();

    const handleDownloadCsv = async () => {
        setCsvLoading(true);
        const allData = await fetchAllInfluencersForCsv();
        setCsvData(allData.map(item => ({
            Name: item.name,
            'Contact Number': item.contact_number,
            'Alternate Number': item.alternate_number || '',
            Email: item.email || '',
            'Full Address': item.full_address,
            State: item.state_id?.name || '',
            Division: item.division_id?.name || '',
            Parliament: item.parliament_id?.name || '',
            Assembly: item.assembly_id?.name || '',
            // District: item.district_id?.name || '', // Not supported by influencer model
            Block: item.block_id?.name || '',
            Booth: item.booth_id?.name || '',
            Booth_Number: item.booth_id?.booth_number || '',
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
                        placeholder={`Search ${influencers.length} influencers...`}
                    />
                    <Stack direction="row" spacing={1}>
                        <CSVLink
                            data={csvData}
                            filename="influencers_all.csv"
                            style={{ display: 'none' }}
                            ref={csvLinkRef}
                        />
                        <Button variant="outlined" onClick={handleDownloadCsv} disabled={csvLoading}>
                            {csvLoading ? 'Preparing CSV...' : 'Download All CSV'}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => { setSelectedInfluencer(null); setOpenModal(true); }}>
                            Add Influencer
                        </Button>
                    </Stack>
                </Stack>

                <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ p: 2, flexWrap: "wrap", gap: 2 }}
                >
                    {/* State */}
                    <TextField
                        select
                        label="State"
                        value={tempFilters.state}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, state: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                    >
                        <MenuItem value="">All States</MenuItem>
                        {states.map((state) => (
                            <MenuItem key={state._id} value={state._id}>
                                {state.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Division */}
                    <TextField
                        select
                        label="Division"
                        value={tempFilters.division}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, division: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.state}
                    >
                        <MenuItem value="">All Divisions</MenuItem>
                        {filteredDivisions.map((division) => (
                            <MenuItem key={division._id} value={division._id}>
                                {division.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Parliament */}
                    <TextField
                        select
                        label="Parliament"
                        value={tempFilters.parliament}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, parliament: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.division}
                    >
                        <MenuItem value="">All Parliaments</MenuItem>
                        {filteredParliaments.map((parliament) => (
                            <MenuItem key={parliament._id} value={parliament._id}>
                                {parliament.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Assembly */}
                    <TextField
                        select
                        label="Assembly"
                        value={tempFilters.assembly}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, assembly: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.parliament}
                    >
                        <MenuItem value="">All Assemblies</MenuItem>
                        {filteredAssemblies.map((assembly) => (
                            <MenuItem key={assembly._id} value={assembly._id}>
                                {assembly.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* District - Note: Influencer model doesn't support district filtering, kept for reference only */}
                    <TextField
                        select
                        label="District (Reference Only)"
                        value={tempFilters.district}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, district: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={true}
                        helperText="Not used for filtering"
                    >
                        <MenuItem value="">All Districts</MenuItem>
                        {filteredDistricts.map((district) => (
                            <MenuItem key={district._id} value={district._id}>
                                {district.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Block */}
                    <TextField
                        select
                        label="Block"
                        value={tempFilters.block}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, block: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.assembly}
                    >
                        <MenuItem value="">All Blocks</MenuItem>
                        {filteredBlocks.map((block) => (
                            <MenuItem key={block._id} value={block._id}>
                                {block.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Booth */}
                    <TextField
                        select
                        label="Booth"
                        value={tempFilters.booth}
                        onChange={(e) =>
                            setTempFilters((prev) => ({ ...prev, booth: e.target.value }))
                        }
                        sx={{ minWidth: 180 }}
                        size="small"
                        disabled={!tempFilters.block}
                    >
                        <MenuItem value="">All Booths</MenuItem>
                        {filteredBooths.map((booth) => (
                            <MenuItem key={booth._id} value={booth._id}>
                                {booth.name} (No: {booth.booth_number})
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Apply and Clear Buttons */}
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSelectedState(tempFilters.state);
                            setSelectedDivision(tempFilters.division);
                            setSelectedParliament(tempFilters.parliament);
                            setSelectedAssembly(tempFilters.assembly);
                            setSelectedDistrict(tempFilters.district);
                            setSelectedBlock(tempFilters.block);
                            setSelectedBooth(tempFilters.booth);
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Apply Filters
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => {
                            setTempFilters({
                                state: '',
                                division: '',
                                parliament: '',
                                assembly: '',
                                district: '',
                                block: '',
                                booth: ''
                            });
                            setSelectedState('');
                            setSelectedDivision('');
                            setSelectedParliament('');
                            setSelectedAssembly('');
                            setSelectedDistrict('');
                            setSelectedBlock('');
                            setSelectedBooth('');
                            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                        }}
                    >
                        Clear Filters
                    </Button>
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
                                                    <InfluencerView data={row.original} />
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

            <InfluencerModal
                open={openModal}
                modalToggler={setOpenModal}
                influencer={selectedInfluencer}
                states={states}
                divisions={divisions}
                parliaments={parliaments}
                assemblies={assemblies}
                districts={districts}
                blocks={blocks}
                booths={booths}
                refresh={() => fetchInfluencers(pagination.pageIndex, pagination.pageSize)}
            />

            <AlertInfluencerDelete
                id={influencerDeleteId}
                open={openDelete}
                handleClose={handleDeleteClose}
                refresh={() => fetchInfluencers(pagination.pageIndex, pagination.pageSize)}
            />
        </>
    );
}
