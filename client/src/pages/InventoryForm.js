import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  Grid,
  Stack,
  CircularProgress,
  Alert,
  InputAdornment
} from '@mui/material';
import { inventoryService } from '../services/api';

const InventoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    images: ''
  });
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const fetchItem = async () => {
      if (isEditMode) {
        try {
          const item = await inventoryService.getById(id);
          setFormData({
            sku: item.sku || '',
            name: item.name || '',
            description: item.description || '',
            price: item.price || '',
            quantity: item.quantity || '',
            category: item.category || '',
            images: item.images ? item.images.join(', ') : ''
          });
          setLoading(false);
        } catch (error) {
          setError('Failed to load item data');
          setLoading(false);
          console.error('Error fetching item:', error);
        }
      }
    };
    
    fetchItem();
  }, [id, isEditMode]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Process images from comma-separated string to array
      const processedData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        images: formData.images ? formData.images.split(',').map(img => img.trim()) : []
      };
      
      if (isEditMode) {
        await inventoryService.update(id, processedData);
      } else {
        await inventoryService.create(processedData);
      }
      
      setSuccess(true);
      setSaving(false);
      
      // Redirect after successful save
      setTimeout(() => {
        navigate('/inventory');
      }, 1500);
    } catch (error) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} item: ${error.message}`);
      setSaving(false);
      console.error('Error saving item:', error);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Product' : 'Add New Product'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Product {isEditMode ? 'updated' : 'created'} successfully!
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="sku"
                label="SKU"
                value={formData.sku}
                onChange={handleChange}
                disabled={isEditMode && formData.lazadaItemId}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="name"
                label="Product Name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                name="price"
                label="Price"
                value={formData.price}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  inputProps: { min: 0, step: 0.01 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                name="quantity"
                label="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                InputProps={{
                  inputProps: { min: 0 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="category"
                label="Category"
                value={formData.category}
                onChange={handleChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="images"
                label="Images URLs (comma separated)"
                value={formData.images}
                onChange={handleChange}
                helperText="Enter URLs separated by commas"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate('/inventory')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Saving...
                    </>
                  ) : isEditMode ? 'Update Product' : 'Create Product'}
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </div>
  );
};

export default InventoryForm; 