const Category = require("../models/categoryModel");
const Item = require("../models/itemModel");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");

const getDashboardStats = async (req, res, next) => {
    try {
        const { period } = req.query;
        let startDate = new Date();

        // Calculate start date based on period
        if (period === 'daily') {
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'weekly') {
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'monthly') {
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'yearly') {
            startDate.setFullYear(startDate.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
        } else {
            // Default to monthly
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
        }

        const [
            totalCategories,
            totalDishes,
            activeOrders,
            totalTables,
            revenueStats,
            totalOrders,
            totalCustomers
        ] = await Promise.all([
            Category.countDocuments(),
            Item.countDocuments(),
            Order.countDocuments({ orderStatus: { $in: ["In Progress", "Ready"] } }),
            Table.countDocuments(),
            Order.aggregate([
                {
                    $match: {
                        orderDate: { $gte: startDate },
                        orderStatus: { $ne: "Cancelled" } // Assuming we exclude cancelled
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: "$bills.totalWithTax" }
                    }
                }
            ]),
            Order.countDocuments({ orderDate: { $gte: startDate } }),
            Order.distinct("customerDetails.phone", { orderDate: { $gte: startDate } })
        ]);

        const totalRevenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
        const uniqueCustomers = totalCustomers.length;

        res.status(200).json({
            success: true,
            data: {
                totalCategories,
                totalDishes,
                activeOrders,
                totalTables,
                periodStats: {
                    totalRevenue,
                    totalOrders,
                    totalCustomers: uniqueCustomers
                }
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getDashboardStats };
