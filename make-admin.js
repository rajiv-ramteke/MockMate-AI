/**
 * make-admin.js
 * ─────────────────────────────────────────────────────────
 * Usage: node make-admin.js <email>
 * Example: node make-admin.js rajiv@example.com
 * 
 * Run this script ONCE to promote your account to admin.
 * ─────────────────────────────────────────────────────────
 */
require('./Backend/node_modules/dotenv').config({ path: './Backend/.env' });
const mongoose = require('./Backend/node_modules/mongoose');

const email = process.argv[2];

if (!email) {
    console.error("❌ Please provide an email: node make-admin.js <email>");
    process.exit(1);
}

async function makeAdmin() {
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI not found in Backend/.env");
        }
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        const User = require('./Backend/src/models/user.model');
        const user = await User.findOneAndUpdate(
            { email },
            { role: 'admin' },
            { returnDocument: 'after' }
        );

        if (!user) {
            console.error(`❌ No user found with email: ${email}`);
        } else {
            console.log(`✅ SUCCESS! User "${user.username}" (${user.email}) is now an ADMIN.`);
        }
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
}

makeAdmin();
