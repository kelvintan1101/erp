const Inventory = require('../models/Inventory');

// Get all inventory items
exports.getAllItems = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
  }
};

// Get single inventory item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching inventory item', error: error.message });
  }
};

// Create new inventory item
exports.createItem = async (req, res) => {
  try {
    const item = new Inventory(req.body);
    const savedItem = await item.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating inventory item', error: error.message });
  }
};

// Update inventory item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory item', error: error.message });
  }
};

// Delete inventory item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Inventory.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
  }
};

// Update inventory quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ message: 'Quantity is required' });
    }
    
    const item = await Inventory.findById(id);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    item.quantity = quantity;
    const updatedItem = await item.save();
    
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating inventory quantity', error: error.message });
  }
}; 