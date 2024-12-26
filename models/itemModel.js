const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    photo: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    status: { type: String, enum: ["available", "soldout"], required: true }
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;