const mongoose = require('mongoose');

const customerCareSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:{ type: String, required: true ,default:"customerCare"}
}, { timestamps: true });

const CustomerCare = mongoose.model('CustomerCare', customerCareSchema);
module.exports = CustomerCare