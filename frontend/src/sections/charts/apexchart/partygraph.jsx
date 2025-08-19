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

export default function PartyAssemblyCountChart() {
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
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(''); // Will set after fetching years

  // Fetch years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const yearsResponse = await axios.get(`${import.meta.env.VITE_APP_API_URL}/election-years`);
        const yearsData = yearsResponse.data.data;
        setYears(yearsData);
        if (yearsData && yearsData.length > 0) {
          // Try to find year 2023
          const year2023 = yearsData.find(y => y.year === 2023);
          if (year2023) {
            setSelectedYear(year2023._id);
          } else {
            setSelectedYear(yearsData[0]._id); // Fallback to first year
          }
        }
      } catch (err) {
        setError('Failed to fetch years');
        setLoading(false);
      }
    };
    fetchYears();
  }, []);

  // Fetch party-assembly-count data when selectedYear changes
  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    setError(null);
    const fetchPartyAssemblyCount = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_APP_API_URL}/winning-candidates/party-assembly-count`, {
          params: { year: selectedYear }
        });
        const data = response.data.data;
        const categories = data.map(item => item.party_name || 'Unknown');
        const assemblyCounts = data.map(item => item.assembly_count);

        // Generate a color for each party (use a palette or fallback to random)
        const palette = [
          '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
          '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
          '#00b894', '#fdcb6e', '#e17055', '#0984e3', '#6c5ce7',
          '#00cec9', '#fd79a8', '#636e72', '#b2bec3', '#fab1a0'
        ];
        let colors = categories.map((_, idx) => palette[idx % palette.length]);

        setSeries([
          {
            name: 'Assemblies Won',
            data: assemblyCounts
          }
        ]);
        setOptions(prevOptions => ({
          ...prevOptions,
          colors: colors,
          xaxis: {
            ...prevOptions.xaxis,
            categories: categories,
            labels: {
              style: {
                colors: Array(categories.length).fill(primary)
              }
            }
          },
          yaxis: {
            ...prevOptions.yaxis,
            title: { text: 'Assemblies Won' }
          }
        }));
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch party assembly count');
        setLoading(false);
      }
    };
    fetchPartyAssemblyCount();
  }, [selectedYear, primary]);

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
        <p>Loading party assembly count data...</p>
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
    <Box>
      <Box mb={2} display="flex" alignItems="center">
        <label htmlFor="year-select" style={{ marginRight: 8 }}>Year:</label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
        >
          {years.map(year => (
            <option key={year._id} value={year._id}>{year.year}</option>
          ))}
        </select>
      </Box>
      <Box id="chart" sx={{ '& .apexcharts-legend': { flexDirection: matchDownMd ? 'column' : 'row' } }}>
        <ReactApexChart
          options={options}
          series={series}
          type="bar"
          height={350}
        />
      </Box>
    </Box>
  );
}
