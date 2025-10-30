const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    phoneNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: String,
    email: String,
    notes: String,
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = mongoose.models.Client || mongoose.model('Client', clientSchema);
const connectToDatabase = require('./utils/db');
const Client = require('./utils/Client'); // Using the model defined in utils
const mongoose = require('mongoose'); // Needed for ObjectId

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    await connectToDatabase();

    try {
        if (req.method === 'GET') {
            const clients = await Client.find({});
            res.status(200).json(clients);
        } else if (req.method === 'POST') {
            const newClient = await Client.create(req.body);
            res.status(201).json(newClient);
        } else if (req.method === 'PUT') {
            const { id } = req.query; // Assuming ID is passed as /api/clients?id=...
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid client ID' });
            }
            const updatedClient = await Client.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedClient) {
                return res.status(404).json({ message: 'Client not found' });
            }
            res.status(200).json(updatedClient);
        } else if (req.method === 'DELETE') {
            const { id } = req.query; // Assuming ID is passed as /api/clients?id=...
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ message: 'Invalid client ID' });
            }
            const deletedClient = await Client.findByIdAndDelete(id);
            if (!deletedClient) {
                return res.status(404).json({ message: 'Client not found' });
            }
            res.status(200).json({ message: 'Client deleted successfully' });
        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};