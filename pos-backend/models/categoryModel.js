const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    bgColor: {
        type: String,
        default: '#1f1f1f'
    },
    icon: {
        type: String,
        default: '🍽️'
    }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
