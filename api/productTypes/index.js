// api/productTypes/index.js
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

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    if (req.method === 'GET') {
        try {
            const data = readData();
            res.status(200).json(data.productTypes);
        } catch (error) {
            console.error('Error fetching product types:', error);
            res.status(500).json({ message: 'Error fetching product types', error: error.message });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
};