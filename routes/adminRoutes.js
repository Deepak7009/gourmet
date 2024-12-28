const express = require("express");

const {
  getCustomerCareOrders,
  updateCustomerCareCartItem,
  updateOrderStatusByAdmin,
  createCustomerCare,
  updateCustomerCare,
  deleteCustomerCare,
  addItem,
  updateItem,
  deleteItem,
  getCustomerCareDetails,
  signupAdmin,
  loginAdmin,
  getAllCustomerCares,
  getItemByCategory,
  createVendor,
  getAllVendors,
} = require("../controllers/adminController");
const { protectAdmin } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/multer");
const { viewItems } = require("../controllers/customerCareController");
const { getAllOrders } = require("../controllers/orderController");

const router = express.Router();

// Admin Signup route
router.post("/signup", signupAdmin);

// Admin Login route
router.post("/login", loginAdmin);

// Create a new customerCare
router.post("/customerCare", protectAdmin, createCustomerCare);
router.get("/customerCares", protectAdmin, getAllCustomerCares);
router.get("/vendors", protectAdmin, getAllVendors);
router.post("/vendor", protectAdmin, createVendor);
// Add a new item (with image upload)
router.post("/item", protectAdmin, upload.fields([{ name: "image" }]), addItem);

router.get("/items", protectAdmin, viewItems);

// Update an existing item (with image upload)
router.put(
  "/update-item",
  protectAdmin,
  upload.fields([{ name: "image" }]),
  updateItem
);

// Delete an item
router.delete("/delete-item", protectAdmin, deleteItem);

// Get customerCare details and their cart
router.get("/details-customerCare", protectAdmin, getCustomerCareDetails);

// Update customerCare details
router.put("/update-customerCare", protectAdmin, updateCustomerCare);

// Delete customerCare (added missing deletecustomerCare route)
router.delete("/delete-customerCare", protectAdmin, deleteCustomerCare);

// Admin updates item in customerCare's cart
router.put("/customerCare/cart/item", protectAdmin, updateCustomerCareCartItem);

// Admin updates order status and payment status
// router.put("/order/status", protectAdmin, updateOrderStatusByAdmin);

// Get all orders (if needed)
// router.get('/orders', protectAdmin, getAllOrders);
router.get("/allOrders", protectAdmin, getAllOrders);

// Get orders for a particular customerCare (if needed)
router.get("/customerCare/orders", protectAdmin, getCustomerCareOrders);
router.get("/category-item", getItemByCategory);

module.exports = router;
