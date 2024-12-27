const express = require("express");
const {
  viewItems,
  placeOrder,
  updateOrderStatus,
  loginVendor,
} = require("../controllers/vendorController");
const { protectVendor } = require("../middlewares/authMiddleware");
const { getItemByCategory } = require("../controllers/adminController");
const { getUserCart, addCartItem } = require("../controllers/cartController");

const router = express.Router();

router.get("/items", viewItems);
router.post("/cart", protectVendor, placeOrder);
router.get("/getCart", protectVendor, getUserCart);
router.post("/addToCard", protectVendor, addCartItem);
router.put("/order/:orderId/update-status", protectVendor, updateOrderStatus);
router.get("/category-item", getItemByCategory);

// Vendor login route
router.post("/login", loginVendor);

module.exports = router;
