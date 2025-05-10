# Lazada ERP System

A simple ERP system for managing inventory and syncing with Lazada Malaysia API. Built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- Inventory management (add, edit, delete products)
- Inventory synchronization with Lazada
- View Lazada product listings
- Update stock levels in Lazada
- Dashboard with inventory statistics

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Lazada Partner API credentials

## Project Structure

```
lazada-erp/
├── client/            # React frontend
├── server/            # Express backend
│   ├── controllers/   # Route controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── utils/         # Utility functions
│   ├── .env           # Environment variables
│   └── server.js      # Server entry point
├── .gitignore
└── README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd lazada-erp
```

### 2. Setup Server

```bash
cd server
npm install
```

Create a `.env` file in the server directory with the following content:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lazada-erp
LAZADA_APP_KEY=your_lazada_app_key
LAZADA_APP_SECRET=your_lazada_app_secret
LAZADA_API_URL=https://api.lazada.com.my/rest
```

Replace `your_lazada_app_key` and `your_lazada_app_secret` with your actual Lazada API credentials.

### 3. Setup Client

```bash
cd ../client
npm install
```

Create a `.env` file in the client directory with:

```
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run the Application

Start the server:

```bash
cd ../server
npm run dev
```

Start the client (in a new terminal):

```bash
cd ../client
npm start
```

The application should now be running at http://localhost:3000.

## API Routes

### Inventory Routes

- `GET /api/inventory` - Get all inventory items
- `GET /api/inventory/:id` - Get a single inventory item
- `POST /api/inventory` - Create a new inventory item
- `PUT /api/inventory/:id` - Update an inventory item
- `DELETE /api/inventory/:id` - Delete an inventory item
- `PATCH /api/inventory/:id/quantity` - Update inventory quantity

### Lazada Routes

- `GET /api/lazada/products` - Get products from Lazada
- `POST /api/lazada/inventory/update` - Update inventory in Lazada
- `POST /api/lazada/product/create` - Create product in Lazada
- `POST /api/lazada/inventory/sync` - Sync inventory with Lazada

## Lazada API Integration

This application integrates with the Lazada Open Platform API. To use the API features, you need to:

1. Register as a Lazada seller
2. Create an application in the Lazada Open Platform
3. Get your App Key and App Secret
4. Update the `.env` file with your credentials

## License

MIT 