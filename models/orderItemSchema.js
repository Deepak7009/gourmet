const mongoose = require("mongoose");

const orderItemsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
  },
  quantity: {
    type: Number,
    required: true,
  },
  // price: {
  //   type: Number,
  //   required: true,
  // },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomerCare",
    required: true,
  },
});

const OrderItems = mongoose.model("OrdersItems", orderItemsSchema);

module.exports = OrderItems;