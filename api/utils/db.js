const mongoose = require('mongoose');

let cachedDb = null;

// Function to connect to MongoDB
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable inside .env or Vercel Environment Variables'
    );
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      bufferCommands: false, // Disable Mongoose's buffering
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    cachedDb = db;
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

module.exports = connectToDatabase;

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