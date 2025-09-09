import PropTypes from 'prop-types';
import { useEffect, useState, Fragment } from 'react';
import { matchPath, useLocation } from 'react-router';

// material-ui
import { useTheme, styled } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Paper from '@mui/material/Paper';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popper from '@mui/material/Popper';
import Typography from '@mui/material/Typography';

// third-party
import { FormattedMessage } from 'react-intl';

// project-imports
import NavItem from 'layout/Dashboard/Drawer/DrawerContent/Navigation/NavItem';
import NavCollapse from 'layout/Dashboard/Drawer/DrawerContent/Navigation/NavCollapse';
import SimpleBar from 'components/third-party/SimpleBar';
import Transitions from 'components/@extended/Transitions';

import { MenuOrientation, ThemeMode } from 'config';
import useConfig from 'hooks/useConfig';
import { useGetMenuMaster } from 'api/menu';
import { usePermissions } from 'contexts/PermissionContext';
import { getPermissionName } from 'utils/menuPermissions';

// assets
import { More2 } from 'iconsax-react';

const PopperStyled = styled(Popper)(({ theme }) => ({
    overflow: 'visible',
    zIndex: 1202,
    minWidth: 180,
    '&:before': {
        background: theme.palette.background.paper,
        content: '""',
        display: 'block',
        position: 'absolute',
        top: 5,
        left: 32,
        width: 12,
        height: 12,
        transform: 'translateY(-50%) rotate(45deg)',
        zIndex: 120,
        borderWidth: '6px',
        borderStyle: 'solid',
        borderColor: 'transparent',
        borderLeftColor: theme.palette.background.paper,
        borderBottomColor: theme.palette.background.paper
    }
}));

// ==============================|| DRAWER CONTENT - NAVIGATION GROUP ||============================== //

