import { useEffect, useState, useCallback } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';

// third-party
import ReactApexChart from 'react-apexcharts';

// project-imports
import MainCard from 'components/MainCard';
import Dot from 'components/@extended/Dot';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';
import { ThemeMode } from 'config';


// chart options
const getPieChartOptions = (parties) => ({
  chart: {
    type: 'donut',
    height: 320
  },
  labels: parties || ['INC', 'BJP', 'BSP', 'OTHERS'],
  legend: {
    show: false
  },
  dataLabels: {
    enabled: true,
    formatter: function (val, opts) {
      return opts.w.config.labels[opts.seriesIndex]
    }
  },
  tooltip: {
    enabled: true,
    y: {
      formatter: function (value, { series, seriesIndex, w }) {
        const label = w.config.labels[seriesIndex];
        const total = series.reduce((a, b) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);
        return `${label}: ${value} Seats (${percentage}%)`
      }
    }
  },
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Seats',
            formatter: function (w) {
              const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
              return total
            }
          }
        }
      }
    }
  }
});

// ==============================|| CHART ||============================== //

const PARTY_COLORS = {
  'Bharatiya Janata Party': '#FF9933', // Saffron for BJP
  'BJP': '#FF9933',
  'Indian National Congress': '#000080', // Navy Blue for INC
  'INC': '#000080',
  'Bahujan Samaj Party': '#0000FF', // Blue for BSP
  'BSP': '#0000FF',
  'Others': '#6b7280' // Gray for Others
};

function ApexDonutChart({ data, loading }) {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));

  const mode = theme.palette.mode;

  const { primary } = theme.palette.text;
  const line = theme.palette.divider;
  const grey200 = theme.palette.secondary[200];
  const backColor = theme.palette.background.paper;

  // Process the data to get party-wise seat counts
  const getPartyData = useCallback(() => {
    if (!data || !data.length) return { series: [], labels: [], originalNames: [] };

    const partyStats = {};
    const partyOrder = ['Bharatiya Janata Party', 'Indian National Congress']; // Define preferred order
    const partyDisplayNames = {
      'Bharatiya Janata Party': 'BJP',
      'Indian National Congress': 'INC'
    };

    // Group data by party
    data.forEach(item => {
      const partyName = item.party_id?.name || 'Others';
      if (!partyStats[partyName]) {
        partyStats[partyName] = {
          seats: 0,
          votes: 0
        };
      }
      partyStats[partyName].seats++;
      partyStats[partyName].votes += parseInt(item.total_votes) || 0;
    });

    // Sort parties by custom order first, then by seats
    const sortedParties = Object.entries(partyStats)
      .sort(([nameA, statsA], [nameB, statsB]) => {
        // First, try to sort by the preferred order
        const indexA = partyOrder.indexOf(nameA);
        const indexB = partyOrder.indexOf(nameB);

        // If both parties are in the preferred order, use that order
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        // If one party is in the preferred order, it should come first
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        // For parties not in the preferred order, sort by seats
        return statsB.seats - statsA.seats;
      });

    // Get top 3 parties and group rest as Others
    const mainParties = sortedParties.slice(0, 3);
    const others = sortedParties.slice(3).reduce(
      (acc, [, stats]) => ({
        seats: acc.seats + stats.seats,
        votes: acc.votes + stats.votes
      }),
      { seats: 0, votes: 0 }
    );

    const processedData = [...mainParties];
    if (others.seats > 0) {
      processedData.push(['Others', others]);
    }

    return {
      series: processedData.map(([, stats]) => stats.seats),
      labels: processedData.map(([name]) => partyDisplayNames[name] || name),
      originalNames: processedData.map(([name]) => name),
      stats: Object.fromEntries(processedData)
    };
  }, [data]); const { series, labels, originalNames, stats } = getPartyData();
  const [options, setOptions] = useState(getPieChartOptions(labels));

  useEffect(() => {
    // Map colors based on original party names and assign unique colors for others
    const usedColors = new Set();
    const chartColors = originalNames.map(name => {
      // First check if we have a direct color match
      if (PARTY_COLORS[name]) {
        usedColors.add(PARTY_COLORS[name]);
        return PARTY_COLORS[name];
      }

      // For BSP, use a specific color
      if (name === 'Bahujan Samaj Party' || name === 'BSP') {
        return '#0000FF'; // Blue for BSP
      }

      // For other parties, use a rotating set of distinct colors
      const otherColors = ['#22c55e', '#f97316', '#06b6d4', '#ec4899'].filter(color => !usedColors.has(color));
      const selectedColor = otherColors[0] || theme.palette.success.main;
      usedColors.add(selectedColor);
      return selectedColor;
    });

    setOptions({
      ...getPieChartOptions(labels),
      colors: chartColors,
      xaxis: {
        labels: {
          style: {
            colors: [primary, primary, primary, primary, primary, primary, primary]
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: [primary]
          }
        }
      },
      grid: {
        borderColor: line
      },
      stroke: {
        colors: [backColor]
      },
      theme: {
        mode: mode === ThemeMode.DARK ? 'dark' : 'light'
      }
    });
  }, [mode, primary, line, grey200, backColor, theme, labels, originalNames]);

  return (
    <div id="chart" style={{ position: 'relative', minHeight: downSM ? 280 : 320 }}>
      {loading ? (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <CircularProgress />
        </div>
      ) : (
        <ReactApexChart options={options} series={series} type="donut" height={downSM ? 280 : 320} />
      )}
    </div>
  );
}

