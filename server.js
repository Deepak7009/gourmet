require('dotenv').config();
const express = require('express');
const connectDB = require('./config/dbConnection');
const cors = require("cors");

const adminRoutes = require('./routes/adminRoutes');
const vendorRoutes = require('./routes/vendorRoutes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/admin', adminRoutes);
app.use('/api/vendor', vendorRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
