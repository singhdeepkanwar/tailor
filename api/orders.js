const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    orderDate: { type: Date, default: Date.now },
    deliveryDate: Date,
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductType', required: true },
            measurements: mongoose.Schema.Types.Mixed, // Stores measurements as a flexible object
            notes: String,
        }
    ],
    status: { type: String, default: 'Received', enum: ['Received', 'In Progress', 'Ready', 'Delivered', 'Cancelled'] },
}, { timestamps: true });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);

const connectToDatabase = require('./utils/db');
const Order = require('./utils/Order');
const Client = require('./utils/Client'); // To populate client name
const ProductType = require('./utils/ProductType'); // To populate product names
const mongoose = require('mongoose');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok');
    }

    await connectToDatabase();

    try {
        if (req.method === 'GET') {
            const orders = await Order.find({})
                                      .populate('clientId', 'name phoneNo') // Populate client name and phoneNo
                                      .populate('products.productId', 'name') // Populate product type name
                                      .sort({ orderDate: -1 }); // Sort by most recent

            // Format for client-side display
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
            res.status(200).json(formattedOrders);
        } else if (req.method === 'POST') {
            const newOrder = await Order.create(req.body);
            res.status(201).json(newOrder);
        } else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};