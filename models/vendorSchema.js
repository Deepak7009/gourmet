const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:{ type: String, required: true ,default:"vendor"},
    orders: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Orders",
        },
      ],
}, { timestamps: true });

const Vendor = mongoose.model('Vendor', vendorSchema);
module.exports = Vendor