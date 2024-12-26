const express = require('express');
const { viewItems, placeOrder, updateOrderStatus } = require('../controllers/vendorController');
const { protectVendor } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/items', protectVendor, viewItems);
router.post('/cart', protectVendor, placeOrder);
router.put("/order/:orderId/update-status", protectVendor, updateOrderStatus);


module.exports = router;
