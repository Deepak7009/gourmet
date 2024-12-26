const express = require('express');
const { viewItems, addToCart } = require('../controllers/vendorController');
const { protectVendor } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/items', protectVendor, viewItems);
router.post('/cart', protectVendor, addToCart);

module.exports = router;
