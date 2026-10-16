require('dotenv').config();
const mongoose = require('mongoose');
const userModel = require('./src/models/user.model.js');

async function cleanup() {
    await mongoose.connect(process.env.MONGO_URI);
    const res = await userModel.deleteMany({ isVerified: false });
    console.log(`Cleaned up ${res.deletedCount} unverified accounts.`);
    process.exit(0);
}

cleanup();
