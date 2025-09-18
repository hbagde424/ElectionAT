import PropTypes from 'prop-types';
import { memo } from 'react';

// material-ui
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';

// project-import
import ControlPanelStyled from 'components/third-party/map/ControlPanelStyled';

// ==============================|| MAPBOX - THEME ||============================== //

function ControlPanel({ themes, selectTheme, onChangeTheme }) {
  // Defensive check to handle undefined/null themes
  const safeThemes = themes && typeof themes === 'object' ? themes : {};
  const themeKeys = Object.keys(safeThemes);
  
  // If no themes are available, return null or a simple message
  if (themeKeys.length === 0) {
    return (
      <ControlPanelStyled>
        <Typography gutterBottom variant="subtitle2">
          No themes available
        </Typography>
      </ControlPanelStyled>
    );
  }

  return (
    <ControlPanelStyled>
      <Typography gutterBottom variant="subtitle2">
        Select variants:
      </Typography>

      <RadioGroup value={selectTheme} onChange={(event, newValue) => onChangeTheme(newValue)}>
        {themeKeys.map((item) => (
          <FormControlLabel key={item} value={item} control={<Radio size="small" />} label={item} sx={{ textTransform: 'capitalize' }} />
        ))}
      </RadioGroup>
    </ControlPanelStyled>
  );
}

export default memo(ControlPanel);

ControlPanel.propTypes = { themes: PropTypes.object, selectTheme: PropTypes.string, onChangeTheme: PropTypes.func };

