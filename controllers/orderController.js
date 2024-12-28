const OrderItems = require("../models/orderItemSchema");
const Order = require("../models/orderSchema");
const { getUserCart } = require("./cartController");


// Create Order Function
const createOrder = async (req, res) => {
    try {
      const user = req.user; // Assuming user is attached to req by middleware
      if (!user) {
        return res.status(401).json({ error: "User not authenticated" });
      }
  
      // Retrieve cart items
      let cart;
      try {
        cart = await getUserCart(user._id);
      } catch (error) {
        console.error("Error finding cart:", error.message);
        return res.status(500).json({ error: "Error retrieving cart" });
      }
  
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }
  
      const orderItems = [];
  
      // Create order items
      for (const item of cart.cartItems) {
        const orderItem = new OrderItems({
          productId: item.product,
          quantity: item.quantity,
          userId: user._id, // Assuming the user creating the order is the customerCare
        });
  
        const createdOrderItem = await orderItem.save();
        orderItems.push(createdOrderItem._id); // Push only the `_id` as per the schema
      }
  
      // Create order
      const order = new Order({
        customerCare: user._id, // Set the customerCare field
        orderItems: orderItems,
        totalItem: cart.cartItems.length,
        // orderStatus and orderDate will use their default values
      });
  
      const savedOrder = await order.save();
  
      res.status(201).json(savedOrder);
    } catch (error) {
      console.error("Error occurred:", error); // Log the full error object for debugging
      res.status(500).json({ error: error.message });
    }
  };  

// Place Order Function
const placeOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.orderStatus = "Placed";
    await order.save();

    // await sendOrderStatusUpdateEmail(order.user.email, order);

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Confirm Order Function
const confirmedOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = "Confirmed";
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ship Order Function
const shipOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = "Shipped";
    await order.save();
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deliver Order Function
const deliverOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = "Delivered";
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Cancel Order Function
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = "Canceled";
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find Order by ID Function
const findOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user")
      .populate({
        path: "orderItems",
        populate: {
          path: "productId",
          model: "product",
          select:
            "title price discountedPrice discountPresent imageUrl description sizes",
        },
      })
      .populate("shippingAddress");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get User Order History with Status 'Placed'
const getUserOrderHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({
      user: userId,
      // orderStatus: "Placed",
    })
      .populate("user")
      .populate({
        path: "orderItems",
        populate: {
          path: "productId",
          model: "product",
          select:
            "title price discountedPrice discountPresent imageUrl description sizes",
        },
      })
      .populate("shippingAddress")
      .sort({ orderDate: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Orders Function
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerCare")
      .populate({
        path: "orderItems",
        populate: {
          path: "productId",
          select:
            "title price   imageUrl description",
        },
      })
      .sort({ orderDate: -1 });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Order Function
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await OrderItems.deleteMany({ _id: { $in: order.orderItems } });
    await Order.findByIdAndRemove(orderId);

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createOrder,
  placeOrder,
  confirmedOrder,
  shipOrder,
  deliverOrder,
  cancelOrder,
  findOrderById,
  getUserOrderHistory,
  getAllOrders,
  deleteOrder,
};