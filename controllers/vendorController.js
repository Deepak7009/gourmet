const Vendor = require('../models/vendorModel');
const Item = require('../models/itemModel');
const Order = require('../models/orderModel');
const jwt = require('jsonwebtoken');


const bcrypt = require('bcryptjs');


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
        const item = await Item.findById(itemId);
        item.quantity -= 1;
        await item.save();
        res.status(200).json({ message: "Item added successfully", vendor });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Place an order
const placeOrder = async (req, res) => {
    try {
        const { items, totalAmount, paymentMethod, deliveryAddress } = req.body;
        const vendorId = req.user.id; // Assuming the vendor is logged in and their ID is in the `req.user.id`

        // Check if vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ msg: "Vendor not found" });
        }

        // Validate that all items exist in the database
        const itemDocs = await Item.find({ '_id': { $in: items.map(item => item.itemId) } });
        if (itemDocs.length !== items.length) {
            return res.status(400).json({ msg: "Some items are not found" });
        }

        // Check and update the quantity of each item
        const updatedItems = [];
        for (let i = 0; i < items.length; i++) {
            const item = itemDocs.find(i => i._id.toString() === items[i].itemId);

            // Check if there is enough quantity for the item
            if (item.quantity < items[i].quantity) {
                return res.status(400).json({ msg: `Not enough quantity for item: ${item.name}` });
            }

            // Decrease the quantity of the item
            item.quantity -= items[i].quantity;

            // If quantity becomes 0, mark it as 'soldout'
            if (item.quantity === 0) {
                item.status = 'soldout';
            }

            // Save the updated item
            await item.save();

            // Push item to updatedItems array
            updatedItems.push(item._id);
        }

        // Create the order
        const newOrder = new Order({
            items: updatedItems, // Array of item IDs
            totalAmount: totalAmount,
            vendor: vendorId,
            paymentMethod: paymentMethod || 'cash',
            deliveryAddress: deliveryAddress || '',
            status: 'pending', // Default status is 'pending'
            paymentStatus: 'unpaid', // Default payment status is 'unpaid'
        });

        // Save the order
        await newOrder.save();

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Function to get orders for a particular vendor
const getVendorOrders = async (req, res) => {
    try {
        const { vendorId } = req.query;  // Get vendor ID from URL query

        // Validate the vendor ID
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ msg: 'Vendor not found' });
        }

        // Find all orders for this vendor
        const orders = await Order.find({ vendor: vendorId })
            .populate('items', 'name price photo')  // Populating item details
            .populate('vendor', 'name email');     // Populating vendor details

        if (orders.length === 0) {
            return res.status(404).json({ msg: 'No orders found for this vendor' });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update order status to delivered
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status, payStatus } = req.query;  // Get the order ID from URL parameters
        const vendorId = req.user.id;    // Assuming the vendor is logged in and their ID is in `req.user.id`

        // Find the order by ID
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ msg: "Order not found" });
        }

        // Check if the order belongs to the vendor (only allow the vendor who created the order to update it)
        if (order.vendor.toString() !== vendorId) {
            return res.status(403).json({ msg: "You are not authorized to update this order" });
        }


        // Update the status to 'delivered' and payment status to 'paid' if necessary
        order.status = status;
        order.paymentStatus = payStatus;  // Assuming payment is completed when the order is delivered

        // Save the updated order
        await order.save();

        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Vendor Login
const loginVendor = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find vendor by email
        const vendor = await Vendor.findOne({ email });
        if (!vendor) {
            return res.status(400).json({ msg: "Vendor not found" });
        }

        // Compare password with the stored hashed password
        const isMatch = await bcrypt.compare(password, vendor.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: vendor._id, email: vendor.email },
            process.env.JWT_SECRET, // Make sure to set JWT_SECRET in .env
            { expiresIn: '1h' } // Token expiration
        );

        res.status(200).json({
            msg: "Login successful",
            token, // Send token in response
            vendor: { id: vendor._id, name: vendor.name, email: vendor.email }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { viewItems, placeOrder, getVendorOrders, updateOrderStatus, loginVendor };
