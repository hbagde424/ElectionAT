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
    height: 320,
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false
      },
      export: {
        csv: {
          filename: `election_results_${new Date().toISOString().slice(0,10)}`,
          columnDelimiter: ',',
          headerCategory: 'Category',
          headerValue: 'Value',
          // Custom data formatter for CSV
          formatter: function(value, { seriesIndex, w }) {
            // First add the pie chart data
            let csvData = [
              ['Party', 'Seats', 'Seat Percentage', 'Votes', 'Vote Percentage'],
              ...Object.entries(partyStats).map(([party, stats]) => [
                party,
                stats.seats,
                `${stats.seatPercentage}%`,
                stats.votes,
                `${stats.votePercentage}%`
              ]),
              [],
              ['Summary', 'Value'],
              ['Total Seats', totalSeats],
              ['Total Votes', totalVotes],
              ['Total Booths', totalBooths]
            ];
            
            return csvData.map(row => row.join(',')).join('\n');
          }
        },
        svg: {
          filename: 'party_seats_chart'
        },
        png: {
          filename: 'party_seats_chart'
        }
      }
    }
  },
  labels: parties || ['INC', 'BJP', 'BAP', 'OTHERS'],
  legend: {
    show: false
  },
  dataLabels: {
    enabled: true,
    formatter: function (val, opts) {
      return ''
    }
  },
  tooltip: {
    y: {
      formatter: function (value) {
        return value + ' Seats'
      }
    }
  }
});


// ==============================|| CHART ||============================== //

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
    if (!data || !data.length) return { series: [], labels: [] };

    const partyStats = {};

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
      partyStats[partyName].votes += parseInt(item.votes) || 0;
    });

    // Sort parties by seats in descending order
    const sortedParties = Object.entries(partyStats)
      .sort(([, a], [, b]) => b.seats - a.seats);

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
      labels: processedData.map(([name]) => name),
      stats: Object.fromEntries(processedData)
    };
  }, [data]);

  const { series, labels, stats } = getPartyData();
  const [options, setOptions] = useState(getPieChartOptions(labels));

  useEffect(() => {
    setOptions(getPieChartOptions(labels));
  }, [labels]);

  useEffect(() => {
    const saffron = '#FF9933'; // Saffron color for BJP
    const navyBlue = '#000080'; // Navy blue for INC
    const green = '#138808'; // Green for other parties
    const primaryLighter = theme.palette.primary[100];

    setOptions((prevState) => ({
      ...prevState,
      colors: [navyBlue, saffron, green, primaryLighter],
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
    }));
  }, [mode, primary, line, grey200, backColor, theme]);

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

// ==============================|| CHART WIDGETS - TOTAL SEATS BY PARTY ||============================== //

export default function TotalSeatsByParty() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2023); // Default year set to 2023
  const [totalBooths, setTotalBooths] = useState(0);

  const open = Boolean(anchorEl);

  // Fetch available years
  const fetchYears = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/election-years');
      if (!response.ok) {
        throw new Error('Failed to fetch election years');
      }
      const result = await response.json();
      const availableYears = result.data.map(item => item.year).sort((a, b) => b - a);
      setYears(availableYears);
      // If 2023 is available, set it as selected, otherwise use the first available year
      const defaultYear = availableYears.includes(2023) ? 2023 : availableYears[0];
      if (availableYears.length > 0 && !selectedYear) {
        setSelectedYear(defaultYear);
      }
    } catch (err) {
      console.error('Error fetching years:', err);
    }
  }, [selectedYear]);

  const fetchWinningParties = useCallback(async () => {
    try {
      setLoading(true);
      const yearParam = selectedYear ? `?year=${selectedYear}` : '';
      const response = await fetch(`http://localhost:5000/api/winning-parties/graph${yearParam}`);
      if (!response.ok) {
        throw new Error('Failed to fetch winning parties');
      }
      const result = await response.json();
      setData(result.data);
      
      // Fetch total booths count
      const boothsResponse = await fetch(`http://localhost:5000/api/total-booths${yearParam}`);
      if (boothsResponse.ok) {
        const boothsData = await boothsResponse.json();
        setTotalBooths(boothsData.totalBooths || 0);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  useEffect(() => {
    if (selectedYear) {
      fetchWinningParties();
    }
  }, [selectedYear, fetchWinningParties]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Calculate total seats for each party
  const getPartyStats = useCallback(() => {
    if (!data || !data.length) return { partyStats: {}, totalVotes: 0, totalSeats: 0 };

    const stats = {};
    let totalSeats = 0;
    let totalVotes = 0;

    // First pass: collect all stats
    data.forEach(item => {
      const partyName = item.party_id?.name || 'Others';
      const votes = parseInt(item.votes) || 0;

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

    return { partyStats: result, totalVotes, totalSeats };
  }, [data]);

  const { partyStats, totalVotes, totalSeats } = getPartyStats();

  return (
    <MainCard >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography variant="h5">Total Seats by Booths in Gandhwani {selectedYear ? `(${selectedYear})` : ''}</Typography>
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

        {/* Total Votes and Booths Card */}
        <Grid item xs={12} md={6}>
          <MainCard content={false} border={false} sx={{ bgcolor: 'background.default' }}>
            <Stack alignItems="center" sx={{ p: 2 }} spacing={0.5}>
              <Typography variant="h6">Total Votes</Typography>
              <Typography variant="h4">{totalVotes.toLocaleString()}</Typography>
              
            </Stack>
          </MainCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <MainCard content={false} border={false} sx={{ bgcolor: 'background.default' }}>
            <Stack alignItems="center" sx={{ p: 2 }} spacing={0.5}>
              <Typography variant="h6">Total Booths</Typography>
              <Typography variant="h4">{totalSeats.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">
                In Gandhwani constituency
              </Typography>
            </Stack>
          </MainCard>
        </Grid>
        
        {Object.entries(partyStats).map(([partyName, stats], index) => (
          <Grid item xs={12} sm={6} key={partyName}>
            <MainCard content={false} border={false} sx={{ bgcolor: 'background.default' }}>
              <Stack alignItems="flex-start" sx={{ p: 2 }} spacing={0.5}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Dot
                    componentDiv
                    color={
                      partyName === 'Indian National Congress' ? 'primary' :
                        partyName === 'Bharatiya Janata Party' ? 'warning' :
                          index === 2 ? 'success' : 'secondary'
                    }
                  />
                  <Typography>
                    {partyName === 'Bharatiya Janata Party' ? 'BJP' :
                      partyName === 'Indian National Congress' ? 'INC' :
                        partyName === 'Bharat Adivasi Party' ? 'BAP' :
                          partyName}
                  </Typography>
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