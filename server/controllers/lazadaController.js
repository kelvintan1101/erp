const axios = require('axios');
const crypto = require('crypto');
const Inventory = require('../models/Inventory');
const Setting = require('../models/Setting');

// Lazada API configuration from environment variables
const appKey = process.env.LAZADA_APP_KEY;
const appSecret = process.env.LAZADA_APP_SECRET;
const baseUrl = process.env.LAZADA_API_URL;
const callbackUrl = process.env.LAZADA_CALLBACK_URL;
const authUrl = 'https://auth.lazada.com/oauth/authorize';

// Token settings keys
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'lazada_access_token',
  REFRESH_TOKEN: 'lazada_refresh_token',
  TOKEN_EXPIRY: 'lazada_token_expiry'
};

// Initiate OAuth authorization
exports.initiateAuth = (req, res) => {
  try {
    const state = crypto.randomBytes(16).toString('hex'); // Generate random state for CSRF protection
    
    // Store state in session or database if needed
    // req.session.lazadaState = state;
    
    console.log('Environment variables check:');
    console.log('LAZADA_APP_KEY:', process.env.LAZADA_APP_KEY);
    console.log('LAZADA_CALLBACK_URL:', process.env.LAZADA_CALLBACK_URL);
    
    if (!appKey) {
      throw new Error('Lazada App Key is not configured in environment variables');
    }
    
    if (!callbackUrl) {
      throw new Error('Lazada Callback URL is not configured in environment variables');
    }
    
    const authorizationUrl = `${authUrl}?client_id=${appKey}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`;
    
    console.log('Generated authorization URL:', authorizationUrl);
    
    // Redirect user to Lazada's authorization page
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Error initiating Lazada authentication:', error);
    res.status(500).json({
      message: 'Failed to initiate Lazada authentication',
      error: error.message
    });
  }
};

// Handle OAuth callback
exports.handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code not received' });
    }
    
    // Verify state parameter to prevent CSRF attacks
    // if (state !== req.session.lazadaState) {
    //   return res.status(400).json({ message: 'Invalid state parameter' });
    // }
    
    console.log('Exchanging auth code for token using app key:', appKey);
    console.log('Using app secret:', appSecret);
    
    // Exchange authorization code for access token
    const response = await axios.post(`${baseUrl}/auth/token/create`, null, {
      params: {
        app_key: appKey,
        app_secret: appSecret,
        code: code,
        grant_type: 'authorization_code'
      }
    });
    
    // Store tokens
    if (response.data && response.data.access_token) {
      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      const tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      // Store tokens in database
      await saveSetting(TOKEN_KEYS.ACCESS_TOKEN, accessToken, 'Lazada API access token');
      await saveSetting(TOKEN_KEYS.REFRESH_TOKEN, refreshToken, 'Lazada API refresh token');
      await saveSetting(TOKEN_KEYS.TOKEN_EXPIRY, tokenExpiry, 'Lazada API token expiry timestamp');
      
      // Redirect to your frontend
      return res.redirect('/lazada?auth=success');
    } else {
      throw new Error('Invalid token response');
    }
  } catch (error) {
    console.error('Error handling Lazada callback:', error);
    res.status(500).json({
      message: 'Failed to complete Lazada authentication',
      error: error.response ? error.response.data : error.message
    });
  }
};

// Helper function to save a setting
const saveSetting = async (key, value, description = '') => {
  try {
    const setting = await Setting.findOne({ key });
    
    if (setting) {
      setting.value = value;
      if (description) setting.description = description;
      await setting.save();
      return setting;
    } else {
      const newSetting = new Setting({
        key,
        value,
        description
      });
      await newSetting.save();
      return newSetting;
    }
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    throw error;
  }
};

