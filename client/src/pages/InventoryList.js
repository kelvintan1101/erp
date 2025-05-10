import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import { inventoryService, lazadaService } from '../services/api';

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Fetch inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await inventoryService.getAll();
        setInventory(data);
        setLoading(false);
      } catch (error) {
        setError('Failed to load inventory data');
        setLoading(false);
        console.error('Error fetching inventory:', error);
      }
    };

    fetchInventory();
  }, []);

  // Handle delete confirmation
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  // Handle delete item
  const handleDeleteConfirm = async () => {
    try {
      await inventoryService.delete(itemToDelete._id);
      setInventory(inventory.filter(item => item._id !== itemToDelete._id));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Failed to delete item');
    }
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Filter inventory based on search term
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle sync with Lazada
  const handleSyncItem = async (item) => {
    setSyncLoading(true);
    setSyncResult(null);
    
    try {
      if (!item.lazadaItemId) {
        // If no Lazada ID, create new product on Lazada
        const response = await lazadaService.createProduct({
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          sku: item.sku,
          category: item.category,
          images: item.images
        });
        
        setSyncResult({
          success: response.code === '0',
          message: response.code === '0' ? 'Product created on Lazada' : response.message || 'Failed to create product'
        });
        
        // Refresh inventory data to get updated sync status
        const data = await inventoryService.getAll();
        setInventory(data);
      } else {
        // Update existing product on Lazada
        const response = await lazadaService.updateInventory(item.lazadaItemId, item.quantity);
        
        setSyncResult({
          success: response.code === '0',
          message: response.code === '0' ? 'Inventory updated on Lazada' : response.message || 'Failed to update inventory'
        });
        
        // Refresh inventory data to get updated sync status
        const data = await inventoryService.getAll();
        setInventory(data);
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Error syncing with Lazada: ' + (error.message || 'Unknown error')
      });
      console.error('Error syncing with Lazada:', error);
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  // Get sync status chip color
  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'synced': return 'success';
      case 'pending': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Inventory</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/inventory/new"
        >
          Add Product
        </Button>
      </Box>

      {syncResult && (
        <Alert 
          severity={syncResult.success ? "success" : "error"} 
          sx={{ mb: 2 }}
          onClose={() => setSyncResult(null)}
        >
          {syncResult.message}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by name or SKU"
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell>Lazada Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" sx={{ py: 2 }}>
                    No inventory items found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.syncStatus}
                      color={getSyncStatusColor(item.syncStatus)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton 
                        color="primary" 
                        component={Link} 
                        to={`/inventory/edit/${item._id}`}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(item)}
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton 
                        color="secondary"
                        onClick={() => handleSyncItem(item)}
                        disabled={syncLoading}
                      >
                        <SyncIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InventoryList; 