const Vendor = require("../models/vendorSchema");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

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
      process.env.JWT_SECRET // Make sure to set JWT_SECRET in .env
      // { expiresIn: '1h' } // Token expiration
    );

    res.status(200).json({
      msg: "Login successful",
      token, // Send token in response
      vendor: { id: vendor._id, name: vendor.name, email: vendor.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


const getVendorOrders = async (req, res) => {
    try {
      // Vendor already attached to req.user by protectVendor middleware
      const vendorId = req.user._id;
  
         // Populate the 'orders' and the 'orderItems' within each order
         const vendor = await Vendor.findById(vendorId).populate({
            path: 'orders', // Populate the 'orders' field in the vendor document
            populate: [
              {
                path: 'orderItems', // Populate the 'orderItems' field within each order
                populate: [
                  {
                    path: 'productId', // Populate the 'productId' to get the product details
                    select: 'name ', // Select the fields you want for the product
                  },
                ],
              },
            ],
          });
  
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found." });
      }
  
      if (!vendor.orders || vendor.orders.length === 0) {
        return res.status(200).json({ message: "No orders found for this vendor." });
      }
  
      res.status(200).json(vendor.orders);
    } catch (error) {
      console.error("Error fetching vendor orders:", error.message);
      res.status(500).json({ error: "Failed to fetch vendor orders." });
    }
  };
  

module.exports = { loginVendor, getVendorOrders };
