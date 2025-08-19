import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import ReactApexChart from 'react-apexcharts';
import axios from 'axios';
import { ThemeMode } from 'config';

// Chart options configuration
const columnChartOptions = {
  chart: {
    type: 'bar',
    height: 350,
    stacked: false
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      endingShape: 'rounded'
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent']
  },
  xaxis: {
    categories: []
  },
  yaxis: {
    title: {
      text: 'Number of Voters'
    },
    labels: {
      formatter: function (val) {
        return val.toLocaleString(); // Format numbers with commas
      }
    }
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    y: {
      formatter: function (val) {
        return val.toLocaleString(); // Format tooltip numbers with commas
      }
    }
  },
  legend: {
    show: true,
    fontFamily: `'Inter', sans-serif`,
    position: 'bottom',
    offsetX: 10,
    offsetY: 10,
    labels: {
      useSeriesColors: false
    },
    markers: {
      width: 16,
      height: 16,
      radius: 5
    },
    itemMargin: {
      horizontal: 15,
      vertical: 8
    }
  },
  responsive: [
    {
      breakpoint: 600,
      options: {
        yaxis: {
          show: true // Keep y-axis visible on mobile
        }
      }
    }
  ]
};

export default function VoterTurnoutChart() {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  // Theme colors
  const { primary } = theme.palette.text;
  const line = theme.palette.divider;
  const secondary = theme.palette.primary[700];
  const primaryMain = theme.palette.primary.main;
  const successDark = theme.palette.success.main;

  // State for chart data
  const [series, setSeries] = useState([]);
  const [options, setOptions] = useState(columnChartOptions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2024'); // Default year

  useEffect(() => {
    const fetchVoterTurnoutData = async () => {
      try {
        // First get all available years
        const yearsResponse = await axios.get(`${import.meta.env.VITE_APP_API_URL}/election-years`);
        const years = yearsResponse.data.data;

        if (!years || years.length === 0) {
          throw new Error('No election years available');
        }

        // Fetch data for each year
        const yearDataPromises = years.map(year =>
          axios.get(`${import.meta.env.VITE_APP_API_URL}/voter-turnout`, {
            params: {
              year: year._id,
              limit: 10
            }
          })
        );

        const yearResponses = await Promise.all(yearDataPromises);

        // Process data for each year
        const processedData = yearResponses.map((response, index) => {
          const yearData = response.data.data;
          const year = years[index].year;

          if (!yearData || yearData.length === 0) {
            return null;
          }

          // Sum up total voters and votes across all constituencies for this year
          const totalVoters = yearData.reduce((sum, item) => sum + (item.total_voter || 0), 0);
          const totalVotes = yearData.reduce((sum, item) => sum + (item.total_votes || 0), 0);

          return {
            year,
            totalVoters,
            totalVotes
          };
        }).filter(Boolean); // Remove null entries

        if (processedData.length === 0) {
          throw new Error('No valid voter turnout data available');
        }

        // Prepare chart data
        const categories = processedData.map(item => item.year.toString());
        const votersData = processedData.map(item => item.totalVoters);
        const votesData = processedData.map(item => item.totalVotes);

        setSeries([
          {
            name: 'Total Voters',
            data: votersData
          },
          {
            name: 'Total Votes',
            data: votesData
          }
        ]);

        // Update chart options
        setOptions(prevOptions => ({
          ...prevOptions,
          xaxis: {
            ...prevOptions.xaxis,
            categories: categories,
            labels: {
              style: {
                colors: Array(categories.length).fill(primary)
              }
            }
          }
        }));

        setLoading(false);
      } catch (err) {
        console.error('Error fetching voter turnout data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVoterTurnoutData();
  }, [primary]);

  // Update theme-related options
  useEffect(() => {
    setOptions(prevState => ({
      ...prevState,
      colors: [secondary, successDark], // Different colors for voters and votes
      yaxis: {
        ...prevState.yaxis,
        labels: {
          style: {
            colors: [primary]
          }
        }
      },
      grid: {
        borderColor: line
      },
      legend: {
        ...prevState.legend,
        labels: {
          colors: primary
        }
      },
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      }
    }));
  }, [mode, primary, line, secondary, successDark]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={350}>
        <p>Loading voter turnout data...</p>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={350}>
        <p>Error: {error}</p>
      </Box>
    );
  }

  return (
    <Box id="chart" sx={{ '& .apexcharts-legend': { flexDirection: matchDownMd ? 'column' : 'row' } }}>
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={350}
      />
    </Box>
  );
}
