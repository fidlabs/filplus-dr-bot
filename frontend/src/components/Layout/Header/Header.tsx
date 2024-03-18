import { AppBar, Toolbar, Typography } from '@mui/material';
import SelectAccount from '../SelectAccount';

const Header = () => {
  return (
    <AppBar position="static">
      <Toolbar sx={{display: 'flex', justifyContent: 'space-between'}}>
        <Typography variant="h6">
        </Typography>
        <SelectAccount/>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