export default function PermissionNavGroup({
    item,
    lastItem,
    remItems,
    lastItemId,
    setSelectedID,
    selectedID,
    setSelectedItems,
    selectedItems,
    selectedLevel,
    setSelectedLevel
}) {
    const theme = useTheme();
    const { pathname } = useLocation();
    const { menuOrientation } = useConfig();
    const { menuMaster } = useGetMenuMaster();
    const matchesMD = useMediaQuery(theme.breakpoints.down('md'));
    const drawerOpen = menuMaster.isDashboardDrawerOpened;

    const downLG = useMediaQuery(theme.breakpoints.down('lg'));
    const { hasPermission, hasAnyPermission, userPermissions, loading } = usePermissions();

    // Debug logging
    console.log('🔍 PermissionNavGroup - User permissions:', {
        userPermissions,
        loading,
        permissionsCount: userPermissions?.length || 0
    });

    const [anchorEl, setAnchorEl] = useState(null);
    const [currentItem, setCurrentItem] = useState(item);

    const openMini = Boolean(anchorEl);

    useEffect(() => {
        if (lastItem) {
            if (item.id === lastItemId) {
                const localItem = { ...item };
                const elements = remItems.map((ele) => ele.elements);
                localItem.children = elements.flat(1);
                setCurrentItem(localItem);
            } else {
                setCurrentItem(item);
            }
        }
    }, [item, lastItem, lastItemId, remItems]);

    const checkPathname = (pathname, url) => Boolean(matchPath({ path: url, exact: true }, pathname));

    const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

    // multi-level
    const isParent = currentItem.children?.some((child) => {
        if (child.permissions && Array.isArray(child.permissions)) {
            return hasAnyPermission(child.permissions);
        }
        // Fallback to old system if no permissions property
        const permissionName = getPermissionName(child.url || child.id, '_read');
        return hasPermission(permissionName);
    });

    // Filter children based on permissions
    const getFilteredChildren = () => {
        if (!currentItem.children) {
            return [];
        }

        const filtered = currentItem.children.filter((menuItem) => {
            // Use the permissions property if available
            if (menuItem.permissions && Array.isArray(menuItem.permissions)) {
                return hasAnyPermission(menuItem.permissions);
            }
            // Fallback to old permission system
            const requiredPermission = getPermissionName(menuItem.url || menuItem.id, '_read');
            return hasPermission(requiredPermission);
        });

        return filtered;
    }; useEffect(() => {
        const filteredChildren = getFilteredChildren();
        if (filteredChildren.length > 0) {
            currentItem.children.some((child) => {
                if (child.url && checkPathname(pathname, child.url)) {
                    setSelectedID(currentItem.id);
                    return true;
                }
                return false;
            });
        }
    }, [pathname, currentItem]);

    const handleClick = (event) => {
        if (!isParent) {
            return;
        }
        if (drawerOpen) {
            setSelectedID(selectedID !== currentItem.id ? currentItem.id : '');
            setSelectedLevel(selectedLevel !== 1 ? 1 : 0);
            setSelectedItems(selectedItems !== currentItem.id ? currentItem.id : '');
        } else {
            setAnchorEl(event?.currentTarget);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    // Check if current group has any accessible children
    const filteredChildren = getFilteredChildren();

    // Check if user has permission to see this group
    if (currentItem.permissions && Array.isArray(currentItem.permissions)) {
        const groupAccess = hasAnyPermission(currentItem.permissions);
        console.log(`🔍 Group "${currentItem.id}" permission check:`, {
            requiredPermissions: currentItem.permissions,
            hasAccess: groupAccess,
            userPermissions: userPermissions
        });
        if (!groupAccess) {
            console.log(`❌ Group "${currentItem.id}" hidden - no permission`);
            return null; // Don't render the group if user doesn't have permission
        }
    }

    console.log(`🔍 Group "${currentItem.id}" children check:`, {
        totalChildren: currentItem.children?.length || 0,
        filteredChildren: filteredChildren.length,
        children: filteredChildren.map(child => ({ id: child.id, title: child.title }))
    });

    if (filteredChildren.length === 0) {
        console.log(`❌ Group "${currentItem.id}" hidden - no accessible children`);
        return null; // Don't render the group if no children are accessible
    }

    const isSelected = selectedID === currentItem.id;

    const Icon = currentItem?.icon;
    const itemIcon = currentItem?.icon ? (
        <Icon variant="Bulk" size={22} color={isSelected ? theme.palette.primary.main : theme.palette.secondary.main} />
    ) : null;

    const navCollapse = filteredChildren.map((menuItem, index) => {
        switch (menuItem.type) {
            case 'collapse':
                return (
                    <NavCollapse
                        key={menuItem.id}
                        menu={menuItem}
                        setSelectedItems={setSelectedItems}
                        setSelectedLevel={setSelectedLevel}
                        selectedLevel={selectedLevel}
                        selectedItems={selectedItems}
                        level={1}
                        parentId={currentItem.id}
                    />
                );
            case 'item':
                return <NavItem key={menuItem.id} item={menuItem} level={1} />;
            default:
                return (
                    <Typography key={index} variant="h6" color="error" align="center">
                        Fix - Group Collapse or Items
                    </Typography>
                );
        }
    });

    const moreItems = remItems.map((itemRem, i) => (
        <Fragment key={i}>
            {itemRem.url ? (
                <NavItem item={item} level={1} />
            ) : (
                itemRem.title && (
                    <Typography variant="caption" sx={{ pl: 2 }}>
                        {itemRem.title} {itemRem.url}
                    </Typography>
                )
            )}
            <List key={itemRem.title} sx={{ py: 0 }}>
                {itemRem.elements?.map((menu) => {
                    // Check permissions using the new system first
                    if (menu.permissions && Array.isArray(menu.permissions)) {
                        if (!hasAnyPermission(menu.permissions)) return null;
                    } else {
                        // Fallback to old permission system
                        const requiredPermission = getPermissionName(menu.url || menu.id, '_read');
                        if (!hasPermission(requiredPermission)) return null;
                    }

                    switch (menu.type) {
                        case 'collapse':
                            return (
                                <NavCollapse
                                    key={menu.id}
                                    menu={menu}
                                    setSelectedItems={setSelectedItems}
                                    setSelectedLevel={setSelectedLevel}
                                    selectedLevel={selectedLevel}
                                    selectedItems={selectedItems}
                                    level={1}
                                    parentId={currentItem.id}
                                />
                            );
                        case 'item':
                            return <NavItem key={menu.id} item={menu} level={1} />;
                        default:
                            return (
                                <Typography key={menu.id} variant="h6" color="error" align="center">
                                    Fix - Items
                                </Typography>
                            );
                    }
                })}
            </List>
        </Fragment>
    ));

    if (isHorizontal) {
        return (
            <>
                <ListItemButton
                    {...(!drawerOpen && { onMouseEnter: handleClick })}
                    onClick={handleClick}
                    sx={{
                        zIndex: 1201,
                        pl: drawerOpen ? `${24}px` : 1.25,
                        py: !drawerOpen && selectedLevel === 0 ? 1.25 : 1,
                        ...(drawerOpen && {
                            '&:hover': {
                                bgcolor: 'transparent'
                            },
                            '&.Mui-selected': {
                                '&:hover': {
                                    bgcolor: 'transparent'
                                },
                                bgcolor: 'transparent'
                            }
                        }),
                        ...(selectedID === currentItem.id && {
                            bgcolor: 'transparent',
                            color: theme.palette.primary.main,
                            '&:hover': { color: theme.palette.primary.main, bgcolor: 'transparent' }
                        })
                    }}
                    selected={selectedID === currentItem.id}
                >
                    {itemIcon && (
                        <ListItemIcon
                            sx={{
                                minWidth: 38,
                                color: selectedID === currentItem.id ? 'primary.main' : 'secondary.main',
                                ...(!drawerOpen && {
                                    borderRadius: 1.5,
                                    width: 36,
                                    height: 36,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    '&:hover': {
                                        bgcolor: theme.palette.mode === ThemeMode.DARK ? 'secondary.light' : 'secondary.lighter'
                                    }
                                }),
                                ...(!drawerOpen &&
                                    selectedID === currentItem.id && {
                                    bgcolor: theme.palette.mode === ThemeMode.DARK ? 'primary.900' : 'primary.lighter',
                                    '&:hover': {
                                        bgcolor: theme.palette.mode === ThemeMode.DARK ? 'primary.darker' : 'primary.lighter'
                                    }
                                })
                            }}
                        >
                            {itemIcon}
                        </ListItemIcon>
                    )}
                    {(drawerOpen || (!drawerOpen && selectedLevel === 0)) && (
                        <ListItemText
                            primary={
                                <Typography variant="h6" color={selectedID === currentItem.id ? 'primary' : 'secondary'}>
                                    {currentItem.title}
                                </Typography>
                            }
                        />
                    )}
                    {(drawerOpen || (!drawerOpen && selectedLevel === 0)) && (
                        <>
                            {currentItem.url && (
                                <Box sx={{ ml: 1 }}>
                                    <More2 size={16} color={theme.palette.primary.main} variant="Bold" />
                                </Box>
                            )}
                            {lastItem && lastItem === currentItem.id ? (
                                <More2 size={16} color={theme.palette.primary.main} style={{ marginLeft: 4 }} />
                            ) : (
                                !currentItem.url && (
                                    <More2 size={16} color={theme.palette.primary.main} style={{ marginLeft: 4 }} />
                                )
                            )}
                        </>
                    )}

                    {!drawerOpen && (
                        <PopperStyled
                            open={openMini}
                            anchorEl={anchorEl}
                            placement="right-start"
                            style={{
                                zIndex: 2001
                            }}
                        >
                            {({ TransitionProps }) => (
                                <Transitions in={openMini} {...TransitionProps}>
                                    <Paper
                                        sx={{
                                            overflow: 'hidden',
                                            mt: 1.5,
                                            boxShadow: theme.customShadows.z1,
                                            backgroundImage: 'none',
                                            border: `1px solid ${theme.palette.divider}`
                                        }}
                                    >
                                        <ClickAwayListener onClickAway={handleClose}>
                                            <SimpleBar
                                                sx={{
                                                    overflowX: 'hidden',
                                                    overflowY: 'auto',
                                                    maxHeight: matchesMD ? 'calc(100vh - 100px)' : 'calc(50vh - 50px)'
                                                }}
                                            >
                                                <Box sx={{ p: 2 }}>
                                                    <List component="div" disablePadding sx={{ '& .MuiListItemButton-root': { mb: 0.5 } }}>
                                                        <Typography variant="subtitle1" color="textPrimary" sx={{ pl: 2 }}>
                                                            {currentItem.title}
                                                        </Typography>
                                                        {navCollapse}
                                                    </List>
                                                    {moreItems}
                                                </Box>
                                            </SimpleBar>
                                        </ClickAwayListener>
                                    </Paper>
                                </Transitions>
                            )}
                        </PopperStyled>
                    )}
                </ListItemButton>
                {drawerOpen && navCollapse}
            </>
        );
    }

    return (
        <>
            <ListItemButton
                onClick={handleClick}
                sx={{
                    zIndex: 1201,
                    pl: drawerOpen ? `${24}px` : 1.25,
                    py: !drawerOpen && selectedLevel === 0 ? 1.25 : 1,
                    ...(drawerOpen && {
                        '&:hover': {
                            bgcolor: 'transparent'
                        },
                        '&.Mui-selected': {
                            '&:hover': {
                                bgcolor: 'transparent'
                            },
                            bgcolor: 'transparent'
                        }
                    }),
                    ...(selectedID === currentItem.id && {
                        bgcolor: 'transparent',
                        color: theme.palette.primary.main,
                        '&:hover': { color: theme.palette.primary.main, bgcolor: 'transparent' }
                    })
                }}
                selected={selectedID === currentItem.id}
            >
                {itemIcon && (
                    <ListItemIcon
                        sx={{
                            minWidth: 38,
                            color: selectedID === currentItem.id ? 'primary.main' : 'secondary.main',
                            ...(!drawerOpen && {
                                borderRadius: 1.5,
                                width: 36,
                                height: 36,
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&:hover': {
                                    bgcolor: theme.palette.mode === ThemeMode.DARK ? 'secondary.light' : 'secondary.lighter'
                                }
                            }),
                            ...(!drawerOpen &&
                                selectedID === currentItem.id && {
                                bgcolor: theme.palette.mode === ThemeMode.DARK ? 'primary.900' : 'primary.lighter',
                                '&:hover': {
                                    bgcolor: theme.palette.mode === ThemeMode.DARK ? 'primary.darker' : 'primary.lighter'
                                }
                            })
                        }}
                    >
                        {itemIcon}
                    </ListItemIcon>
                )}
                {(drawerOpen || (!drawerOpen && selectedLevel === 0)) && (
                    <ListItemText
                        primary={
                            <Typography variant="h6" color={selectedID === currentItem.id ? 'primary' : 'secondary'}>
                                {currentItem.title}
                            </Typography>
                        }
                    />
                )}
                {(drawerOpen || (!drawerOpen && selectedLevel === 0)) && (
                    <>
                        {lastItem && lastItem === currentItem.id ? (
                            <More2 size={16} color={theme.palette.primary.main} style={{ marginLeft: 4 }} />
                        ) : (
                            !currentItem.url && <More2 size={16} color={theme.palette.primary.main} style={{ marginLeft: 4 }} />
                        )}
                    </>
                )}

                {!drawerOpen && (
                    <PopperStyled
                        open={openMini}
                        anchorEl={anchorEl}
                        placement="right-start"
                        style={{
                            zIndex: 2001
                        }}
                    >
                        {({ TransitionProps }) => (
                            <Transitions in={openMini} {...TransitionProps}>
                                <Paper
                                    sx={{
                                        overflow: 'hidden',
                                        mt: 1.5,
                                        boxShadow: theme.customShadows.z1,
                                        backgroundImage: 'none',
                                        border: `1px solid ${theme.palette.divider}`
                                    }}
                                >
                                    <ClickAwayListener onClickAway={handleClose}>
                                        <SimpleBar
                                            sx={{
                                                overflowX: 'hidden',
                                                overflowY: 'auto',
                                                maxHeight: matchesMD ? 'calc(100vh - 100px)' : 'calc(50vh - 50px)'
                                            }}
                                        >
                                            <Box sx={{ p: 2 }}>
                                                <List component="div" disablePadding sx={{ '& .MuiListItemButton-root': { mb: 0.5 } }}>
                                                    <Typography variant="subtitle1" color="textPrimary" sx={{ pl: 2 }}>
                                                        {currentItem.title}
                                                    </Typography>
                                                    {navCollapse}
                                                </List>
                                                {moreItems}
                                            </Box>
                                        </SimpleBar>
                                    </ClickAwayListener>
                                </Paper>
                            </Transitions>
                        )}
                    </PopperStyled>
                )}
            </ListItemButton>
            {drawerOpen && navCollapse}
        </>
    );
}

PermissionNavGroup.propTypes = {
    item: PropTypes.object,
    lastItem: PropTypes.any,
    remItems: PropTypes.array,
    lastItemId: PropTypes.string,
    setSelectedID: PropTypes.func,
    selectedID: PropTypes.string,
    setSelectedItems: PropTypes.func,
    selectedItems: PropTypes.string,
    selectedLevel: PropTypes.number,
    setSelectedLevel: PropTypes.func
};
