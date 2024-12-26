const express = require('express');
const { viewItems, placeOrder, updateOrderStatus, loginVendor } = require('../controllers/vendorController');
const { protectVendor } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/items', protectVendor, viewItems);
router.post('/cart', protectVendor, placeOrder);
router.put("/order/:orderId/update-status", protectVendor, updateOrderStatus);


// Vendor login route
router.post('/login', loginVendor);

module.exports = router;
