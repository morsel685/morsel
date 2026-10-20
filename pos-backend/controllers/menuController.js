const Category = require('../models/categoryModel');
const Item = require('../models/itemModel');
const createHttpError = require('http-errors');

// --- Category Controllers ---

// Get all categories with their items
const getMenu = async (req, res, next) => {
    try {
        const categories = await Category.find().lean();

        // Fetch items for each category
        const menuData = await Promise.all(categories.map(async (category) => {
            const items = await Item.find({ category: category._id });
            return {
                ...category,
                id: category._id, // Add id field for frontend compatibility
                items: items.map(item => ({
                    ...item.toObject(),
                    id: item._id // Add id field for frontend compatibility
                }))
            };
        }));

        res.status(200).json({ success: true, data: menuData });
    } catch (error) {
        next(error);
    }
};

const createCategory = async (req, res, next) => {
    try {
        const { name, bgColor, icon } = req.body;
        if (!name) {
            return next(createHttpError(400, "Category name is required"));
        }

        const newCategory = new Category({ name, bgColor, icon });
        await newCategory.save();

        res.status(201).json({ success: true, message: "Category created!", data: newCategory });
    } catch (error) {
        next(error);
    }
};

const updateCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, bgColor, icon } = req.body;

        const updatedCategory = await Category.findByIdAndUpdate(id, { name, bgColor, icon }, { new: true });

        if (!updatedCategory) {
            return next(createHttpError(404, "Category not found"));
        }

        res.status(200).json({ success: true, message: "Category updated!", data: updatedCategory });
    } catch (error) {
        next(error);
    }
};

const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return next(createHttpError(404, "Category not found"));
        }

        // Delete all items in this category
        await Item.deleteMany({ category: id });
        await Category.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Category and its items deleted!" });
    } catch (error) {
        next(error);
    }
};

// --- Item Controllers ---

const createItem = async (req, res, next) => {
    try {
        const { name, price, categoryId, image } = req.body;

        if (!name || !price || !categoryId) {
            return next(createHttpError(400, "Name, price, and category are required"));
        }

        const category = await Category.findById(categoryId);
        if (!category) {
            return next(createHttpError(404, "Category not found"));
        }

        const newItem = new Item({
            name,
            price,
            category: categoryId,
            image: image || ''
        });

        await newItem.save();
        res.status(201).json({ success: true, message: "Item added!", data: newItem });

    } catch (error) {
        next(error);
    }
};

const updateItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body; // name, price, description, isAvailable

        const updatedItem = await Item.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedItem) {
            return next(createHttpError(404, "Item not found"));
        }

        res.status(200).json({ success: true, message: "Item updated!", data: updatedItem });
    } catch (error) {
        next(error);
    }
};

const deleteItem = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedItem = await Item.findByIdAndDelete(id);

        if (!deletedItem) {
            return next(createHttpError(404, "Item not found"));
        }

        res.status(200).json({ success: true, message: "Item deleted!" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMenu,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem
};
