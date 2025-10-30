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