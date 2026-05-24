const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    image: {
        type: String, // URL or path
        default: ''
    }
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
