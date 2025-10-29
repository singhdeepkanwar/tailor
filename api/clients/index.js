// api/clients/index.js
const fs = require('fs');
const path = require('path');

// NOTE: For Vercel, this `data.json` will be read-only at runtime for non-deployed files.
// Any writes will not persist between serverless function invocations.
// For a persistent database, you'd integrate a remote DB here (e.g., MongoDB, PostgreSQL).
const DATA_FILE = path.join(__dirname, '../data.json'); // Path relative to this function file

// Helper to read data (synchronous for simplicity in POC)
function readData() {
    // In a production app, use async methods and proper error handling
    if (!fs.existsSync(DATA_FILE)) {
        // Provide a default structure if the file doesn't exist (e.g., in a local test)
        return { clients: [], orders: [], productTypes: [] };
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Helper to write data (will NOT persist on Vercel for this setup)
function writeData(data) {
    // This function will attempt to write, but changes won't persist on Vercel
    // unless 'data.json' itself is a dynamically writable resource, which it isn't here.
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = async (req, res) => {
    // Set CORS headers for local development and Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    if (req.method === 'GET') {
        try {
            const data = readData();
            res.status(200).json(data.clients);
        } catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ message: 'Error fetching clients', error: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const data = readData();
            const newClient = {
                id: `cl${Date.now()}`,
                ...req.body
            };
            data.clients.push(newClient);
            writeData(data); // This write will not persist on Vercel
            res.status(201).json(newClient);
        } catch (error) {
            console.error('Error creating client:', error);
            res.status(500).json({ message: 'Error creating client', error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};