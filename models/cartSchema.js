const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  customerCare: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CustomerCare",
    required: true,
  },
  cartItems: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cartitems",
      required: true,
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
