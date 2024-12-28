const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
  },
  orderItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrdersItems",
    },
  ],
  orderDate: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  deliveryDate: {
    type: Date,
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  orderStatus: {
    type: String,
    enum: [
      "Unshiped",
      "Canceled",
      "Processing",
      "Placed",
      "Confirmed",
      "Shipped",
      "Delivered",
    ],
    default: "Unshiped",
  },
  totalItem: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Order = mongoose.model("Orders", orderSchema);

module.exports = Order;