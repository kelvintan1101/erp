const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const axios = require('axios');
const crypto = require('crypto');

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set correctly' : 'MISSING');
console.log('LAZADA_APP_KEY:', process.env.LAZADA_APP_KEY);
console.log('LAZADA_APP_SECRET:', process.env.LAZADA_APP_SECRET ? 'Set correctly' : 'MISSING');
console.log('LAZADA_API_URL:', process.env.LAZADA_API_URL);
console.log('LAZADA_CALLBACK_URL:', process.env.LAZADA_CALLBACK_URL);

// Routes
const inventoryRoutes = require('./routes/inventory');
const lazadaRoutes = require('./routes/lazada');

// Import Setting model early to catch any import errors
let Setting;
try {
  Setting = require('./models/Setting');
  console.log('Setting model imported successfully');
} catch (error) {
  console.error('Error importing Setting model:', error);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// API routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/lazada', lazadaRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Lazada ERP API is running');
});

// Add a route to handle Lazada callback at /lazada/callback
app.get('/lazada/callback', async (req, res) => {
  console.log('Received request to /lazada/callback with query:', req.query);
  
  try {
    const { code, state } = req.query;
    
    if (!code) {
      console.error('Authorization code not received in callback');
      return res.status(400).send('Authorization code not received');
    }
    
    console.log('Received Lazada callback with code:', code);
    
    // Get configuration from environment variables
    const appKey = process.env.LAZADA_APP_KEY;
    const appSecret = process.env.LAZADA_APP_SECRET;
    
    if (!appKey || !appSecret) {
      console.error('Missing environment variables:', { 
        appKey: !!appKey, 
        appSecret: !!appSecret
      });
      return res.status(500).send('Server configuration error');
    }
    
    console.log('Exchanging auth code for token using app key:', appKey);
    
    // Use the auth.lazada.com endpoint for token creation - this is different from the API endpoint
    const tokenUrl = 'https://auth.lazada.com/rest/auth/token/create';
    console.log('Using token URL:', tokenUrl);
    
    // Make the token request - auth endpoint doesn't require signing
    const response = await axios.get(tokenUrl, {
      params: {
        app_key: appKey,
        app_secret: appSecret,
        code: code,
        grant_type: 'authorization_code'
      }
    });
    
    console.log('Token response status:', response.status);
    console.log('Token response data:', JSON.stringify(response.data));
    
    // Store tokens
    if (response.data && response.data.access_token) {
      const accessToken = response.data.access_token;
      const refreshToken = response.data.refresh_token;
      const tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      if (!Setting) {
        console.error('Setting model is not available');
        return res.status(500).send('Database model error');
      }
      
      // Token settings keys - must match those in lazadaController
      const TOKEN_KEYS = {
        ACCESS_TOKEN: 'lazada_access_token',
        REFRESH_TOKEN: 'lazada_refresh_token',
        TOKEN_EXPIRY: 'lazada_token_expiry'
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
      
      // Store tokens in database
      try {
        await saveSetting(TOKEN_KEYS.ACCESS_TOKEN, accessToken, 'Lazada API access token');
        await saveSetting(TOKEN_KEYS.REFRESH_TOKEN, refreshToken, 'Lazada API refresh token');
        await saveSetting(TOKEN_KEYS.TOKEN_EXPIRY, tokenExpiry, 'Lazada API token expiry timestamp');
        console.log('OAuth authentication successful, tokens saved');
      } catch (saveError) {
        console.error('Error saving tokens:', saveError);
        return res.status(500).send('Error saving authentication data');
      }
      
      // Return a success page instead of redirecting
      console.log('Returning success page');
      return res.send(`
        <html>
        <head>
          <title>Lazada Authorization Complete</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
              background-color: #f7f7f7;
            }
            .success-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #2E8B57;
            }
            p {
              font-size: 16px;
              margin: 20px 0;
            }
            .checkmark {
              color: #2E8B57;
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="success-container">
            <div class="checkmark">✓</div>
            <h1>Authorization Successful</h1>
            <p>Your Lazada account has been successfully connected.</p>
            <p>The tokens have been saved. You can close this window and return to the application.</p>
          </div>
        </body>
        </html>
      `);
    } else {
      console.error('Invalid token response, missing access_token');
      throw new Error('Invalid token response');
    }
  } catch (error) {
    console.error('Error handling Lazada callback:', error);
    console.error('Error details:', error.response ? error.response.data : error.message);
    
    // Return a user-friendly error page
    res.status(500).send(`
      <html>
      <head><title>Authentication Error</title></head>
      <body>
        <h1>Authentication Error</h1>
        <p>There was a problem authenticating with Lazada.</p>
        <p>Error: ${error.message}</p>
        <p><a href="/">Return to Home</a></p>
      </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 