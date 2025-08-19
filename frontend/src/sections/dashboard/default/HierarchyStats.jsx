import React from 'react';
import { Grid, Typography } from '@mui/material';
import EcommerceDataCard from '../../../components/cards/statistics/EcommerceDataCard';

const HierarchyStats = ({ level, selected, theme }) => {
    // Sample data - replace with actual data from your backend
    const getStats = () => {
        switch (level) {
            case 'state':
                return [
                    { title: 'Total Population', count: '72.6M', change: '+2.1%' },
                    { title: 'Total Voters', count: '52.1M', change: '+5.2%' },
                    { title: 'Total Constituencies', count: '230', change: '0%' },
                    { title: 'Voter Turnout', count: '69.2%', change: '+3.8%' }
                ];
            case 'division':
                return [
                    { title: 'Division Population', count: '12.4M', change: '+1.8%' },
                    { title: 'Division Voters', count: '8.9M', change: '+4.1%' },
                    { title: 'Parliament Seats', count: '48', change: '0%' },
                    { title: 'Last Turnout', count: '71.5%', change: '+4.2%' }
                ];
            case 'parliament':
                return [
                    { title: 'Parliament Population', count: '2.8M', change: '+1.5%' },
                    { title: 'Parliament Voters', count: '2.1M', change: '+3.2%' },
                    { title: 'Assembly Seats', count: '8', change: '0%' },
                    { title: 'Last Turnout', count: '68.9%', change: '+2.7%' }
                ];
            case 'assembly':
                return [
                    { title: 'Assembly Population', count: '350K', change: '+1.2%' },
                    { title: 'Assembly Voters', count: '262K', change: '+2.8%' },
                    { title: 'Polling Stations', count: '326', change: '+5%' },
                    { title: 'Last Turnout', count: '72.3%', change: '+5.1%' }
                ];
            case 'block':
                return [
                    { title: 'Block Population', count: '125K', change: '+1.1%' },
                    { title: 'Block Voters', count: '98K', change: '+2.4%' },
                    { title: 'Polling Stations', count: '112', change: '+2%' },
                    { title: 'Last Turnout', count: '70.8%', change: '+3.5%' }
                ];
            case 'booth':
                return [
                    { title: 'Booth Population', count: '1.2K', change: '+0.8%' },
                    { title: 'Registered Voters', count: '982', change: '+1.9%' },
                    { title: 'Male Voters', count: '512', change: '+1.5%' },
                    { title: 'Female Voters', count: '470', change: '+2.3%' }
                ];
            default:
                return [];
        }
    };

    const stats = getStats();

    return (
        <Grid container spacing={2.75}>
            {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} lg={3} key={index}>
                    <EcommerceDataCard
                        title={stat.title}
                        count={stat.count}
                        color={index % 4 === 0 ? 'primary' :
                            index % 4 === 1 ? 'warning' :
                                index % 4 === 2 ? 'success' : 'error'}
                        percentage={
                            <Typography
                                color={stat.change.startsWith('+') ? 'success.dark' : 'error.dark'}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                            >
                                {stat.change}
                            </Typography>
                        }
                    />
                </Grid>
            ))}
        </Grid>
    );
};

export default HierarchyStats;

