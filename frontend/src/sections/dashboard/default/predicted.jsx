import Grid from '@mui/material/Grid';
import MapContainerStyled from 'components/third-party/map/MapContainerStyled';
import ChangeTheme from 'sections/maps/Predicted';
import { useTheme } from '@mui/material/styles';
import MainCard from 'components/MainCard';

const mapConfiguration = {
  mapboxAccessToken: import.meta.env.VITE_APP_MAPBOX_ACCESS_TOKEN,
  minZoom: 1
};

const MAPBOX_THEMES = {
//   light: 'mapbox://styles/mapbox/light-v10',
//   dark: 'mapbox://styles/mapbox/dark-v10',
//   streets: 'mapbox://styles/mapbox/streets-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v11',
//   satellite: 'mapbox://styles/mapbox/satellite-v9',
//   satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11'
};

export default function MapComponent() {
    const theme = useTheme();

    return (
        <Grid item xs={12}>
            <MainCard title="Predict map for 2028">
                <MapContainerStyled>
                    <ChangeTheme {...mapConfiguration} themes={MAPBOX_THEMES} />
                </MapContainerStyled>
            </MainCard>
        </Grid>
    );
}
