const express = require('express');
const router = express.Router();
const lazadaController = require('../controllers/lazadaController');

// OAuth routes
router.get('/auth', lazadaController.initiateAuth);
router.get('/auth/status', lazadaController.checkAuthStatus);
router.get('/callback', lazadaController.handleCallback);

// GET products from Lazada
router.get('/products', lazadaController.getProducts);

// POST update inventory in Lazada
router.post('/inventory/update', lazadaController.updateInventory);

// POST create product in Lazada
router.post('/product/create', lazadaController.createProduct);

// POST sync inventory with Lazada
router.post('/inventory/sync', lazadaController.syncInventory);

module.exports = router; 