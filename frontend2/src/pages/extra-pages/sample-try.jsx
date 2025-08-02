// project-imports
import MainCard from 'components/MainCard';

// ==============================|| USER MANAGEMENT PAGE ||============================== //

import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

// material-ui
import { Typography, Table, TableBody, TableContainer, TableCell, TableHead, TableRow, Tooltip, Stack } from '@mui/material';

// third-party
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table';

// project-import
import ScrollX from 'components/ScrollX';
import IconButton from 'components/@extended/IconButton';
import { CSVExport, RowEditable } from 'components/third-party/react-table';

// assets
import { CloseCircle, Edit2, Send } from 'iconsax-react';

// ==============================|| DUMMY DATA GENERATOR ||============================== //

function makeUserData(count) {
  const roles = ['SuperAdmin', 'Admin', 'Booth', 'Division', 'Parliament', 'Block', 'Assembly'];
  const accessLevels = ['editor', 'viewOnly'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    email: `user${i + 1}@example.com`,
    role: roles[Math.floor(Math.random() * roles.length)],
    accessLevel: accessLevels[Math.floor(Math.random() * accessLevels.length)],
    regionModel: ['Division', 'Parliament', 'Block', 'Assembly', 'Booth'][Math.floor(Math.random() * 5)],
    isActive: Math.random() > 0.3,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString(),
    status: Math.random() > 0.5 ? 'Active' : 'Inactive',
    progress: Math.floor(Math.random() * 100)
  }));
}

// ==============================|| EDIT ACTION COMPONENT ||============================== //

function EditAction({ row, table }) {
  const meta = table?.options?.meta;
  const setSelectedRow = (e) => {
    meta?.setSelectedRow((old) => ({
      ...old,
      [row.id]: !old[row.id]
    }));

    meta?.revertData(row.index, e?.currentTarget.name === 'cancel');
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {meta?.selectedRow[row.id] && (
        <Tooltip title="Cancel">
          <IconButton color="error" name="cancel" onClick={setSelectedRow}>
            <CloseCircle size="15" variant="Outline" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title={meta?.selectedRow[row.id] ? 'Save' : 'Edit'}>
        <IconButton color={meta?.selectedRow[row.id] ? 'success' : 'primary'} onClick={setSelectedRow}>
          {meta?.selectedRow[row.id] ? <Send size="15" variant="Outline" /> : <Edit2 variant="Outline" />}
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

// ==============================|| REACT TABLE COMPONENT ||============================== //

function ReactTable({ columns, data, setData }) {
  const [originalData, setOriginalData] = useState(() => [...data]);
  const [selectedRow, setSelectedRow] = useState({});

  const table = useReactTable({
    data,
    columns,
    defaultColumn: {
      cell: RowEditable
    },
    getCoreRowModel: getCoreRowModel(),
    meta: {
      selectedRow,
      setSelectedRow,
      revertData: (rowIndex, revert) => {
        if (revert) {
          setData((old) => old.map((row, index) => (index === rowIndex ? originalData[rowIndex] : row)));
        } else {
          setOriginalData((old) => old.map((row, index) => (index === rowIndex ? data[rowIndex] : row)));
        }
      },
      updateData: (rowIndex, columnId, value) => {
        setData((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex],
                [columnId]: value
              };
            }
            return row;
          })
        );
      }
    },
    debugTable: true
  });

  let headers = [];
  table.getAllColumns().map(
    (columns) =>
      columns.columnDef.accessorKey &&
      headers.push({
        label: typeof columns.columnDef.header === 'string' ? columns.columnDef.header : '#',
        key: columns.columnDef.accessorKey
      })
  );

  return (
    <MainCard
      content={false}
      title="User Management"
      secondary={
        <CSVExport {...{ data: table.getRowModel().flatRows.map((row) => row.original), headers, filename: 'users.csv' }} />
      }
    >
      <ScrollX>
        <TableContainer>
          <Table>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableCell key={header.id} {...header.column.columnDef.meta}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} {...cell.column.columnDef.meta}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </ScrollX>
    </MainCard>
  );
}

// ==============================|| USER TABLE COMPONENT ||============================== //

function UserTable() {
  const [data, setData] = useState(() => makeUserData(10));

  const columns = useMemo(
    () => [
      {
        header: 'Email',
        accessorKey: 'email',
        dataType: 'text'
      },
      {
        header: 'Role',
        accessorKey: 'role',
        dataType: 'select',
        meta: {
          selectOptions: ['SuperAdmin', 'Admin', 'Booth', 'Division', 'Parliament', 'Block', 'Assembly']
        }
      },
      {
        header: 'Access Level',
        accessorKey: 'accessLevel',
        dataType: 'select',
        meta: {
          selectOptions: ['editor', 'viewOnly']
        }
      },
      {
        header: 'Region Model',
        accessorKey: 'regionModel',
        dataType: 'select',
        meta: {
          selectOptions: ['Division', 'Parliament', 'Block', 'Assembly', 'Booth']
        }
      },
      {
        header: 'Status',
        accessorKey: 'isActive',
        dataType: 'text',
        cell: ({ getValue }) => getValue() ? 'Active' : 'Inactive'
      },
      {
        header: 'Created At',
        accessorKey: 'createdAt',
        dataType: 'date'
      },
      {
        header: 'Actions',
        id: 'edit',
        cell: EditAction,
        meta: {
          className: 'cell-center'
        }
      }
    ],
    []
  );

  return <ReactTable {...{ data, columns, setData }} />;
}

// ==============================|| PROP TYPES ||============================== //

EditAction.propTypes = { row: PropTypes.object, table: PropTypes.object };
ReactTable.propTypes = { columns: PropTypes.array, data: PropTypes.array, setData: PropTypes.any };

// ==============================|| MAIN PAGE ||============================== //

export default function UserManagementPage() {
  return (
    <>
      <MainCard title="User Management">
        <Typography variant="body1">
          Manage all system users with different roles and access levels. You can edit user details directly in the table.
        </Typography>
      </MainCard>
      
      <br />
      
      <UserTable />
    </>
  );
}