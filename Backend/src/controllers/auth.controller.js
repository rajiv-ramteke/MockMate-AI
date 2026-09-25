const userModel = require("../models/user.model")
const { initializeApp, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Initialize Firebase Admin
if (getApps().length === 0) {
    initializeApp({
        projectId: "interviewgenius-fee19"
    });
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        const existingUsers = await userModel.find({
            $or: [ { username }, { email } ]
        })

        for (const existingUser of existingUsers) {
            if (!existingUser.isVerified) {
                // Clean up unverified accounts so the user can re-register
                await userModel.findByIdAndDelete(existingUser._id)
            } else {
                if (existingUser.email === email) {
                    return res.status(400).json({
                        message: "Account already exists with this email address"
                    })
                }
                if (existingUser.username === username) {
                    return res.status(400).json({
                        message: "Account already exists with this username"
                    })
                }
            }
        }

        const hash = await bcrypt.hash(password, 10)

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash,
            isVerified: false,
            verificationOtp: hashedOtp,
            verificationOtpExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        })

        console.log("Verification OTP:", otp); // For local testing

        if (process.env.SMTP_HOST) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) || 465,
                    secure: true,
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                await transporter.sendMail({
                    from: `"MockMate AI" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: 'Account Verification OTP',
                    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f0f1a;color:#e0e0e0;border-radius:12px">
  <h2 style="color:#a78bfa">🧠 MockMate AI</h2>
  <p>Welcome! Please verify your email to activate your account.</p>
  <div style="background:#1e1e2e;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
    <p style="margin:0;font-size:14px;color:#a0a0b0">Your verification OTP is:</p>
    <h1 style="letter-spacing:12px;color:#a78bfa;margin:12px 0">${otp}</h1>
    <p style="margin:0;font-size:12px;color:#666">Expires in 10 minutes</p>
  </div>
  <p style="font-size:12px;color:#555">If you didn't register, please ignore this email.</p>
</div>`
                });
            } catch (emailErr) {
                console.error("⚠️ Failed to send verification email:", emailErr.message);
            }
        }

        res.status(201).json({
            message: "User registered successfully. Please verify your email.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("registerUserController error:", err)
        res.status(500).json({ message: "Registration failed. Please try again." })
    }
}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                message: "Please provide username/email and password"
            });
        }

        // Find by email or username
        const user = await userModel.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user || !user.password) {
            return res.status(400).json({
                message: "Invalid credentials"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid credentials"
            })
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email address before logging in",
                unverified: true
            })
        }

        if (user.isBanned) {
            return res.status(403).json({
                message: `Your account has been banned. Reason: ${user.bannedReason || "Violated terms of service"}`
            })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        )

        // Update last login timestamp
        user.lastLogin = new Date()
        await user.save()

        res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true })
        res.status(200).json({
            message: "User loggedIn successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        })
    } catch (err) {
        console.error("loginUserController error:", err)
        res.status(500).json({ message: "Login failed. Please try again." })
    }
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true })

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)



    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    })

}



async function googleAuthController(req, res) {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ success: false, message: "Token is required" });
        }

        // Verify Firebase ID Token
        const decodedToken = await getAuth().verifyIdToken(credential);
        const { email, name, picture, uid } = decodedToken;

        // Check if user already exists
        let user = await userModel.findOne({ email });

        if (!user) {
            // Generate a random secure password for google users (since they login via google)
            const randomPassword = crypto.randomBytes(16).toString("hex");
            const hash = await bcrypt.hash(randomPassword, 10);

            user = await userModel.create({
                username: name.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 10000),
                email: email,
                password: hash,
                isVerified: true, // Google users are already verified
                googleId: uid
            });
        }

        const jwtToken = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", jwtToken, { httpOnly: true, sameSite: "none", secure: true });
        res.status(200).json({
            success: true,
            message: "Google login successful",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified,
                role: user.role
            },
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ success: false, message: "Google authentication failed", error: error.message });
    }
}

