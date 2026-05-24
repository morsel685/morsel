import React, { useMemo } from "react";
import { FaChartLine, FaUtensils, FaMoneyBillWave, FaUsers } from "react-icons/fa";
import { BiTrendingUp } from "react-icons/bi";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders } from "../../https/index";

const AnalyticsReport = () => {
    const { data: resData } = useQuery({
        queryKey: ["orders"],
        queryFn: async () => {
            return await getOrders();
        },
        placeholderData: keepPreviousData,
    });

    // Calculate analytics from real data
    const analytics = useMemo(() => {
        const orders = resData?.data?.data || [];

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter orders for today
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        });

        // Calculate today's revenue
        const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.bills?.total || 0), 0);

        // Today's order count
        const todayOrderCount = todayOrders.length;

        // Average order value
        const avgOrderValue = todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0;

        // Find top dish
        const itemCounts = {};
        todayOrders.forEach(order => {
            order.items?.forEach(item => {
                const itemName = item.name || item.itemName;
                if (itemName) {
                    itemCounts[itemName] = (itemCounts[itemName] || 0) + (item.quantity || 1);
                }
            });
        });

        const topDishEntry = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];
        const topDish = topDishEntry ? topDishEntry[0] : "N/A";
        const topDishOrders = topDishEntry ? topDishEntry[1] : 0;

        return {
            todayRevenue: Math.round(todayRevenue),
            todayOrders: todayOrderCount,
            avgOrderValue,
            topDish,
            topDishOrders
        };
    }, [resData]);

    return (
        <div className="px-8 mt-6 pb-24">
            <div className="bg-[#1a1a1a] w-full rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide flex items-center gap-2">
                        <FaChartLine className="text-yellow-500" />
                        Analytics Report
                    </h1>
                    <span className="text-xs text-gray-400">Today's Overview</span>
                </div>

                {/* Analytics Cards */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Revenue Card */}
                    <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-600/30 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-600/20 rounded-lg">
                                <FaMoneyBillWave className="text-green-500 text-xl" />
                            </div>
                            <span className="text-gray-400 text-sm">Today's Revenue</span>
                        </div>
                        <p className="text-2xl font-bold text-white">₹{analytics.todayRevenue}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <BiTrendingUp className="text-green-500 text-sm" />
                            <span className="text-green-500 text-xs">Live data</span>
                        </div>
                    </div>

                    {/* Orders Card */}
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-600/30 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-600/20 rounded-lg">
                                <FaUsers className="text-blue-500 text-xl" />
                            </div>
                            <span className="text-gray-400 text-sm">Orders Today</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{analytics.todayOrders}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <BiTrendingUp className="text-blue-500 text-sm" />
                            <span className="text-blue-500 text-xs">Live data</span>
                        </div>
                    </div>

                    {/* Avg Order Value */}
                    <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-600/30 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-600/20 rounded-lg">
                                <FaChartLine className="text-purple-500 text-xl" />
                            </div>
                            <span className="text-gray-400 text-sm">Avg Order Value</span>
                        </div>
                        <p className="text-2xl font-bold text-white">₹{analytics.avgOrderValue}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <BiTrendingUp className="text-purple-500 text-sm" />
                            <span className="text-purple-500 text-xs">Live data</span>
                        </div>
                    </div>

                    {/* Top Dish */}
                    <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/10 border border-yellow-600/30 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-600/20 rounded-lg">
                                <FaUtensils className="text-yellow-500 text-xl" />
                            </div>
                            <span className="text-gray-400 text-sm">Top Dish</span>
                        </div>
                        <p className="text-lg font-bold text-white truncate">{analytics.topDish}</p>
                        <span className="text-yellow-500 text-xs">{analytics.topDishOrders} orders</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsReport;
