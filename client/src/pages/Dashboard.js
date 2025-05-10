import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Paper,
  Stack,
  Box,
  CircularProgress
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarningIcon from '@mui/icons-material/Warning';
import SyncIcon from '@mui/icons-material/Sync';
import { inventoryService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    syncedItems: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const items = await inventoryService.getAll();
        
        setStats({
          totalItems: items.length,
          lowStockItems: items.filter(item => item.quantity < 5).length,
          syncedItems: items.filter(item => item.syncStatus === 'synced').length,
          loading: false,
          error: null
        });
      } catch (error) {
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load inventory data'
        }));
        console.error('Error loading dashboard data:', error);
      }
    };
    
    fetchData();
  }, []);

  if (stats.loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (stats.error) {
    return (
      <Paper sx={{ p: 3, bgcolor: '#fff9f9', color: 'error.main', mt: 2 }}>
        <Typography variant="h6">Error</Typography>
        <Typography>{stats.error}</Typography>
      </Paper>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={4}>
        {/* Total Inventory Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                Total Inventory
              </Typography>
              <Typography variant="h3" component="div">
                {stats.totalItems}
              </Typography>
              <Box mt={1} display="flex" alignItems="center">
                <InventoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">Items in system</Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/inventory">
                View All Inventory
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Low Stock Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                Low Stock Alert
              </Typography>
              <Typography variant="h3" component="div" color={stats.lowStockItems > 0 ? "error" : "inherit"}>
                {stats.lowStockItems}
              </Typography>
              <Box mt={1} display="flex" alignItems="center">
                <WarningIcon color={stats.lowStockItems > 0 ? "error" : "disabled"} sx={{ mr: 1 }} />
                <Typography variant="body2">Items with low stock (below 5)</Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/inventory">
                Manage Inventory
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Sync Status Card */}
        <Grid item xs={12} sm={6} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                Lazada Sync Status
              </Typography>
              <Typography variant="h3" component="div">
                {stats.syncedItems}/{stats.totalItems}
              </Typography>
              <Box mt={1} display="flex" alignItems="center">
                <SyncIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2">Items synced with Lazada</Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" component={Link} to="/lazada">
                Sync Inventory
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button 
          variant="contained" 
          component={Link} 
          to="/inventory/new"
        >
          Add New Product
        </Button>
        <Button 
          variant="outlined"
          component={Link} 
          to="/lazada"
        >
          Sync with Lazada
        </Button>
      </Stack>
    </div>
  );
};

export default Dashboard; 