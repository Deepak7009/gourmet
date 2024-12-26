const express = require('express');
const { createVendor, addItem, getVendorDetails, updateVendor, deleteItemFromCart, updateItem, deleteItem } = require('../controllers/adminController');
const { protectAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/multer');

const router = express.Router();

router.post('/vendor', protectAdmin, createVendor);
router.post('/item', protectAdmin, upload.fields([{ name: "image" }]), addItem);
// Update an existing item
router.put("/item/:id", protectAdmin, upload.fields([{ name: "image" }]), updateItem);

// Delete an item
router.delete("/item/:id", protectAdmin, deleteItem);

// Get vendor details and their cart
router.get("/vendor/:id", protectAdmin, getVendorDetails);

// Update vendor details
router.put("/vendor/:id", protectAdmin, updateVendor);

// Delete item from vendor's cart
router.delete("/vendor/:vendorId/cart/:itemId", protectAdmin, deleteItemFromCart);

module.exports = router;
