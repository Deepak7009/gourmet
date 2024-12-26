const Vendor = require('../models/vendorModel');
const Item = require('../models/itemModel');

const viewItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const addToCart = async (req, res) => {
    try {
        const { itemId } = req.body;
        const vendor = await Vendor.findByIdAndUpdate(req.user.id, { $push: { cart: itemId } }, { new: true });
        res.status(200).json(vendor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { viewItems, addToCart };
