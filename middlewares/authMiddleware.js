const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Vendor = require('../models/vendorModel');

const protectAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) throw new Error('Not authorized');
        req.user = admin;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const protectVendor = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const vendor = await Vendor.findById(decoded.id);
        if (!vendor) throw new Error('Not authorized');
        req.user = vendor;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

module.exports = { protectAdmin, protectVendor };
