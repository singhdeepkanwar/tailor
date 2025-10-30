const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    // You could add fields for default measurements here later
});

module.exports = mongoose.models.ProductType || mongoose.model('ProductType', productTypeSchema);