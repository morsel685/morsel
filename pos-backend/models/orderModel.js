const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    customerDetails: {
        name: { type: String, default: "Walk-in Customer" },
        phone: { type: String, default: "" },
        guests: { type: Number, default: 1 },
    },
    orderType: {
        type: String,
        enum: ["Dine In", "Take Away"],
        default: "Dine In"
    },
    orderStatus: {
        type: String,
        required: true
    },
    orderNumber: {
        type: String,
        unique: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    bills: {
        total: { type: Number, required: true },
        tax: { type: Number, required: true },
        totalWithTax: { type: Number, required: true }
    },
    items: [],
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    paymentMethod: String,
    paymentData: {
        razorpay_order_id: String,
        razorpay_payment_id: String
    },
    archived: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);