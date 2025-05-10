const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lazadaItemId: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  images: [String],
  lastSync: {
    type: Date,
    default: null
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'error', 'not_synced'],
    default: 'not_synced'
  },
  syncErrors: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema); 