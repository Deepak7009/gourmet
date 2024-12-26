const express = require('express');
const {
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
    loginAdmin
} = require('../controllers/adminController');
const { protectAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multer');

const router = express.Router();

// Admin Signup route
router.post('/signup', signupAdmin);

// Admin Login route
router.post('/login', loginAdmin);

// Create a new vendor
router.post('/vendor', protectAdmin, createVendor);

// Add a new item (with image upload)
router.post('/item', protectAdmin, upload.fields([{ name: "image" }]), addItem);

// Update an existing item (with image upload)
router.put("/item/:id", protectAdmin, upload.fields([{ name: "image" }]), updateItem);

// Delete an item
router.delete("/item/:id", protectAdmin, deleteItem);

// Get vendor details and their cart
router.get("/vendor/:id", protectAdmin, getVendorDetails);

// Update vendor details
router.put("/vendor/:id", protectAdmin, updateVendor);

// Delete vendor (added missing deleteVendor route)
router.delete("/vendor/:id", protectAdmin, deleteVendor);


// Admin updates item in vendor's cart
router.put("/vendor/:vendorId/cart/item/:itemId", protectAdmin, updateVendorCartItem);

// Admin updates order status and payment status
router.put("/order/:orderId/status", protectAdmin, updateOrderStatusByAdmin);

// Get all orders (if needed)
router.get('/orders', protectAdmin, getAllOrders);

// Get orders for a particular vendor (if needed)
router.get('/vendor/:vendorId/orders', protectAdmin, getVendorOrders);

module.exports = router;
