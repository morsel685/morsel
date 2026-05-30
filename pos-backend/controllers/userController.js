const createHttpError = require("http-errors");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config/config");
const { sendVerificationEmail } = require("../config/emailService");

const register = async (req, res, next) => {
    try {

        const { name, phone, email, password, role } = req.body;

        if (!name || !phone || !email || !password || !role) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email });
        if (isUserPresent) {
            const error = createHttpError(400, "User already exist!");
            return next(error);
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = {
            name,
            phone,
            email,
            password,
            role,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            isEmailVerified: false
        };

        const newUser = User(user);
        await newUser.save();

        // Send verification email to ADMIN (not employee)
        try {
            await sendVerificationEmail(email, verificationToken, name, role, phone);
            res.status(201).json({
                success: true,
                message: "Registration successful! An admin will review and approve your account shortly.",
                data: {
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    requiresVerification: true,
                    pendingAdminApproval: true
                }
            });
        } catch (emailError) {
            // If email fails, still create user but inform about the issue
            console.error("Email sending failed:", emailError);
            res.status(201).json({
                success: true,
                message: "Registration successful! Please contact admin for account activation.",
                data: {
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    emailError: true
                }
            });
        }

    } catch (error) {
        next(error);
    }
}


const login = async (req, res, next) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            const error = createHttpError(400, "All fields are required!");
            return next(error);
        }

        const isUserPresent = await User.findOne({ email });
        if (!isUserPresent) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        const isMatch = await bcrypt.compare(password, isUserPresent.password);
        if (!isMatch) {
            const error = createHttpError(401, "Invalid Credentials");
            return next(error);
        }

        // Check if email is verified
        if (!isUserPresent.isEmailVerified) {
            const error = createHttpError(403, "Please verify your email before logging in. Check your inbox for the verification link.");
            return next(error);
        }

        const accessToken = jwt.sign({ _id: isUserPresent._id }, config.accessTokenSecret, {
            expiresIn: '1d'
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
            sameSite: 'none',
            secure: true
        })

        res.status(200).json({
            success: true, message: "User login successfully!",
            data: isUserPresent,
            token: accessToken
        });


    } catch (error) {
        next(error);
    }

}

const getUserData = async (req, res, next) => {
    try {

        const user = await User.findById(req.user._id);
        res.status(200).json({ success: true, data: user });

    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    try {

        res.clearCookie('accessToken', {
            httpOnly: true,
            sameSite: 'none',
            secure: true
        });
        res.status(200).json({ success: true, message: "User logout successfully!" });

    } catch (error) {
        next(error);
    }
}

const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            const error = createHttpError(400, "Verification token is required!");
            return next(error);
        }

        // Find user with this token (don't check expiry yet)
        const user = await User.findOne({
            emailVerificationToken: token
        });

        if (!user) {
            const error = createHttpError(400, "Invalid verification token!");
            return next(error);
        }

        // Check if already verified
        if (user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: "Email already verified! You can log in.",
                data: {
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        }

        // Check for expiry
        if (user.emailVerificationExpires < Date.now()) {
            const error = createHttpError(400, "Verification token has expired!");
            return next(error);
        }

        // Update user as verified
        user.isEmailVerified = true;
        // Do NOT delete the token immediately, so subsequent clicks show "Already verified" instead of "Invalid"
        // user.emailVerificationToken = null; 
        // user.emailVerificationExpires = null;
        await user.save();

        // Send welcome email
        const { sendWelcomeEmail } = require("../config/emailService");
        try {
            await sendWelcomeEmail(user.email, user.name, user.role);
        } catch (emailError) {
            console.error("Welcome email failed:", emailError);
        }

        res.status(200).json({
            success: true,
            message: "Email verified successfully! You can now log in.",
            data: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
}




module.exports = { register, login, getUserData, logout, verifyEmail }