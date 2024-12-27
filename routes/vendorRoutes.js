const express = require("express");
const {
  viewItems,
  placeOrder,
  updateOrderStatus,
  loginVendor,
} = require("../controllers/vendorController");
const { protectVendor } = require("../middlewares/authMiddleware");
const { getItemByCategory } = require("../controllers/adminController");
const { addCartItem, findUserCart, updateCartItem, removeCartItem } = require("../controllers/cartController");

const router = express.Router();

router.get("/items", viewItems);
router.post("/cart", protectVendor, placeOrder);
router.get("/getCart", protectVendor, findUserCart);
router.post("/addToCard", protectVendor, addCartItem);
router.post("/updateCartItem", protectVendor, updateCartItem);
router.post("/removeCartItem", protectVendor, removeCartItem);
router.put("/order/:orderId/update-status", protectVendor, updateOrderStatus);
router.get("/category-item", getItemByCategory);

// Vendor login route
router.post("/login", loginVendor);

module.exports = router;
