import React from 'react';
import { lazy } from 'react';
import Loadable from 'components/Loadable';

const HierarchicalMap = Loadable(lazy(() => import('sections/dashboard/default/HierarchicalMap')));

const MapDashboard = () => {
    return <HierarchicalMap />;
};

export default MapDashboard;

