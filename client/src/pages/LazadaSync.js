import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Paper, 
  Box, 
  List, 
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import LockIcon from '@mui/icons-material/Lock';
import { inventoryService, lazadaService } from '../services/api';

const LazadaSync = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncResults, setSyncResults] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Check for auth=success in URL params and auth status
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check URL param
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === 'success') {
        setIsAuthorized(true);
        // Clear the parameter from URL without reload
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Check with backend
        try {
          const authStatus = await lazadaService.checkAuthStatus();
          setIsAuthorized(authStatus);
        } catch (error) {
          console.error('Error checking auth status:', error);
        }
      }
      
      setAuthChecking(false);
    };
    
    checkAuthStatus();
  }, []);

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await inventoryService.getAll();
        setInventory(data);
        
        // Find the most recent sync time
        const mostRecentSync = data
          .filter(item => item.lastSync)
          .sort((a, b) => new Date(b.lastSync) - new Date(a.lastSync))[0];
        
        if (mostRecentSync && mostRecentSync.lastSync) {
          setLastSyncTime(new Date(mostRecentSync.lastSync));
        }
        
        setLoading(false);
      } catch (error) {
        setError('Failed to load inventory data');
        setLoading(false);
        console.error('Error fetching inventory:', error);
      }
    };

    fetchInventory();
  }, []);

  // Function to sync all inventory with Lazada
  const handleSyncAll = async () => {
    setSyncLoading(true);
    setSyncResults(null);
    setError(null);
    
    try {
      const response = await lazadaService.syncInventory();
      setSyncResults(response.results);
      setLastSyncTime(new Date());
      
      // Refresh inventory data
      const data = await inventoryService.getAll();
      setInventory(data);
    } catch (error) {
      setError('Failed to sync inventory with Lazada: ' + error.message);
      console.error('Error syncing inventory:', error);
    } finally {
      setSyncLoading(false);
    }
  };
  
  // Function to handle authorization with Lazada
  const handleAuthorize = () => {
    window.location.href = lazadaService.getAuthUrl();
  };

  // Summary counts
  const summaryStats = {
    total: inventory.length,
    synced: inventory.filter(item => item.syncStatus === 'synced').length,
    pending: inventory.filter(item => item.syncStatus === 'pending').length,
    error: inventory.filter(item => item.syncStatus === 'error').length,
    notSynced: inventory.filter(item => item.syncStatus === 'not_synced').length
  };

  if (loading || authChecking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Lazada Sync</Typography>
        {isAuthorized ? (
          <Button
            variant="contained"
            color="primary"
            startIcon={<SyncIcon />}
            onClick={handleSyncAll}
            disabled={syncLoading}
          >
            {syncLoading ? 'Syncing...' : 'Sync All Products'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<LockIcon />}
            onClick={handleAuthorize}
          >
            Authorize with Lazada
          </Button>
        )}
      </Box>

      {!isAuthorized && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You need to authorize this application with your Lazada account before syncing products.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Last Sync Time */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          {lastSyncTime 
            ? `Last synchronized: ${lastSyncTime.toLocaleString()}` 
            : 'Products have never been synchronized with Lazada'}
        </Typography>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Products
              </Typography>
              <Typography variant="h4">{summaryStats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Synced
              </Typography>
              <Typography variant="h4" color="success.main">{summaryStats.synced}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Not Synced
              </Typography>
              <Typography variant="h4" color="warning.main">
                {summaryStats.notSynced + summaryStats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Errors
              </Typography>
              <Typography variant="h4" color="error.main">{summaryStats.error}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sync Results */}
      {syncResults && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Sync Results
          </Typography>
          <List>
            {syncResults.map((result, index) => (
              <React.Fragment key={result.sku}>
                <ListItem>
                  <ListItemIcon>
                    {result.status === 'success' ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={result.sku} 
                    secondary={
                      result.status === 'success' 
                        ? 'Successfully synced' 
                        : `Error: ${result.error?.message || 'Unknown error'}`
                    }
                  />
                </ListItem>
                {index < syncResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {/* Inventory Sync Status */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Inventory Sync Status
        </Typography>
        <List>
          {inventory.map((item, index) => (
            <React.Fragment key={item._id}>
              <ListItem>
                <ListItemIcon>
                  {item.syncStatus === 'synced' && <CheckCircleIcon color="success" />}
                  {item.syncStatus === 'error' && <ErrorIcon color="error" />}
                  {item.syncStatus === 'pending' && <SyncIcon color="primary" />}
                  {item.syncStatus === 'not_synced' && <WarningIcon color="warning" />}
                </ListItemIcon>
                <ListItemText 
                  primary={`${item.name} (SKU: ${item.sku})`} 
                  secondary={
                    <>
                      <Box component="span" sx={{ display: 'block' }}>
                        Quantity: {item.quantity} | Price: ${item.price.toFixed(2)}
                      </Box>
                      {item.lastSync && (
                        <Box component="span" sx={{ display: 'block' }}>
                          Last synced: {new Date(item.lastSync).toLocaleString()}
                        </Box>
                      )}
                      {item.syncErrors && item.syncErrors.length > 0 && (
                        <Box component="span" sx={{ display: 'block', color: 'error.main' }}>
                          Errors: {item.syncErrors.join(', ')}
                        </Box>
                      )}
                    </>
                  }
                />
                <Chip 
                  label={item.syncStatus} 
                  color={
                    item.syncStatus === 'synced' ? 'success' : 
                    item.syncStatus === 'error' ? 'error' :
                    item.syncStatus === 'pending' ? 'primary' : 'default'
                  }
                  size="small"
                />
              </ListItem>
              {index < inventory.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </div>
  );
};

export default LazadaSync; 