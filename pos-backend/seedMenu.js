const mongoose = require('mongoose');
const Category = require('./models/categoryModel');
const Item = require('./models/itemModel');
const config = require('./config/config');

// Hardcoded data from frontend constants
const startersItem = [
    { name: "Paneer Tikka", price: 250, categoryName: "Starters" },
    { name: "Chicken Tikka", price: 300, categoryName: "Starters" },
    { name: "Tandoori Chicken", price: 350, categoryName: "Starters" },
    { name: "Samosa", price: 100, categoryName: "Starters" },
    { name: "Aloo Tikki", price: 120, categoryName: "Starters" },
    { name: "Hara Bhara Kebab", price: 220, categoryName: "Starters" }
];

const mainCourse = [
    { name: "Butter Chicken", price: 400, categoryName: "Main Course" },
    { name: "Paneer Butter Masala", price: 350, categoryName: "Main Course" },
    { name: "Chicken Biryani", price: 450, categoryName: "Main Course" },
    { name: "Dal Makhani", price: 180, categoryName: "Main Course" },
    { name: "Kadai Paneer", price: 300, categoryName: "Main Course" },
    { name: "Rogan Josh", price: 500, categoryName: "Main Course" }
];

const beverages = [
    { name: "Masala Chai", price: 50, categoryName: "Beverages" },
    { name: "Lemon Soda", price: 80, categoryName: "Beverages" },
    { name: "Mango Lassi", price: 120, categoryName: "Beverages" },
    { name: "Cold Coffee", price: 150, categoryName: "Beverages" },
    { name: "Fresh Lime Water", price: 60, categoryName: "Beverages" },
    { name: "Iced Tea", price: 100, categoryName: "Beverages" }
];

const soups = [
    { name: "Tomato Soup", price: 120, categoryName: "Soups" },
    { name: "Sweet Corn Soup", price: 130, categoryName: "Soups" },
    { name: "Hot & Sour Soup", price: 140, categoryName: "Soups" },
    { name: "Chicken Clear Soup", price: 160, categoryName: "Soups" },
    { name: "Mushroom Soup", price: 150, categoryName: "Soups" },
    { name: "Lemon Coriander Soup", price: 110, categoryName: "Soups" }
];

const desserts = [
    { name: "Gulab Jamun", price: 100, categoryName: "Desserts" },
    { name: "Kulfi", price: 150, categoryName: "Desserts" },
    { name: "Chocolate Lava Cake", price: 250, categoryName: "Desserts" },
    { name: "Ras Malai", price: 180, categoryName: "Desserts" }
];

const pizzas = [
    { name: "Margherita Pizza", price: 350, categoryName: "Pizzas" },
    { name: "Veg Supreme Pizza", price: 400, categoryName: "Pizzas" },
    { name: "Pepperoni Pizza", price: 450, categoryName: "Pizzas" }
];

const alcoholicDrinks = [
    { name: "Beer", price: 200, categoryName: "Alcoholic Drinks" },
    { name: "Whiskey", price: 500, categoryName: "Alcoholic Drinks" },
    { name: "Vodka", price: 450, categoryName: "Alcoholic Drinks" },
    { name: "Rum", price: 350, categoryName: "Alcoholic Drinks" },
    { name: "Tequila", price: 600, categoryName: "Alcoholic Drinks" },
    { name: "Cocktail", price: 400, categoryName: "Alcoholic Drinks" }
];

const salads = [
    { name: "Caesar Salad", price: 200, categoryName: "Salads" },
    { name: "Greek Salad", price: 250, categoryName: "Salads" },
    { name: "Fruit Salad", price: 150, categoryName: "Salads" },
    { name: "Chicken Salad", price: 300, categoryName: "Salads" },
    { name: "Tuna Salad", price: 350, categoryName: "Salads" }
];

const categoriesData = [
    { name: "Starters", bgColor: "#b73e3e", icon: "🍲" },
    { name: "Main Course", bgColor: "#5b45b0", icon: "🍛" },
    { name: "Beverages", bgColor: "#7f167f", icon: "🍹" },
    { name: "Soups", bgColor: "#735f32", icon: "🍜" },
    { name: "Desserts", bgColor: "#1d2569", icon: "🍰" },
    { name: "Pizzas", bgColor: "#285430", icon: "🍕" },
    { name: "Alcoholic Drinks", bgColor: "#b73e3e", icon: "🍺" },
    { name: "Salads", bgColor: "#5b45b0", icon: "🥗" }
];

const allItems = [
    ...startersItem, ...mainCourse, ...beverages, ...soups,
    ...desserts, ...pizzas, ...alcoholicDrinks, ...salads
];

async function seedMenu() {
    try {
        await mongoose.connect(config.databaseURI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Category.deleteMany({});
        await Item.deleteMany({});
        console.log('🗑️  Cleared existing menu');

        // Insert Categories
        const createdCategories = await Category.insertMany(categoriesData);
        console.log(`✅ Inserted ${createdCategories.length} categories`);

        // Map category names to IDs
        const categoryMap = {};
        createdCategories.forEach(cat => {
            categoryMap[cat.name] = cat._id;
        });

        // Prepare Items with Category IDs
        const itemsToInsert = allItems.map(item => ({
            name: item.name,
            price: item.price,
            category: categoryMap[item.categoryName]
        }));

        // Insert Items
        const createdItems = await Item.insertMany(itemsToInsert);
        console.log(`✅ Inserted ${createdItems.length} items`);

        console.log('🎉 Menu seeded successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding menu:', error);
        process.exit(1);
    }
}

seedMenu();
