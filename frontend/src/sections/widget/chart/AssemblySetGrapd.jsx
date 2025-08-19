import { useEffect, useState, useCallback, useRef } from 'react';
import {
  useTheme,
  useMediaQuery,
  Grid,
  Menu,
  Stack,
  Typography,
  ListItemButton,
  CircularProgress,
  Button,
  Icon
} from '@mui/material';
import html2canvas from 'html2canvas';
import { ImportCurve } from 'iconsax-react';
import ReactApexChart from 'react-apexcharts';

import MainCard from 'components/MainCard';
import Dot from 'components/@extended/Dot';
import IconButton from 'components/@extended/IconButton';
import MoreIcon from 'components/@extended/MoreIcon';
import { ThemeMode } from 'config';

const getPieChartOptions = (parties, totalSeats) => ({
  chart: {
    type: 'donut',
    height: 320
  },
  labels: parties || [],
  legend: { show: false },
  plotOptions: {
    pie: {
      donut: {
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Assembly',
            formatter: () => totalSeats
          }
        }
      }
    }
  },
  dataLabels: {
    enabled: true,
    formatter: () => ''
  },
  tooltip: {
    y: {
      formatter: (value) => `${value} Seats`
    }
  }
});

function ApexDonutChart({ data, loading }) {
  const theme = useTheme();
  const downSM = useMediaQuery(theme.breakpoints.down('sm'));
  const mode = theme.palette.mode;
  const { primary } = theme.palette.text;
  const line = theme.palette.divider;
  const backColor = theme.palette.background.paper;

  const getPartyData = useCallback(() => {
    if (!data || !data.length) return { series: [], labels: [], stats: {} };

    const partyStats = {};
    data.forEach(item => {
      const partyName = item.party_id?.name || 'Others';
      if (!partyStats[partyName]) {
        partyStats[partyName] = { seats: 0, votes: 0 };
      }
      partyStats[partyName].seats++;
      partyStats[partyName].votes += parseInt(item.total_votes) || 0;
    });

    const sorted = Object.entries(partyStats).sort(([, a], [, b]) => b.seats - a.seats);
    const main = sorted.slice(0, 3);
    const others = sorted.slice(3).reduce(
      (acc, [, val]) => ({
        seats: acc.seats + val.seats,
        votes: acc.votes + val.votes
      }),
      { seats: 0, votes: 0 }
    );

    const finalData = [...main];
    if (others.seats > 0) finalData.push(['Others', others]);

    return {
      series: finalData.map(([, stats]) => stats.seats),
      labels: finalData.map(([name]) => name),
      stats: Object.fromEntries(finalData)
    };
  }, [data]);

  const { series, labels } = getPartyData();
  const totalSeats = series.reduce((a, b) => a + b, 0);

  const [options, setOptions] = useState(() =>
    getPieChartOptions(labels, totalSeats)
  );

  useEffect(() => {
    setOptions({
      ...getPieChartOptions(labels, totalSeats),
      colors: ['#FF9933', '#008FFB', '#00E396', '#775DD0'],
      xaxis: {
        labels: { style: { colors: [primary] } }
      },
      yaxis: {
        labels: { style: { colors: [primary] } }
      },
      grid: { borderColor: line },
      stroke: { colors: [backColor] },
      theme: { mode: mode === ThemeMode.DARK ? 'dark' : 'light' }
    });
  }, [labels, totalSeats, primary, line, backColor, mode]);

  return (
    <div style={{ position: 'relative', minHeight: downSM ? 280 : 320 }}>
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

export default function TotalIncome() {
  const contentRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2023);

  const downloadFullChart = useCallback(async () => {
    if (contentRef.current) {
      try {
        const canvas = await html2canvas(contentRef.current, {
          scale: 2,
          backgroundColor: null,
          logging: false
        });
        const link = document.createElement('a');
        link.download = `Assembly_Results_${selectedYear}_Full.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error('Error generating PNG:', err);
      }
    }
  }, [selectedYear]);

  const open = Boolean(anchorEl);

  const fetchYears = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/election-years`);
      const result = await res.json();
      const availableYears = result.data.map(d => d.year).sort((a, b) => b - a);
      setYears(availableYears);
      if (!selectedYear) {
        setSelectedYear(availableYears.includes(2023) ? 2023 : availableYears[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedYear]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/winning-candidates/graph?year=${selectedYear}`);
      const result = await res.json();
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  useEffect(() => {
    if (selectedYear) fetchData();
  }, [selectedYear, fetchData]);

  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const getPartyStats = useCallback(() => {
    if (!data.length) return { partyStats: {}, totalVotes: 0, totalSeats: 0 };
    const stats = {}, total = { seats: 0, votes: 0 };

    data.forEach(item => {
      const party = item.party_id?.name || 'Others';
      const votes = parseInt(item.total_votes) || 0;
      stats[party] = stats[party] || { seats: 0, votes: 0 };
      stats[party].seats++;
      stats[party].votes += votes;
      total.seats++;
      total.votes += votes;
    });

    const sorted = Object.entries(stats).sort(([, a], [, b]) => b.seats - a.seats);
    const top3 = sorted.slice(0, 3);
    const others = sorted.slice(3).reduce(
      (acc, [, val]) => ({
        seats: acc.seats + val.seats,
        votes: acc.votes + val.votes
      }),
      { seats: 0, votes: 0 }
    );

    const final = Object.fromEntries(top3);
    if (others.seats > 0) final['Others'] = others;

    for (const key in final) {
      final[key].seatPercentage = ((final[key].seats / total.seats) * 100).toFixed(1);
      final[key].votePercentage = ((final[key].votes / total.votes) * 100).toFixed(1);
    }

    return { partyStats: final, totalVotes: total.votes, totalSeats: total.seats };
  }, [data]);

  const { partyStats, totalVotes, totalSeats } = getPartyStats();

  return (
    <MainCard>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              Total Seats by Assembly in Madhya Pradesh ({selectedYear})
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={downloadFullChart}
                startIcon={<ImportCurve />}
              >

              </Button>
              <IconButton onClick={handleClick}>
                <MoreIcon />
              </IconButton>
              <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                {years.map((year) => (
                  <ListItemButton
                    key={year}
                    selected={year === selectedYear}
                    onClick={() => {
                      setSelectedYear(year);
                      handleClose();
                    }}
                  >
                    {year}
                  </ListItemButton>
                ))}
              </Menu>
            </Stack>
          </Stack>
        </Grid>

        <div ref={contentRef}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              {error ? (
                <Typography color="error">{error}</Typography>
              ) : (
                <ApexDonutChart data={data} loading={loading} />
              )}
            </Grid>

            <Grid item xs={6}>
              <MainCard content={false}>
                <Stack alignItems="center" sx={{ p: 2 }} spacing={0.5}>
                  <Typography variant="h6">Total Assembly</Typography>
                  <Typography variant="h4">{totalSeats}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Votes: {totalVotes.toLocaleString()}
                  </Typography>
                </Stack>
              </MainCard>
            </Grid>

            {Object.entries(partyStats).map(([name, stat], idx) => (
              <Grid item xs={12} sm={6} key={name}>
                <MainCard content={false}>
                  <Stack sx={{ p: 2 }} spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Dot
                        componentDiv
                        color={
                          name === 'Indian National Congress' ? '#000080'
                            : name === 'Bharatiya Janata Party' ? '#FF9933'
                              : idx === 2 ? 'success' : 'secondary'
                        }
                      />
                      <Typography>
                        {name === 'Bharatiya Janata Party' ? 'BJP'
                          : name === 'Indian National Congress' ? 'INC'
                            : name === 'Bharat Adivasi Party' ? 'BAP'
                              : name}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1">
                      {stat.seats} (<Typography component="span" variant="caption">{stat.seatPercentage}%</Typography>)
                    </Typography>
                    <Typography variant="caption">
                      Votes: {stat.votes.toLocaleString()} ({stat.votePercentage}%)
                    </Typography>
                  </Stack>
                </MainCard>
              </Grid>
            ))}
          </Grid>
        </div>
      </Grid>
    </MainCard>
  );
}

