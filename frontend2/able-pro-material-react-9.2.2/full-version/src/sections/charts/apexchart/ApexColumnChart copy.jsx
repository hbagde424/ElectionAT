import { useEffect, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';

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
    categories: [] // updated in useEffect
  },
  yaxis: {
    title: {
      text: '% Voter Turnout'
    }
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    y: {
      formatter(val) {
        return `${val}%`;
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

  const constituencies = [
    'Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain',
    'Rewa', 'Satna', 'Sagar', 'Chhindwara', 'Ratlam'
  ];

  const [series] = useState([
    {
      name: '2014 Turnout',
      data: [60, 62, 58, 65, 59, 61, 60, 64, 66, 63]
    },
    {
      name: '2019 Turnout',
      data: [68, 70, 64, 69, 63, 67, 66, 71, 73, 69]
    }
  ]);

  const [options, setOptions] = useState({
    ...columnChartOptions,
    xaxis: {
      categories: constituencies
    }
  });

  useEffect(() => {
    setOptions((prevState) => ({
      ...prevState,
      colors: [secondary, primaryMain, successDark],
      xaxis: {
        ...prevState.xaxis,
        categories: constituencies,
        labels: {
          style: {
            colors: constituencies.map(() => primary)
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
      }
    }));
  }, [mode, primary, line, grey200, secondary, primaryMain, successDark]);

  return (
    <Box id="chart" sx={{ '& .apexcharts-legend': { flexDirection: matchDownMd ? 'column' : 'row' } }}>
      <ReactApexChart options={options} series={series} type="bar" height={350} />
    </Box>
  );
}
