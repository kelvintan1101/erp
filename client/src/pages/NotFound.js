import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Typography, Button, Box, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

const NotFound = () => {
  return (
    <Paper sx={{ py: 6, px: 4, textAlign: 'center' }}>
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" paragraph>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      <Box mt={4}>
        <Button
          variant="contained"
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Paper>
  );
};

export default NotFound; 