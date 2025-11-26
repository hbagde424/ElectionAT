import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

// third-party
import ReactApexChart from 'react-apexcharts';

import { ThemeMode } from 'config';

const columnChartOptions = {
  chart: {
    type: 'bar',
    height: 350
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
      text: 'Votes Received'
    }
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    y: {
      formatter(val) {
        return val.toLocaleString();
      }
    }
  },
  legend: {
    show: true,
    fontFamily: `Inter var`,
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
          show: false
        }
      }
    }
  ]
};

export default function VoterTurnoutChart() {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));

  const { primary } = theme.palette.text;
  const line = theme.palette.divider;
  const grey200 = theme.palette.secondary[200];

  const secondary = theme.palette.primary[700];
  const primaryMain = theme.palette.primary.main;
  const successDark = theme.palette.success.main;

  const [series, setSeries] = useState([]);
  const [options, setOptions] = useState(columnChartOptions);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [electionData, setElectionData] = useState(null);

  useEffect(() => {
    const fetchElectionData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates/assembly/687a036493d4235d02ea1d11/year/68774484dff1e9c4616e78df`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setElectionData(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchElectionData();
  }, []);

  useEffect(() => {
    if (electionData && electionData.all_candidates) {
      // Use 'Unknown Candidate' if candidate_name is null
      const categories = electionData.all_candidates.map((candidate, idx) => candidate.candidate_name || `Unknown ${idx + 1}`);
      const votesData = electionData.all_candidates.map(candidate => candidate.votes_received);
      const partyColors = electionData.all_candidates.map(candidate =>
        candidate.party_name === electionData.winner.party_name ? successDark : secondary
      );

      setSeries([{
        name: 'Votes Received',
        data: votesData
      }]);

      setOptions(prevState => ({
        ...prevState,
        colors: partyColors,
        xaxis: {
          ...prevState.xaxis,
          categories: categories,
          labels: {
            style: {
              colors: categories.map(() => primary)
            }
          }
        },
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
          labels: {
            colors: 'secondary.main'
          }
        },
        theme: {
          mode: mode === ThemeMode.DARK ? 'dark' : 'light'
        },
        annotations: {
          xaxis: [{
            x: electionData.winner.candidate_name || 'Unknown Candidate 1',
            borderColor: primaryMain,
            label: {
              borderColor: primaryMain,
              style: {
                color: '#fff',
                background: primaryMain
              },
              text: 'Winner'
            }
          }]
        }
      }));
    }
  }, [electionData, mode, primary, line, grey200, secondary, primaryMain, successDark]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={350}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box height={350}>
        <Alert severity="error">{error}</Alert>
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
