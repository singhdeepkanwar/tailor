// tailor-system-db/server.js
require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Import Mongoose models for local usage
const Client = require('./models/Client');
const ProductType = require('./models/ProductType');
const Order = require('./models/Order');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected (Local Development)'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// CORS for local development (Vercel serverless functions handle their own CORS)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


// --- API Routes (mirroring Vercel serverless functions for local testing) ---

// Clients API
app.get('/api/clients', async (req, res) => {
    try {
        const clients = await Client.find({});
        res.json(clients);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.post('/api/clients', async (req, res) => {
    try {
        const newClient = await Client.create(req.body);
        res.status(201).json(newClient);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.put('/api/clients', async (req, res) => {
    try {
        const { id } = req.query;
        const updatedClient = await Client.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedClient) return res.status(404).json({ message: 'Client not found' });
        res.json(updatedClient);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.delete('/api/clients', async (req, res) => {
    try {
        const { id } = req.query;
        const deletedClient = await Client.findByIdAndDelete(id);
        if (!deletedClient) return res.status(404).json({ message: 'Client not found' });
        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Product Types API
app.get('/api/productTypes', async (req, res) => {
    try {
        let productTypes = await ProductType.find({});
        if (productTypes.length === 0) {
            const initialProductTypes = [
                { name: "Shirt" },
                { name: "Kurta" },
                { name: "Pant" },
                { name: "Jacket" }
            ];
            productTypes = await ProductType.insertMany(initialProductTypes);
        }
        res.json(productTypes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.post('/api/productTypes', async (req, res) => {
    try {
        const newProductType = await ProductType.create(req.body);
        res.status(201).json(newProductType);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// Orders API
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find({})
                                  .populate('clientId', 'name phoneNo')
                                  .populate('products.productId', 'name')
                                  .sort({ orderDate: -1 });

        const formattedOrders = orders.map(order => ({
            id: order._id,
            clientName: order.clientId ? `${order.clientId.name} (${order.clientId.phoneNo})` : 'Unknown Client',
            orderDate: order.orderDate,
            deliveryDate: order.deliveryDate,
            status: order.status,
            products: order.products.map(p => ({
                productTypeName: p.productId ? p.productId.name : 'Unknown Product',
                measurements: p.measurements,
                notes: p.notes,
            }))
        }));
        res.json(formattedOrders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = await Order.create(req.body);
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
});