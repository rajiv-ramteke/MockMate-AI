const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: [ true, "username already taken" ],
        required: true,
    },

    email: {
        type: String,
        unique: [ true, "Account already exists with this email address" ],
        required: true,
    },

    password: {
        type: String,
        required: function() {
            // Password is required only if googleId is not present
            return !this.googleId;
        }
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple users without a googleId
    },

    resetPasswordToken: {
        type: String
    },

    resetPasswordExpires: {
        type: Date
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verificationOtp: {
        type: String
    },

    verificationOtpExpires: {
        type: Date
    }
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel