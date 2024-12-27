const express = require("express");

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
    loginAdmin,
    getAllVendors,
    getItemByCategory
} = require('../controllers/adminController');
const { protectAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multer');
const { viewItems } = require("../controllers/vendorController");

const router = express.Router();


// Admin Signup route
router.post('/signup', signupAdmin);

// Admin Login route
router.post('/login', loginAdmin);

// Create a new vendor
router.post('/vendor', protectAdmin, createVendor);
router.get('/vendors', protectAdmin, getAllVendors);
// Add a new item (with image upload)
router.post('/item', protectAdmin, upload.fields([{ name: "image" }]), addItem);

router.get('/items',protectAdmin, viewItems);


// Update an existing item (with image upload)
router.put("/item", protectAdmin, upload.fields([{ name: "image" }]), updateItem);

// Delete an item
router.delete("/item", protectAdmin, deleteItem);

// Get vendor details and their cart
router.get("/vendor", protectAdmin, getVendorDetails);

// Update vendor details
router.put("/vendor", protectAdmin, updateVendor);

// Delete vendor (added missing deleteVendor route)
router.delete("/vendor", protectAdmin, deleteVendor);


// Admin updates item in vendor's cart
router.put("/vendor/cart/item", protectAdmin, updateVendorCartItem);

// Admin updates order status and payment status
router.put("/order/status", protectAdmin, updateOrderStatusByAdmin);

// Get all orders (if needed)
router.get('/orders', protectAdmin, getAllOrders);

// Get orders for a particular vendor (if needed)
router.get('/vendor/orders', protectAdmin, getVendorOrders);
router.get('/category-item', getItemByCategory);



module.exports = router;
