const express = require("express");
const {
  viewItems,
  placeOrder,
  updateOrderStatus,
  loginCustomerCare,
} = require("../controllers/customerCareController");
const { protectCustomerCare } = require("../middlewares/authMiddleware");
const { getItemByCategory, getAllVendors } = require("../controllers/adminController");
const { addCartItem, findUserCart, updateCartItem, removeCartItem } = require("../controllers/cartController");
const { createOrder } = require("../controllers/orderController");

const router = express.Router();

router.get("/items", viewItems);
router.post("/cart", protectCustomerCare, placeOrder);
router.get("/getCart", protectCustomerCare, findUserCart);
router.post("/addToCard", protectCustomerCare, addCartItem);
router.post("/updateCartItem", protectCustomerCare, updateCartItem);
router.post("/removeCartItem", protectCustomerCare, removeCartItem);
router.post("/createOrder", protectCustomerCare, createOrder);
router.get("/vendors", protectCustomerCare, getAllVendors); 


router.put("/order/:orderId/update-status", protectCustomerCare, updateOrderStatus);
router.get("/category-item", getItemByCategory);

// CustomerCare login route
router.post("/login", loginCustomerCare);

module.exports = router;