async function forgotPasswordController(req, res) {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found with this email" });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        
        console.log("Password Reset URL:", resetUrl); // For testing locally without SMTP

        if (process.env.SMTP_HOST) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) || 465,
                    secure: true,
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                await transporter.sendMail({
                    from: `"MockMate AI" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: 'Password Reset Request',
                    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f0f1a;color:#e0e0e0;border-radius:12px">
  <h2 style="color:#a78bfa">🧠 MockMate AI</h2>
  <p>We received a request to reset your password.</p>
  <div style="text-align:center;margin:24px 0">
    <a href="${resetUrl}" style="background:linear-gradient(135deg,#a78bfa,#6d28d9);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Reset Password</a>
  </div>
  <p style="font-size:13px;color:#888">Or copy this link: <a href="${resetUrl}" style="color:#a78bfa">${resetUrl}</a></p>
  <p style="font-size:12px;color:#555;margin-top:24px">This link expires in 10 minutes. If you didn't request this, ignore this email.</p>
</div>`
                });
            } catch (emailErr) {
                console.error("⚠️ Failed to send reset email:", emailErr.message);
            }
        }

        res.status(200).json({ message: "Password reset link sent (check console if local)" });
    } catch (err) {
        console.error("forgotPasswordController error:", err);
        res.status(500).json({ message: "Error sending password reset email" });
    }
}

async function resetPasswordController(req, res) {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await userModel.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
        console.error("resetPasswordController error:", err);
        res.status(500).json({ message: "Error resetting password" });
    }
}

async function verifyOtpController(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Please provide email and OTP" });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User is already verified" });
        }

        if (!user.verificationOtp || !user.verificationOtpExpires || user.verificationOtpExpires < Date.now()) {
            return res.status(400).json({ message: "OTP expired or invalid" });
        }

        const isOtpValid = await bcrypt.compare(otp, user.verificationOtp);

        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.isVerified = true;
        user.verificationOtp = undefined;
        user.verificationOtpExpires = undefined;
        await user.save();

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, { httpOnly: true, sameSite: "none", secure: true });
        res.status(200).json({
            message: "Email verified successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error("verifyOtpController error:", err);
        res.status(500).json({ message: "OTP verification failed" });
    }
}

async function resendOtpController(req, res) {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "User is already verified" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.verificationOtp = hashedOtp;
        user.verificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        console.log("Resend Verification OTP:", otp);

        if (process.env.SMTP_HOST) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT) || 465,
                    secure: true,
                    connectionTimeout: 5000,
                    greetingTimeout: 5000,
                    socketTimeout: 5000,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });

                await transporter.sendMail({
                    from: `"MockMate AI" <${process.env.SMTP_USER}>`,
                    to: user.email,
                    subject: 'New Account Verification OTP',
                    html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0f0f1a;color:#e0e0e0;border-radius:12px">
  <h2 style="color:#a78bfa">🧠 MockMate AI</h2>
  <p>Here is your new verification OTP.</p>
  <div style="background:#1e1e2e;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
    <p style="margin:0;font-size:14px;color:#a0a0b0">Your verification OTP is:</p>
    <h1 style="letter-spacing:12px;color:#a78bfa;margin:12px 0">${otp}</h1>
    <p style="margin:0;font-size:12px;color:#666">Expires in 10 minutes</p>
  </div>
  <p style="font-size:12px;color:#555">If you didn't request this, please ignore this email.</p>
</div>`
                });
            } catch (emailErr) {
                console.error("⚠️ Failed to send resend OTP email:", emailErr.message);
            }
        }

        res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
        console.error("resendOtpController error:", err);
        res.status(500).json({ message: "Failed to resend OTP" });
    }
}


module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    googleAuthController,
    forgotPasswordController,
    resetPasswordController,
    verifyOtpController,
    resendOtpController
}