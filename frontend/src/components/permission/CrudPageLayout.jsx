import PropTypes from 'prop-types';
import { Fragment, useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Stack, Box, Divider
} from '@mui/material';
import { Add } from 'iconsax-react';
import { flexRender } from '@tanstack/react-table';

import MainCard from 'components/MainCard';
import ScrollX from 'components/ScrollX';
import { DebouncedInput, HeaderSort, TablePagination } from 'components/third-party/react-table';
import EmptyReactTable from 'pages/tables/react-table/empty';
import { CSVLink } from 'react-csv';

import { PermissionProvider } from 'contexts/PermissionContext';
import PermissionButton from 'components/PermissionButton';
import PermissionGate from 'components/PermissionGate';
import CrudActions from 'components/permission/CrudActions';

// ==============================|| CRUD PAGE LAYOUT ||============================== //

export default function CrudPageLayout({
    // Data props
    data,
    table,
    loading,

    // Entity props
    entityName,
    entityNamePlural,

    // Search and pagination
    globalFilter,
    onGlobalFilterChange,

    // CSV Export
    csvData,
    csvLoading,
    onCsvDownload,

    // CRUD operations
    onAdd,
    onEdit,
    onDelete,
    onView,

    // Table configuration
    columns,
    expandedRowRenderer,

    // Permissions
    createPermission,
    readPermission,

    // UI Configuration
    showSearch = true,
    showCsvExport = true,
    showAddButton = true,
    customActions = []
}) {
    const entityLower = entityName.toLowerCase();
    const finalCreatePermission = createPermission || `${entityLower}_create`;
    const finalReadPermission = readPermission || `${entityLower}_read`;

    if (loading && data.length === 0) {
        return (
            <MainCard content={false}>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    Loading {entityNamePlural}...
                </Box>
            </MainCard>
        );
    }

    return (
        <PermissionProvider>
            <MainCard content={false}>
                {/* Header with Search and Actions */}
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
                    {showSearch && (
                        <DebouncedInput
                            value={globalFilter}
                            onFilterChange={onGlobalFilterChange}
                            placeholder={`Search ${data.length} ${entityNamePlural.toLowerCase()}...`}
                        />
                    )}

                    <Stack direction="row" spacing={1}>
                        {/* CSV Export */}
                        {showCsvExport && csvData && (
                            <PermissionGate requiredPermission={finalReadPermission}>
                                <Button variant="outlined" onClick={onCsvDownload} disabled={csvLoading}>
                                    {csvLoading ? 'Preparing CSV...' : 'Download CSV'}
                                </Button>
                            </PermissionGate>
                        )}

                        {/* Custom Actions */}
                        {customActions.map((action, index) => (
                            <PermissionButton
                                key={index}
                                variant={action.variant || 'outlined'}
                                startIcon={action.icon}
                                requiredPermission={action.permission}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                tooltipTitle={action.tooltipTitle}
                            >
                                {action.label}
                            </PermissionButton>
                        ))}

                        {/* Add Button */}
                        {showAddButton && onAdd && (
                            <PermissionButton
                                variant="contained"
                                startIcon={<Add />}
                                requiredPermission={finalCreatePermission}
                                onClick={onAdd}
                                tooltipTitle={`Add new ${entityName.toLowerCase()}`}
                            >
                                Add {entityName}
                            </PermissionButton>
                        )}
                    </Stack>
                </Stack>

                {/* Table */}
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
                                {table.getRowModel().rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length}>
                                            <EmptyReactTable />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    table.getRowModel().rows.map((row) => (
                                        <Fragment key={row.id}>
                                            <TableRow>
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                            {row.getIsExpanded() && expandedRowRenderer && (
                                                <TableRow>
                                                    <TableCell colSpan={columns.length}>
                                                        {expandedRowRenderer(row.original)}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </ScrollX>

                {/* Pagination */}
                <Divider />
                <Box sx={{ p: 2 }}>
                    <TablePagination
                        {...{
                            setPageSize: table.setPageSize,
                            setPageIndex: table.setPageIndex,
                            getState: table.getState,
                            getPageCount: table.getPageCount,
                            initialPageSize: table.getState().pagination.pageSize
                        }}
                    />
                </Box>
            </MainCard>
        </PermissionProvider>
    );
}

CrudPageLayout.propTypes = {
    // Data props
    data: PropTypes.array.isRequired,
    table: PropTypes.object.isRequired,
    loading: PropTypes.bool,

    // Entity props
    entityName: PropTypes.string.isRequired,
    entityNamePlural: PropTypes.string.isRequired,

    // Search and pagination
    globalFilter: PropTypes.string,
    onGlobalFilterChange: PropTypes.func,

    // CSV Export
    csvData: PropTypes.array,
    csvLoading: PropTypes.bool,
    onCsvDownload: PropTypes.func,

    // CRUD operations
    onAdd: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onView: PropTypes.func,

    // Table configuration
    columns: PropTypes.array.isRequired,
    expandedRowRenderer: PropTypes.func,

    // Permissions
    createPermission: PropTypes.string,
    readPermission: PropTypes.string,

    // UI Configuration
    showSearch: PropTypes.bool,
    showCsvExport: PropTypes.bool,
    showAddButton: PropTypes.bool,
    customActions: PropTypes.arrayOf(
        PropTypes.shape({
            label: PropTypes.string.isRequired,
            icon: PropTypes.node,
            permission: PropTypes.string.isRequired,
            onClick: PropTypes.func.isRequired,
            variant: PropTypes.string,
            disabled: PropTypes.bool,
            tooltipTitle: PropTypes.string
        })
    )
};
