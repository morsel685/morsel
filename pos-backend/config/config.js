require("dotenv").config();

const config = Object.freeze({
    port: process.env.PORT || 3000,
    databaseURI: process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV || "development",
    accessTokenSecret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production",
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    razorpaySecretKey: process.env.RAZORPAY_KEY_SECRET,
    razorpyWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    // Email Configuration
    emailService: process.env.EMAIL_SERVICE || "gmail",
    emailUser: process.env.EMAIL_USER,
    emailPassword: process.env.EMAIL_PASSWORD,
    adminEmail: process.env.ADMIN_EMAIL, // Admin email for approval notifications
    frontendUrl: (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, ""),
    restaurantName: process.env.RESTAURANT_NAME || "Restro POS"
});

module.exports = config;
