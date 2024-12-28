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

module.exports = { loginVendor };
