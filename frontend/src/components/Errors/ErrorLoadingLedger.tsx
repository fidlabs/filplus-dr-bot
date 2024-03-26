import { Typography, Link, Box, List, ListItem, ListItemText } from '@mui/material';
import React from 'react';

const link = "https://support.ledger.com/hc/en-us/articles/115005165269-Fix-USB-connection-issues-with-Ledger-Live?support=true"

const ErrorLoadingLedger = () => {
  return (
    <Box textAlign="center" p={3}>
      <Typography variant="h5" gutterBottom>
        Follow the steps below:
      </Typography>
      <List>
        <ListItem disablePadding>
          <ListItemText primary="Remember to use Chrome." sx={{ textAlign: 'center' }} />
        </ListItem>
        <ListItem disablePadding>
          <ListItemText primary="Connect your Ledger device." sx={{ textAlign: 'center' }} />
        </ListItem>
        <ListItem disablePadding>
          <ListItemText primary="Unlock your Ledger device." sx={{ textAlign: 'center' }} />
        </ListItem>
        <ListItem disablePadding>
          <ListItemText primary="Open the Filecoin app." sx={{ textAlign: 'center' }} />
        </ListItem>
      </List>
      <Link href={link} underline="always" target="_blank" rel="noreferrer">
        Troubleshooting
      </Link>
    </Box>
  );
};

export default ErrorLoadingLedger;
