// material-ui
import { useTheme } from '@mui/material/styles';

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
    <img
      src="https://cdn.pixabay.com/photo/2023/09/14/10/27/face-logo-8252748_1280.png"
      alt="logo"
      width="100"
      height="100"
    />
  );
}
