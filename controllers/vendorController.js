const Vendor = require('../models/vendorModel');
const Item = require('../models/itemModel');
const Order = require('../models/orderModel');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const viewItems = async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json(items);
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
        const itemIds = items.map(item => item.item); // Extract item IDs from the items array
        const itemDocs = await Item.find({ '_id': { $in: itemIds } });
        if (itemDocs.length !== items.length) {
            return res.status(400).json({ msg: "Some items are not found" });
        }

        // Check and update the quantity of each item
        const orderItems = []; // This will store the items with their quantities for the order
        for (let i = 0; i < items.length; i++) {
            const { item: itemId, quantity } = items[i];
            const itemDoc = itemDocs.find(doc => doc._id.toString() === itemId);

            // Check if there is enough quantity for the item
            if (itemDoc.quantity < quantity) {
                return res.status(400).json({ msg: `Not enough quantity for item: ${itemDoc.name}` });
            }

            // Decrease the quantity of the item
            itemDoc.quantity -= quantity;

            // If quantity becomes 0, mark it as 'soldout'
            if (itemDoc.quantity === 0) {
                itemDoc.status = 'soldout';
            }

            // Save the updated item
            await itemDoc.save();

            // Push item to orderItems array with its quantity
            orderItems.push({ item: itemDoc._id, quantity });
        }

        // Create the order
        const newOrder = new Order({
            items: orderItems, // Array of items with quantities
            totalAmount: totalAmount || orderItems.reduce((total, orderItem) => {
                const itemDoc = itemDocs.find(doc => doc._id.toString() === orderItem.item.toString());
                return total + (itemDoc.price * orderItem.quantity);
            }, 0), // Recalculate total if not provided
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
            .populate('items.item', 'name price photo')  // Populating item details
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
