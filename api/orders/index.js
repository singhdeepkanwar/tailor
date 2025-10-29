// api/orders/index.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data.json');

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        return { clients: [], orders: [], productTypes: [] };
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    if (req.method === 'GET') {
        try {
            const data = readData();
            const ordersWithClientNames = data.orders.map(order => {
                const client = data.clients.find(c => c.id === order.clientId);
                return {
                    ...order,
                    clientName: client ? client.name : 'Unknown Client'
                };
            });
            res.status(200).json(ordersWithClientNames);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ message: 'Error fetching orders', error: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const data = readData();
            const newOrder = {
                id: `ord${Date.now()}`,
                orderDate: new Date().toISOString(),
                status: "Received",
                ...req.body
            };
            data.orders.push(newOrder);
            writeData(data); // This write will not persist on Vercel
            res.status(201).json(newOrder);
        } catch (error) {
            console.error('Error creating order:', error);
            res.status(500).json({ message: 'Error creating order', error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};