// ==============================|| CHART WIDGETS - TOTAL INCOME ||============================== //

export default function TotalIncome() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);

  const open = Boolean(anchorEl);

  // Fetch available years
  const fetchYears = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`);
      if (!response.ok) {
        throw new Error('Failed to fetch election years');
      }
      const result = await response.json();
      const availableYears = result.data.map(item => item.year).sort((a, b) => b - a);
      setYears(availableYears);
      if (availableYears.length > 0 && !selectedYear) {
        setSelectedYear(availableYears[0]);
      }
    } catch (err) {
      console.error('Error fetching years:', err);
    }
  }, [selectedYear]);

  const fetchWinningCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const yearParam = selectedYear ? `?year=${selectedYear}` : '';
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates/graph${yearParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch winning candidates');
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching winning candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  useEffect(() => {
    if (selectedYear) {
      fetchWinningCandidates();
    }
  }, [selectedYear, fetchWinningCandidates]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Calculate total seats for each party
  const getPartyStats = useCallback(() => {
    if (!data || !data.length) return {};

    const stats = {};
    let totalSeats = 0;
    let totalVotes = 0;

    // First pass: collect all stats
    data.forEach(item => {
      const partyName = item.party_id?.name || 'Others';
      const votes = parseInt(item.total_votes) || 0;

      if (!stats[partyName]) {
        stats[partyName] = { seats: 0, votes: 0 };
      }
      stats[partyName].seats++;
      stats[partyName].votes += votes;
      totalSeats++;
      totalVotes += votes;
    });

    // Sort parties by seats and get top 3
    const sortedParties = Object.entries(stats)
      .sort(([, a], [, b]) => b.seats - a.seats);

    const mainParties = sortedParties.slice(0, 3);
    const others = sortedParties.slice(3).reduce(
      (acc, [, stats]) => ({
        seats: acc.seats + stats.seats,
        votes: acc.votes + stats.votes
      }),
      { seats: 0, votes: 0 }
    );

    const result = Object.fromEntries(mainParties);
    if (others.seats > 0) {
      result['Others'] = others;
    }

    // Add percentages
    Object.values(result).forEach(party => {
      party.seatPercentage = ((party.seats / totalSeats) * 100).toFixed(1);
      party.votePercentage = ((party.votes / totalVotes) * 100).toFixed(1);
    });

    return result;
  }, [data]); const partyStats = getPartyStats();

  return (
    <MainCard>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="h5">Total Seats {selectedYear ? `(${selectedYear})` : ''}</Typography>
            <IconButton
              color="secondary"
              id="wallet-button"
              aria-controls={open ? 'wallet-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            >
              <MoreIcon />
            </IconButton>
            <Menu
              id="wallet-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{ 'aria-labelledby': 'wallet-button', sx: { p: 1.25, minWidth: 150 } }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {years.map((year) => (
                <ListItemButton
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    handleClose();
                  }}
                  selected={selectedYear === year}
                >
                  {year}
                </ListItemButton>
              ))}
            </Menu>
          </Stack>
        </Grid>
        <Grid item xs={12}>
          {error ? (
            <Typography color="error" align="center">Error: {error}</Typography>
          ) : (
            <ApexDonutChart data={data} loading={loading} />
          )}
        </Grid>
        {Object.entries(partyStats).map(([partyName, stats], index) => (
          <Grid item xs={12} sm={6} key={partyName}>
            <MainCard content={false} border={false} sx={{ bgcolor: 'background.default' }}>
              <Stack alignItems="flex-start" sx={{ p: 2 }} spacing={0.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Dot
                    componentDiv
                    color={
                      PARTY_COLORS[partyName] ||
                      ['#22c55e', '#f97316', '#06b6d4', '#ec4899'][index % 4] ||
                      'secondary'
                    }
                  />
                  <Typography>{partyName === 'Bharatiya Janata Party' ? 'BJP' :
                    partyName === 'Indian National Congress' ? 'INC' :
                      partyName === 'Bahujan Samaj Party' ? 'BSP' :
                        partyName}</Typography>
                </Stack>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {stats.seats}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.25 }}
                  >
                    ({stats.seatPercentage}%)
                  </Typography>
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.25 }}
                >
                  Votes: {stats.votes.toLocaleString()} ({stats.votePercentage}%)
                </Typography>
              </Stack>
            </MainCard>
          </Grid>
        ))}
      </Grid>
    </MainCard>
  );
}

