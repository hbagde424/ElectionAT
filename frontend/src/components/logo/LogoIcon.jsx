// material-ui
import { useTheme } from '@mui/material/styles';
import logo from './LogoRemovebg.png';
/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * import logoIconDark from 'assets/images/logo-icon-dark.svg';
 * import logoIcon from 'assets/images/logo-icon.svg';
 *
 */

// ==============================|| LOGO ICON SVG ||============================== //

export default function LogoIcon() {
  const theme = useTheme();

  return (
   <img src={logo} alt="logo" width="auto" height="100" />
  );
}

