const express = require("express");
const { loginVendor, getVendorOrders } = require("../controllers/vendorController");
const { viewItems } = require("../controllers/customerCareController");
const { protectVendor } = require("../middlewares/authMiddleware");
const { upload } = require("../middlewares/multer");
const { updateItem, addItem } = require("../controllers/adminController");
const router = express.Router();

router.post("/login", loginVendor);
router.get("/items", viewItems);
router.get("/vendorOrder", protectVendor, getVendorOrders);
// Update an existing item (with image upload)
router.put(
  "/update-item",
  protectVendor,
  upload.fields([{ name: "image" }]),
  updateItem
);
router.post("/item", protectVendor, upload.fields([{ name: "image" }]), addItem);


module.exports = router;
