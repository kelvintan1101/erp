const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// GET all inventory items
router.get('/', inventoryController.getAllItems);

// GET single inventory item
router.get('/:id', inventoryController.getItemById);

// POST new inventory item
router.post('/', inventoryController.createItem);

// PUT update inventory item
router.put('/:id', inventoryController.updateItem);

// DELETE inventory item
router.delete('/:id', inventoryController.deleteItem);

// PATCH update inventory quantity
router.patch('/:id/quantity', inventoryController.updateQuantity);

module.exports = router; 