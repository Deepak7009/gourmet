const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    items: [{
        item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        quantity: { type: Number, default: 1 }
    }],
    totalAmount: { type: Number, required: true },
    customerCare: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerCare' },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'shipped', 'delivered ', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash', 'card', 'online'], default: 'cash' },
    paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    deliveryAddress: { type: String },
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
