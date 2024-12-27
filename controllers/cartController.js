const CartItem = require("../models/cartItemSchema");
const Cart = require("../models/cartSchema");
const Item = require("../models/itemModel");

// Create cart function
const createCart = async (vendorId) => {
  try {
    const cart = new Cart({
      vendor: vendorId, // Associate cart with the vendor's ID
      cartItems: [], // Initial cart items (empty array)
      totalPrice: 0, // Initial total price (0 by default)
    });

    const createdCart = await cart.save(); // Save the cart to the database
    return createdCart;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getUserCart = async (userId) => {
  const cart = await Cart.findOne({ vendor: userId }); // Assuming you're using 'vendor' field based on previous schema
  if (!cart) {
    throw new Error("Cart not found");
  }

  const cartItems = await CartItem.find({ cart: cart._id }).populate("Item");

  let totalPrice = 0;
  let totalItem = 0;

  for (let cartItem of cartItems) {
    totalPrice += cartItem.price * cartItem.quantity; // Using 'price' instead of 'discountedPrice'
    totalItem += cartItem.quantity;
  }

  cart.cartItems = cartItems;
  cart.totalPrice = totalPrice;
  cart.totalItem = totalItem;

  return cart;
};

const findUserCart = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming 'user' is added to req by your authentication middleware
    const cart = await getUserCart(userId);

    res.status(200).json(cart); // Send the cart details in the response
  } catch (error) {
    res.status(500).json({ message: error.message }); // Handle any server errors
  }
};

const addCartItem = async (req, res) => {
  try {
    const userId = req.user._id; // Access userId from req.user
    const { productId, quantity } = req.body; // Access data from request body

    // Find the cart of the user (assuming you meant to use userId, not vendorId)
    const cart = await Cart.findOne({ vendor: userId }); // Assuming 'vendor' is the correct reference

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const product = await Item.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the cart item already exists for the product
    const existingCartItem = await CartItem.findOne({
      cart: cart._id,
      product: product._id,
    });

    if (existingCartItem) {
      // Update the existing cart item
      existingCartItem.quantity += quantity;
      existingCartItem.price = product.price; // Use product price

      await existingCartItem.save();
    } else {
      // Create a new cart item without size
      const cartItem = new CartItem({
        cart: cart._id,
        product: product._id,
        userId, // Ensure userId is the correct reference to the user adding the item
        quantity,
        price: product.price, // Use product price
      });

      const createdCartItem = await cartItem.save();
      cart.cartItems.push(createdCartItem); // Push the new item into the cart's cartItems array
      await cart.save();
    }

    const updatedCart = await getUserCart(userId); // Fetch the updated cart

    res.status(200).json(updatedCart); // Return the updated cart
  } catch (error) {
    res.status(500).json({ message: error.message }); // Handle any errors
  }
};

const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id; // Access userId from req.user
    const { cartItemId } = req.body;
    console.log("cartItemId:", cartItemId);

    // Find the cart associated with the user (assuming user is a vendor)
    const cart = await Cart.findOne({ vendor: userId }); // Corrected to use 'vendor'

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove the cart item from the CartItem collection
    const cartItem = await CartItem.findByIdAndDelete(cartItemId);

    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Remove the cart item from the cart's cartItems array
    cart.cartItems.pull(cartItemId);
    await cart.save();

    // Return the updated cart with the remaining items
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id; // Get userId from the logged-in user
    const { cartItemId, quantity } = req.body; // Get the cartItemId and quantity from the request

    // Find the user's cart by vendor ID (instead of user)
    const cart = await Cart.findOne({ vendor: userId }); // Assuming 'vendor' is used in the Cart schema
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the cart item by its ID
    const cartItem = await CartItem.findById(cartItemId);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Fetch the product associated with the cart item
    const product = await Product.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update the cart item
    cartItem.quantity = quantity;
    cartItem.price = product.price; // Set price from the product
    await cartItem.save(); // Save the updated cart item

    // Recalculate totals for the cart
    const cartItems = await CartItem.find({ cart: cart._id }).populate(
      "product"
    );

    let totalPrice = 0;
    let totalItem = 0;

    for (let item of cartItems) {
      const itemPrice = item.price || 0;
      const itemQuantity = item.quantity || 0;

      totalPrice += itemPrice * itemQuantity;
      totalItem += itemQuantity;
    }

    // Update cart totals
    cart.totalPrice = totalPrice;
    cart.totalItem = totalItem;

    await cart.save(); // Save the updated cart

    // Fetch updated cart with populated cart items
    const updatedCart = await Cart.findById(cart._id).populate({
      path: "cartItems",
      populate: {
        path: "product", // Populate the product details
      },
    });

    // Return the updated cart
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id; // Access userId from req.user

    // Find the user's cart by vendor (assuming 'vendor' is used in the Cart schema)
    const cart = await Cart.findOne({ vendor: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove all items from the CartItem collection related to this cart
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
