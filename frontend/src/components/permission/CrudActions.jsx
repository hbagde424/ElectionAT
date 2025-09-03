import PropTypes from 'prop-types';
import { Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add, Edit, Eye, Trash } from 'iconsax-react';

import PermissionButton from 'components/PermissionButton';
import { hasOperationPermission } from 'utils/menuPermissions';

// ==============================|| CRUD ACTION BUTTONS ||============================== //

export default function CrudActions({
    entityName,
    row,
    onView,
    onEdit,
    onDelete,
    showView = true,
    showEdit = true,
    showDelete = true,
    isExpanded = false,
    customActions = []
}) {
    const theme = useTheme();

    const entityLower = entityName.toLowerCase();

    // Generate permission names based on entity
    const viewPermission = `${entityLower}_read`;
    const editPermission = `${entityLower}_update`;
    const deletePermission = `${entityLower}_delete`;

    const expandIcon = isExpanded
        ? <Add style={{ transform: 'rotate(45deg)', color: theme.palette.error.main }} />
        : <Eye />;

    return (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            {/* View/Expand Action */}
            {showView && onView && (
                <PermissionButton
                    icon={expandIcon}
                    requiredPermission={viewPermission}
                    onClick={onView}
                    color="secondary"
                    tooltipTitle={isExpanded ? `Collapse ${entityName} details` : `View ${entityName} details`}
                />
            )}

            {/* Edit Action */}
            {showEdit && onEdit && (
                <PermissionButton
                    icon={<Edit />}
                    requiredPermission={editPermission}
                    onClick={onEdit}
                    color="primary"
                    tooltipTitle={`Edit ${entityName}`}
                />
            )}

            {/* Delete Action */}
            {showDelete && onDelete && (
                <PermissionButton
                    icon={<Trash />}
                    requiredPermission={deletePermission}
                    onClick={onDelete}
                    color="error"
                    tooltipTitle={`Delete ${entityName}`}
                />
            )}

            {/* Custom Actions */}
            {customActions.map((action, index) => (
                <PermissionButton
                    key={index}
                    icon={action.icon}
                    requiredPermission={action.permission}
                    onClick={action.onClick}
                    color={action.color || 'default'}
                    tooltipTitle={action.tooltipTitle}
                    disabled={action.disabled}
                />
            ))}
        </Stack>
    );
}

CrudActions.propTypes = {
    entityName: PropTypes.string.isRequired,
    row: PropTypes.object.isRequired,
    onView: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    showView: PropTypes.bool,
    showEdit: PropTypes.bool,
    showDelete: PropTypes.bool,
    isExpanded: PropTypes.bool,
    customActions: PropTypes.arrayOf(
        PropTypes.shape({
            icon: PropTypes.node.isRequired,
            permission: PropTypes.string.isRequired,
            onClick: PropTypes.func.isRequired,
            color: PropTypes.string,
            tooltipTitle: PropTypes.string.isRequired,
            disabled: PropTypes.bool
        })
    )
};