// Helper function to get a setting
const getSetting = async (key) => {
  try {
    const setting = await Setting.findOne({ key });
    return setting ? setting.value : null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
};

// Check authorization status
exports.checkAuthStatus = async (req, res) => {
  try {
    const accessToken = await getSetting(TOKEN_KEYS.ACCESS_TOKEN);
    const tokenExpiry = await getSetting(TOKEN_KEYS.TOKEN_EXPIRY);
    
    // Check if token exists and is not expired
    const isAuthorized = !!accessToken && (tokenExpiry && Date.now() < tokenExpiry);
    
    res.status(200).json({ isAuthorized });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({
      message: 'Error checking authorization status',
      error: error.message
    });
  }
};

// Refresh access token when expired
const refreshAccessToken = async () => {
  try {
    const refreshToken = await getSetting(TOKEN_KEYS.REFRESH_TOKEN);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post(`${baseUrl}/auth/token/refresh`, null, {
      params: {
        app_key: appKey,
        app_secret: appSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      }
    });
    
    if (response.data && response.data.access_token) {
      const accessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token || refreshToken;
      const tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      // Store updated tokens
      await saveSetting(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
      await saveSetting(TOKEN_KEYS.REFRESH_TOKEN, newRefreshToken);
      await saveSetting(TOKEN_KEYS.TOKEN_EXPIRY, tokenExpiry);
      
      return accessToken;
    } else {
      throw new Error('Invalid refresh token response');
    }
  } catch (error) {
    console.error('Error refreshing Lazada token:', error);
    throw error;
  }
};

// Generate Lazada API signature
const generateSignature = (params, appSecret) => {
  const sortedParams = Object.keys(params).sort().map(key => key + params[key]);
  const joinedParams = appSecret + sortedParams.join('') + appSecret;
  return crypto.createHash('md5').update(joinedParams).digest('hex').toUpperCase();
};

// Create common parameters for Lazada API
const createCommonParams = (apiName) => {
  const timestamp = new Date().getTime();
  const params = {
    app_key: appKey,
    timestamp: timestamp,
    sign_method: 'md5',
    method: apiName,
  };
  return params;
};

// Make request to Lazada API
const makeRequest = async (apiName, apiParams = {}) => {
  try {
    // Get token and check if it's expired
    let accessToken = await getSetting(TOKEN_KEYS.ACCESS_TOKEN);
    const tokenExpiry = await getSetting(TOKEN_KEYS.TOKEN_EXPIRY);
    
    if (!accessToken || (tokenExpiry && Date.now() > tokenExpiry)) {
      accessToken = await refreshAccessToken();
    }
    
    const params = { ...createCommonParams(apiName), ...apiParams };
    
    // Add access token if available
    if (accessToken) {
      params.access_token = accessToken;
    }
    
    params.sign = generateSignature(params, appSecret);
    
    const response = await axios.post(baseUrl, null, { params });
    return response.data;
  } catch (error) {
    console.error('Lazada API Error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

// Get products from Lazada
exports.getProducts = async (req, res) => {
  try {
    const response = await makeRequest('lazada.products.get', {
      filter: 'all'
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching products from Lazada',
      error: error.response ? error.response.data : error.message
    });
  }
};

// Update product inventory in Lazada
exports.updateInventory = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    
    if (!itemId || quantity === undefined) {
      return res.status(400).json({
        message: 'Item ID and quantity are required'
      });
    }
    
    const response = await makeRequest('lazada.product.stock.update', {
      item_id: itemId,
      quantity: quantity
    });
    
    // Update local inventory if successful
    if (response.code === '0') {
      const inventory = await Inventory.findOne({ lazadaItemId: itemId });
      if (inventory) {
        inventory.quantity = quantity;
        inventory.lastSync = new Date();
        inventory.syncStatus = 'synced';
        await inventory.save();
      }
    }
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: 'Error updating inventory in Lazada',
      error: error.response ? error.response.data : error.message
    });
  }
};

// Create product in Lazada
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity, category, images, sku } = req.body;
    
    // Simple validation
    if (!name || !price || !quantity || !sku) {
      return res.status(400).json({
        message: 'Name, price, quantity and SKU are required'
      });
    }
    
    // XML payload for product creation (simplified)
    const productXml = `<?xml version="1.0" encoding="UTF-8"?>
      <Request>
        <Product>
          <PrimaryCategory>${category || ''}</PrimaryCategory>
          <SPUId></SPUId>
          <AssociatedSku></AssociatedSku>
          <Images>
            ${images ? images.map(img => `<Image>${img}</Image>`).join('') : ''}
          </Images>
          <Attributes>
            <name>${name}</name>
            <short_description>${description || ''}</short_description>
          </Attributes>
          <Skus>
            <Sku>
              <SellerSku>${sku}</SellerSku>
              <quantity>${quantity}</quantity>
              <price>${price}</price>
              <package_length>1</package_length>
              <package_height>1</package_height>
              <package_weight>1</package_weight>
              <package_width>1</package_width>
              <Images>
                ${images ? images.map(img => `<Image>${img}</Image>`).join('') : ''}
              </Images>
            </Sku>
          </Skus>
        </Product>
      </Request>`;
    
    const response = await makeRequest('lazada.product.create', {
      payload: productXml
    });
    
    // Create local inventory item if successful
    if (response.code === '0' && response.data && response.data.item_id) {
      const newInventory = new Inventory({
        name,
        description,
        price,
        quantity,
        category,
        images,
        sku,
        lazadaItemId: response.data.item_id,
        lastSync: new Date(),
        syncStatus: 'synced'
      });
      
      await newInventory.save();
    }
    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      message: 'Error creating product in Lazada',
      error: error.response ? error.response.data : error.message
    });
  }
};

// Sync local inventory with Lazada
exports.syncInventory = async (req, res) => {
  try {
    const items = await Inventory.find({ lazadaItemId: { $exists: true, $ne: '' } });
    
    const results = [];
    for (const item of items) {
      try {
        const response = await makeRequest('lazada.product.stock.update', {
          item_id: item.lazadaItemId,
          quantity: item.quantity
        });
        
        item.lastSync = new Date();
        item.syncStatus = 'synced';
        await item.save();
        
        results.push({
          sku: item.sku,
          status: 'success',
          response: response
        });
      } catch (error) {
        item.syncStatus = 'error';
        item.syncErrors = [error.message];
        await item.save();
        
        results.push({
          sku: item.sku,
          status: 'error',
          error: error.response ? error.response.data : error.message
        });
      }
    }
    
    res.status(200).json({
      message: `Synced ${results.filter(r => r.status === 'success').length} of ${results.length} items`,
      results
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error syncing inventory with Lazada',
      error: error.message
    });
  }
}; 