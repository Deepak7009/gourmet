const Admin = require('../models/adminModel');
const Vendor = require('../models/vendorModel');
const Item = require('../models/itemModel');
const { generateToken } = require('../utils/jwt');
const { uploadOnCloudinary } = require("../utils/cloudinary.js");

// Get vendor details and cart
const getVendorDetails = async (req, res) => {
    try {
        const vendorId = req.params.id;

        // Find vendor and populate cart items
        const vendor = await Vendor.findById(vendorId).populate('cart');
        if (!vendor) {
            return res.status(404).json({ msg: "Vendor not found" });
        }

        res.status(200).json({
            vendor: {
                _id: vendor._id,
                name: vendor.name,
                email: vendor.email,
                createdAt: vendor.createdAt,
                cart: vendor.cart,  // List of items in the cart
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Create vendor
const createVendor = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const vendor = await Vendor.create({ name, email, password });
        await Admin.findByIdAndUpdate(req.user.id, { $push: { vendors: vendor._id } });
        res.status(201).json(vendor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update vendor details
const updateVendor = async (req, res) => {
    try {
        const vendorId = req.params.id;
        const { name, email, password } = req.body;

        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendorId,
            { name, email, password },
            { new: true, runValidators: true } // Return the updated vendor and validate the inputs
        );

        if (!updatedVendor) {
            return res.status(404).json({ msg: "Vendor not found" });
        }

        res.status(200).json(updatedVendor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Delete an item from vendor's cart
const deleteItemFromCart = async (req, res) => {
    try {
        const vendorId = req.params.vendorId;
        const itemId = req.params.itemId;

        // Find the vendor
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ msg: "Vendor not found" });
        }

        // Check if the item exists in the vendor's cart
        const itemIndex = vendor.cart.indexOf(itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ msg: "Item not found in vendor's cart" });
        }

        // Remove the item from the cart
        vendor.cart.splice(itemIndex, 1);

        // Save the updated vendor document
        await vendor.save();

        res.status(200).json({ msg: "Item removed from vendor's cart", vendor });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete vendor
const deleteVendor = async (req, res) => {
    try {
        const vendorId = req.params.id;

        // Check if the vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ msg: "Vendor not found" });
        }

        // Remove the vendor from the admin's list of vendors
        await Admin.findByIdAndUpdate(req.user.id, { $pull: { vendors: vendorId } });

        // Delete the vendor
        await vendor.remove();

        res.status(200).json({ msg: "Vendor deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Add item
const addItem = async (req, res) => {
    try {
        const { name, category, price } = req.body;
        const files = req.files || {}; // Access uploaded files
        let uploadedImageUrl = null;

        if (files.image && files.image.length > 0) {
            const imageFilePath = files.image[0]?.path; // Get the image file path
            const uploadedImage = await uploadOnCloudinary(imageFilePath); // Upload image to Cloudinary
            if (uploadedImage && uploadedImage.url) {
                uploadedImageUrl = uploadedImage.url; // Save the uploaded image URL
            } else {
                return res.status(500).json({ msg: "Image upload failed" });
            }
        }

        const item = await Item.create({
            name,
            category,
            price,
            photo: uploadedImageUrl, // Include the photo URL 
            createdBy: req.user.id
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { createVendor, updateVendor, deleteVendor, addItem ,deleteItemFromCart,getVendorDetails};
