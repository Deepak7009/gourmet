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

const getUserCart = async (req, res) => {
  const userId = req.user._id; // Access userId from req.user

  const cart = await Cart.findOne({ vendor: userId }).populate({
    path: "cartItems.item", // Correct path to populate 'item' in 'cartItems'
    model: "Item", // Ensure 'Item' is the correct model
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  let totalPrice = 0;
  let totalItem = 0;

  for (let cartItem of cart.cartItems) {
    if (cartItem.item) {
      console.log(cartItem.item); // Log the populated item
      if (cartItem.item.price) {
        totalPrice += cartItem.item.price * cartItem.quantity;
        totalItem += cartItem.quantity;
      } else {
        console.log("Missing price for item in cartItem:", cartItem);
      }
    } else {
      console.log("Item not found for cartItem:", cartItem);
    }
  }

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

    // Find the cart of the user (assuming 'vendor' is the correct reference)
    const cart = await Cart.findOne({ vendor: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the product by productId
    const product = await Item.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the cart item already exists for the product
    const existingCartItemIndex = cart.cartItems.findIndex(
      (cartItem) => cartItem.item.toString() === product._id.toString()
    );

    if (existingCartItemIndex > -1) {
      // If the item already exists, update its quantity
      cart.cartItems[existingCartItemIndex].quantity += quantity;
    } else {
      // If the item doesn't exist, create a new cart item
      cart.cartItems.push({
        item: product._id, // Reference the product ID
        quantity,
      });
    }

    // Recalculate total price
    cart.totalPrice = cart.cartItems.reduce((total, cartItem) => {
      return total + cartItem.quantity * product.price; // Add price based on the quantity
    }, 0);

    // Save the cart and send the response
    await cart.save();
    const updatedCart = await getUserCart(userId);
    res.status(200).json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message }); // Handle errors
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
    const product = await Item.findById(cartItem.product);
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
