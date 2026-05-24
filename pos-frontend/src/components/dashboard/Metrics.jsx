import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "../../https";
import { FaSpinner } from "react-icons/fa"; // Assuming react-icons is available

const Metrics = () => {
  const [period, setPeriod] = useState("monthly");

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["dashboardStats", period],
    queryFn: () => getDashboardStats(period),
    refetchInterval: 30000, // Real-time update every 30s
  });

  const stats = response?.data?.data;

  const metricsData = [
    {
      title: "Revenue",
      value: stats?.periodStats?.totalRevenue
        ? `₹${stats.periodStats.totalRevenue.toLocaleString()}`
        : "₹0",
      percentage: "N/A", // comparative data not yet implemented
      color: "#025cca",
      isIncrease: true,
    },
    {
      title: "Total Orders",
      value: stats?.periodStats?.totalOrders || 0,
      percentage: "N/A",
      color: "#02ca3a",
      isIncrease: true,
    },
    {
      title: "Total Customers",
      value: stats?.periodStats?.totalCustomers || 0,
      percentage: "N/A",
      color: "#f6b100",
      isIncrease: true,
    },
    {
      title: "Avg Order Value",
      value: stats?.periodStats?.totalOrders > 0
        ? `₹${Math.round(stats.periodStats.totalRevenue / stats.periodStats.totalOrders).toLocaleString()}`
        : "₹0",
      percentage: "N/A",
      color: "#be3e3f",
      isIncrease: false,
    },
  ];

  const itemsData = [
    {
      title: "Total Categories",
      value: stats?.totalCategories || 0,
      percentage: "12%",
      color: "#5b45b0",
      isIncrease: false,
    },
    {
      title: "Total Dishes",
      value: stats?.totalDishes || 0,
      percentage: "12%",
      color: "#285430",
      isIncrease: true,
    },
    {
      title: "Active Orders",
      value: stats?.activeOrders || 0,
      percentage: "12%",
      color: "#735f32",
      isIncrease: true,
    },
    {
      title: "Total Tables",
      value: stats?.totalTables || 0,
      color: "#7f167f",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500 text-center p-4">Failed to load dashboard data.</div>;
  }

  return (
    <div className="container mx-auto py-2 px-6 md:px-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Overall Performance
          </h2>
          <p className="text-sm text-[#ababab]">
            Track your restaurant's key metrics.
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-[#1a1a1a] text-[#f5f5f5] px-4 py-2 rounded-md outline-none border border-[#333] cursor-pointer"
        >
          <option value="daily">Today</option>
          <option value="weekly">Last 7 Days</option>
          <option value="monthly">Last 1 Month</option>
          <option value="yearly">Last 1 Year</option>
        </select>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, index) => {
          return (
            <div
              key={index}
              className="shadow-sm rounded-lg p-4"
              style={{ backgroundColor: metric.color }}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium text-xs text-[#f5f5f5]">
                  {metric.title}
                </p>
                {/* Percentage change placeholder - hidden if N/A to keep cleaner */}
                {metric.percentage !== "N/A" && (
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                    >
                      <path
                        d={
                          metric.isIncrease ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"
                        }
                      />
                    </svg>
                    <p
                      className="font-medium text-xs"
                      style={{ color: metric.isIncrease ? "#f5f5f5" : "red" }}
                    >
                      {metric.percentage}
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">
                {metric.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col justify-between mt-12">
        <div>
          <h2 className="font-semibold text-[#f5f5f5] text-xl">
            Item Details
          </h2>
          <p className="text-sm text-[#ababab]">
            Overview of your inventory and current status.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {itemsData.map((item, index) => {
            return (
              <div
                key={index}
                className="shadow-sm rounded-lg p-4"
                style={{ backgroundColor: item.color }}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-xs text-[#f5f5f5]">
                    {item.title}
                  </p>
                  {item.percentage && (
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      >
                        <path d="M5 15l7-7 7 7" />
                      </svg>
                      <p className="font-medium text-xs text-[#f5f5f5]">
                        {item.percentage}
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-1 font-semibold text-2xl text-[#f5f5f5]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Metrics;
