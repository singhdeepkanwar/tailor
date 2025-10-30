const mongoose = require('mongoose');

const productTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    // You could add fields for default measurements here later
});

module.exports = mongoose.models.ProductType || mongoose.model('ProductType', productTypeSchema);
const connectToDatabase = require('./utils/db');
const ProductType = require('./utils/ProductType');

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
            // Check if product types already exist, if not, initialize them
            let productTypes = await ProductType.find({});
            if (productTypes.length === 0) {
                const initialProductTypes = [
                    { name: "Shirt" },
                    { name: "Kurta" },
                    { name: "Pant" },
                    { name: "Jacket" }
                ];
                productTypes = await ProductType.insertMany(initialProductTypes);
            }
            res.status(200).json(productTypes);
        } else if (req.method === 'POST') {
            const newProductType = await ProductType.create(req.body);
            res.status(201).json(newProductType);
        }
        else {
            res.status(405).json({ message: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};