const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    phoneNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    address: String,
    email: String,
    notes: String,
}, { timestamps: true }); // Adds createdAt and updatedAt fields

module.exports = mongoose.models.Client || mongoose.model('Client', clientSchema);