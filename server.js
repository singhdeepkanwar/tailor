const express = require('express');
const bodyParser = require('express/lib/request');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

const DATA_FILE = path.join(__dirname, 'data.json');

// Helper to read data
function readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Helper to write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// API Endpoints

// Get all clients
app.get('/api/clients', (req, res) => {
    const data = readData();
    res.json(data.clients);
});

// Create new client
app.post('/api/clients', (req, res) => {
    const data = readData();
    const newClient = {
        id: `cl${Date.now()}`, // Simple unique ID
        ...req.body
    };
    data.clients.push(newClient);
    writeData(data);
    res.status(201).json(newClient);
});

// Get all product types
app.get('/api/productTypes', (req, res) => {
    const data = readData();
    res.json(data.productTypes);
});

// Get all orders
app.get('/api/orders', (req, res) => {
    const data = readData();
    // For dashboard, we might want to enrich orders with client names
    const ordersWithClientNames = data.orders.map(order => {
        const client = data.clients.find(c => c.id === order.clientId);
        return {
            ...order,
            clientName: client ? client.name : 'Unknown Client'
        };
    });
    res.json(ordersWithClientNames);
});

// Create new order
app.post('/api/orders', (req, res) => {
    const data = readData();
    const newOrder = {
        id: `ord${Date.now()}`, // Simple unique ID
        orderDate: new Date().toISOString(),
        status: "Received",
        ...req.body // Should contain clientId and products array
    };
    data.orders.push(newOrder);
    writeData(data);
    res.status(201).json(newOrder);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});