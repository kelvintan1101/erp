import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Inventory API services
export const inventoryService = {
  // Get all inventory items
  getAll: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  
  // Get a single inventory item
  getById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  
  // Create a new inventory item
  create: async (data) => {
    const response = await api.post('/inventory', data);
    return response.data;
  },
  
  // Update an inventory item
  update: async (id, data) => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },
  
  // Delete an inventory item
  delete: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
  
  // Update inventory quantity
  updateQuantity: async (id, quantity) => {
    const response = await api.patch(`/inventory/${id}/quantity`, { quantity });
    return response.data;
  }
};

// Lazada API services
export const lazadaService = {
  // Check if authorized with Lazada
  checkAuthStatus: async () => {
    try {
      const response = await api.get('/lazada/auth/status');
      return response.data.isAuthorized;
    } catch (error) {
      console.error('Error checking Lazada auth status:', error);
      return false;
    }
  },
  
  // Get auth URL to authorize with Lazada
  getAuthUrl: () => {
    return `${API_URL}/lazada/auth`;
  },
  
  // Get products from Lazada
  getProducts: async () => {
    const response = await api.get('/lazada/products');
    return response.data;
  },
  
  // Update inventory in Lazada
  updateInventory: async (itemId, quantity) => {
    const response = await api.post('/lazada/inventory/update', { itemId, quantity });
    return response.data;
  },
  
  // Create product in Lazada
  createProduct: async (product) => {
    const response = await api.post('/lazada/product/create', product);
    return response.data;
  },
  
  // Sync inventory with Lazada
  syncInventory: async () => {
    const response = await api.post('/lazada/inventory/sync');
    return response.data;
  }
};

export default api; 