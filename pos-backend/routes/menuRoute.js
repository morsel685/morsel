const express = require('express');
const {
    getMenu,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem
} = require('../controllers/menuController');
const { isVerifiedUser } = require('../middlewares/tokenVerification');

const router = express.Router();

// Publicly accessible menu (or authenticated items only? Let's keep it authenticated for now)
router.get('/', isVerifiedUser, getMenu);

// Category Routes
router.post('/category', isVerifiedUser, createCategory);
router.put('/category/:id', isVerifiedUser, updateCategory);
router.delete('/category/:id', isVerifiedUser, deleteCategory);

// Item Routes
router.post('/item', isVerifiedUser, createItem);
router.put('/item/:id', isVerifiedUser, updateItem);
router.delete('/item/:id', isVerifiedUser, deleteItem);

module.exports = router;
