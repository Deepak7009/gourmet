const Admin = require("../models/adminModel");
const Vendor = require("../models/vendorModel");
const Item = require("../models/itemModel");
const { generateToken } = require("../utils/jwt");
const { uploadOnCloudinary } = require("../utils/cloudinary.js");
const Order = require("../models/orderModel.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { createCart } = require("./cartController.js");

// Admin Signup (Registration)
// const signupAdmin = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     // Check if the admin already exists
//     const existingAdmin = await Admin.findOne({ email });
//     if (existingAdmin) {
//       return res.status(400).json({ msg: "Admin already exists" });
//     }

//     // Hash the password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Create a new admin
//     const newAdmin = new Admin({
//       name,
//       email,
//       password: hashedPassword,
//     });

//     // Save the admin to the database
//     await newAdmin.save();

//     res.status(201).json({ msg: "Admin created successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const signupAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if any admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(400).json({ msg: "Admin already exists. Only one admin can be created." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new admin
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
    });

    // Save the admin to the database
    await newAdmin.save();

    res.status(201).json({ msg: "Admin created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Compare password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      // expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get vendor details and cart
const getVendorDetails = async (req, res) => {
  try {
    const vendorId = req.query;

    // Find vendor and populate cart items
    const vendor = await Vendor.findById(vendorId).populate("cart");
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    res.status(200).json({
      vendor: {
        _id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        createdAt: vendor.createdAt,
        cart: vendor.cart, // List of items in the cart
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create vendor
const createVendor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ msg: "Vendor already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new vendor with hashed password
    const vendor = await Vendor.create({
      name,
      email,
      password: hashedPassword,
    });

    // Associate the vendor with the admin (optional based on your application logic)
    await Admin.findByIdAndUpdate(req.user.id, {
      $push: { vendors: vendor._id },
    });

    // Create a cart for the newly created vendor
    const createdCart = await createCart(vendor._id); // Passing vendor's ID to createCart

    res.status(201).json({ vendor, cart: createdCart });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update vendor details
const updateVendor = async (req, res) => {
  try {
    const vendorId = req.query;
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

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    const vendorId = req.query;

    // Check if the vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    // Remove the vendor from the admin's list of vendors
    await Admin.findByIdAndUpdate(req.user.id, {
      $pull: { vendors: vendorId },
    });

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
    const { name, category, price, description, quantity, status } = req.body;

    const files = req.files || {}; // Access uploaded files
    let uploadedImageUrl = null;

    console.log("admin is adding item");
    if (files.image && files.image.length > 0) {
      const imageFilePath = files.image[0]?.path; // Get the image file path
      const uploadedImage = await uploadOnCloudinary(imageFilePath); // Upload image to Cloudinary
      if (uploadedImage && uploadedImage.url) {
        uploadedImageUrl = uploadedImage.url; // Save the uploaded image URL
      } else {
        return res.status(500).json({ msg: "Image upload failed" });
      }
    }

    // Validate the status field (either "available" or "soldout")
    if (!["available", "soldout"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status value" });
    }

    // Create the item based on the schema
    const item = await Item.create({
      name,
      category,
      price,
      description,
      quantity,
      status,
      photo: uploadedImageUrl,
      createdBy: req.user.id, // Assuming `req.user.id` is the logged-in admin's ID
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const { name, category, price, description, quantity, status } = req.body;
    const itemId = req.query;
    const files = req.files || {}; // Access uploaded files
    let uploadedImageUrl = null;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ msg: "Item not found" });
    }

    // Handle image upload (only if new image is uploaded)
    if (files.image && files.image.length > 0) {
      const imageFilePath = files.image[0]?.path; // Get the image file path
      const uploadedImage = await uploadOnCloudinary(imageFilePath); // Upload image to Cloudinary
      if (uploadedImage && uploadedImage.url) {
        uploadedImageUrl = uploadedImage.url; // Save the uploaded image URL
      } else {
        return res.status(500).json({ msg: "Image upload failed" });
      }
    }

    // Validate status
    if (!["available", "soldout"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status value" });
    }

    // Update item details
    item.name = name || item.name;
    item.category = category || item.category;
    item.price = price || item.price;
    item.description = description || item.description;
    item.quantity = quantity || item.quantity;
    item.status = status || item.status;
    item.photo = uploadedImageUrl || item.photo;

    // Save the updated item
    await item.save();

    res.status(200).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete item
const deleteItem = async (req, res) => {
  try {
    const itemId = req.query;
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ msg: "Item not found" });
    }

    // Delete the item from the database
    await item.remove();

    res.status(200).json({ msg: "Item deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update Item in Vendor's Cart
const updateVendorCartItem = async (req, res) => {
  try {
    const { vendorId, itemId } = req.query; // Get vendor ID and item ID from query
    const { quantity } = req.body; // Get the new quantity from request body

    // Validate the quantity
    if (quantity <= 0) {
      return res.status(400).json({ msg: "Quantity must be greater than 0" });
    }

    // Find the vendor by ID
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    // Find the order for the vendor's cart (assuming there is one ongoing order)
    const order = await Order.findOne({ vendor: vendorId, status: "pending" });
    if (!order) {
      return res
        .status(404)
        .json({ msg: "No pending order found for this vendor" });
    }

    // Find the item in the order's items array
    const itemIndex = order.items.indexOf(itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ msg: "Item not found in the cart" });
    }

    // Update the quantity of the item (assuming the cart has the items by item ID)
    // Assuming each item in the cart has a `quantity` field
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ msg: "Item not found" });
    }

    // Update the quantity of the item in the order
    order.items[itemIndex].quantity = quantity;

    // Recalculate total amount if needed
    order.totalAmount = order.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Save the updated order
    await order.save();

    res.status(200).json({ msg: "Cart item updated successfully", order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update Order Status (For Admin to Update Order Status)
const updateOrderStatusByAdmin = async (req, res) => {
  try {
    const { orderId } = req.query; // Get order ID from URL parameters
    const { status, paymentStatus } = req.body; // Get status and payment status from request body

    // Validate status and paymentStatus
    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    const validPaymentStatuses = ["paid", "unpaid"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status" });
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ msg: "Invalid payment status" });
    }

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    // Update the order status and payment status
    if (status) {
      order.status = status;
    }
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Save the updated order
    await order.save();

    res.status(200).json({ msg: "Order status updated successfully", order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Function to get all orders for admin
const getAllOrders = async (req, res) => {
  try {
    // Fetch all orders with populated items and vendor details
    const orders = await Order.find()
      .populate("items", "name price photo") // Populating item details
      .populate("vendor", "name email"); // Populating vendor details

    if (orders.length === 0) {
      return res.status(404).json({ msg: "No orders found" });
    }

    res.status(200).json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Function to get orders for a particular vendor
const getVendorOrders = async (req, res) => {
  try {
    const { vendorId } = req.query; // Get vendor ID from URL query

    // Validate the vendor ID
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    // Find all orders for this vendor
    const orders = await Order.find({ vendor: vendorId })
      .populate("items", "name price photo") // Populating item details
      .populate("vendor", "name email"); // Populating vendor details

    if (orders.length === 0) {
      return res.status(404).json({ msg: "No orders found for this vendor" });
    }

    res.status(200).json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getItemByCategory = async (req, res) => {
  const { category } = req.body;
  try {
    const item = await Item.find({ category: category })
      .populate("vendor", "name email")
      .populatate("order", "status");
    if (item.length === 0) {
      return res.status(404).json({ msg: "No item found in this category" });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
module.exports = {
  getItemByCategory,
  getAllOrders,
  getVendorOrders,
  updateVendorCartItem,
  updateOrderStatusByAdmin,
  createVendor,
  updateVendor,
  deleteVendor,
  addItem,
  updateItem,
  deleteItem,
  getVendorDetails,
  signupAdmin,
  loginAdmin,
};
