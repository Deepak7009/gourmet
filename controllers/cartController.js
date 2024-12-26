const CartItem = require("../models/cartItemSchema");
const Cart = require("../models/cartSchema");
const Item = require("../models/itemModel");

// Create cart function
const createCart = async (vendorId) => {
    try {
      const cart = new Cart({
        vendor: vendorId,  // Associate cart with the vendor's ID
        cartItems: [],      // Initial cart items (empty array)
        totalPrice: 0       // Initial total price (0 by default)
      });
  
      const createdCart = await cart.save();  // Save the cart to the database
      return createdCart;
    } catch (error) {
      throw new Error(error.message);
    }
  };

const getUserCart = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new Error("Cart not found");
  }

  const cartItems = await CartItem.find({ cart: cart._id }).populate("Item");

  let totalPrice = 0;
  let totalItem = 0;

  for (let cartItem of cartItems) {
    totalPrice += cartItem.discountedPrice * cartItem.quantity;
    totalDiscountPrice += cartItem.discountedPrice * cartItem.quantity;
    totalItem += cartItem.quantity;
  }

  cart.cartItems = cartItems;
  cart.totalPrice = totalPrice;
  cart.totalItem = totalItem;
  cart.discount = totalPrice - totalDiscountPrice;

  return cart;
};

const findUserCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await getUserCart(userId);

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCartItem = async (req, res) => {
  try {
    const userId = req.user._id; // Access userId from req.user
    const { productId, quantity, size } = req.body; // Access data from request body

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const product = await Item.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the selected size object based on the size string
    const selectedSize = product.sizes.find(
      (s) => `${s.value} ${s.unit}` === size
    );

    if (!selectedSize) {
      console.log("Available sizes:", product.sizes);
      console.log("Selected size:", size);
      return res.status(400).json({ message: "Invalid size selected" });
    }

    const existingCartItem = await CartItem.findOne({
      cart: cart._id,
      product: product._id,
      size: size, // Ensure size uniqueness
    });

    if (existingCartItem) {
      existingCartItem.quantity += quantity;
      // existingCartItem.price = product.price;
      existingCartItem.price = selectedSize.price || product.price;
      // existingCartItem.discountedPrice = product.discountedPrice;
      existingCartItem.discountedPrice =
        selectedSize.discountedPrice || product.discountedPrice;

      await existingCartItem.save();
    } else {
      const cartItem = new CartItem({
        cart: cart._id,
        product: product._id,
        userId,
        quantity,
        // price: product.price,
        price: selectedSize.price || product.price,
        size,
        // discountedPrice: product.discountedPrice,
        discountedPrice:
          selectedSize.discountedPrice || product.discountedPrice,
      });

      const createdCartItem = await cartItem.save();
      cart.cartItems.push(createdCartItem);
      await cart.save();
    }

    const updatedCart = await getUserCart(userId);

    // res.status(200).json({ message: "Item added successfully" });
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id; // Access userId from req.user
    const { cartItemId } = req.body;
    console.log("cartItemId:", cartItemId);

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const cartItem = await CartItem.findByIdAndDelete(cartItemId);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.cartItems.pull(cartItemId);
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cartItemId, quantity, size } = req.body;

    // Find the user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find and update the cart item
    const cartItem = await CartItem.findById(cartItemId);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Fetch the product
    const product = await Product.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find the selected size object
    const selectedSize = product.sizes.find(
      (s) => `${s.value} ${s.unit}` === size
    );

    if (!selectedSize) {
      return res.status(400).json({ message: "Invalid size selected" });
    }

    // Update the cart item
    cartItem.quantity = quantity;
    cartItem.size = size;
    // cartItem.price = product.discountedPrice;
    cartItem.price = selectedSize.price || product.price;
    // cartItem.discountedPrice = product.discountedPrice;
    cartItem.discountedPrice =
      selectedSize.discountedPrice || product.discountedPrice;
    await cartItem.save();

    // Recalculate totals
    const cartItems = await CartItem.find({ cart: cart._id }).populate(
      "item"
    );

    let totalPrice = 0;
    let totalDiscountPrice = 0;
    let totalItem = 0;

    for (let item of cartItems) {
      // const itemPrice = item.price || 0;
      const itemPrice = item.discountedPrice || 0;
      const itemDiscountedPrice = item.discountedPrice || 0;
      const itemQuantity = item.quantity || 0;

      totalPrice += itemPrice * itemQuantity;
      totalDiscountPrice += itemDiscountedPrice * itemQuantity;
      totalItem += itemQuantity;
    }

    // Update cart totals
    cart.totalPrice = isNaN(totalPrice) ? 0 : totalPrice;
    cart.totalItem = totalItem;
    cart.discount = isNaN(totalPrice - totalDiscountPrice)
      ? 0
      : totalPrice - totalDiscountPrice;

    await cart.save();

    // Fetch updated cart with populated cart items
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "cartItems",
      populate: {
        path: "item",
      },
    });

    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id; // Access userId from req.user

    // Find the user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove all items from the CartItem collection
    await CartItem.deleteMany({ cart: cart._id });

    // Update the cart document
    cart.cartItems = [];
    cart.totalPrice = 0;
    cart.totalItem = 0;
    await cart.save();

    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCart,
  findUserCart,
  addCartItem,
  removeCartItem,
  updateCartItem,
  getUserCart,
  clearCart,
};
