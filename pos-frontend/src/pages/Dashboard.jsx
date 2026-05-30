import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdCategory } from "react-icons/md";
import { BiSolidDish } from "react-icons/bi";
import { HiDocumentReport } from "react-icons/hi";
import Metrics from "../components/dashboard/Metrics";
import RecentOrders from "../components/dashboard/RecentOrders";
import PaymentHistory from "../components/dashboard/PaymentHistory";

const buttons = [
  { label: "Add Category", icon: <MdCategory />, action: "category" },
  { label: "Add Dishes", icon: <BiSolidDish />, action: "dishes" },
];

const tabs = ["Metrics", "Orders", "Payments"];

const Dashboard = () => {

  useEffect(() => {
    document.title = "Morsel | Admin Dashboard"
  }, [])

  const [activeTab, setActiveTab] = useState("Metrics");
  const [isExporting, setIsExporting] = useState(false);

  const navigate = useNavigate();

  const handleOpenModal = (action) => {
    if (action === "category" || action === "dishes") {
      navigate('/menu', { state: { isAdminMode: true } });
    }
  };

  const handleExportSalesReport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/report/daily-sales`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from response header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "Sales_Report.xlsx";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Failed to export sales report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-y-auto pb-10">
      <div className="container mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between py-6 sm:py-10 px-4 sm:px-6 gap-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {buttons.map(({ label, icon, action }) => {
            return (
              <button
                key={action}
                onClick={() => handleOpenModal(action)}
                className="bg-[#1a1a1a] hover:bg-[#262626] px-4 sm:px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-md flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              >
                {label} {icon}
              </button>
            );
          })}
          <button
            onClick={handleExportSalesReport}
            disabled={isExporting}
            className="bg-[#2d5a27] hover:bg-[#3d7a37] disabled:bg-[#1a3a17] disabled:cursor-wait px-4 sm:px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-md flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            {isExporting ? "Exporting..." : "Export Sales Report"} <HiDocumentReport />
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
          {tabs.map((tab) => {
            return (
              <button
                key={tab}
                className={`
                px-4 sm:px-8 py-3 rounded-lg text-[#f5f5f5] font-semibold text-sm sm:text-md flex items-center justify-center gap-2 flex-1 lg:flex-initial ${activeTab === tab
                    ? "bg-[#262626]"
                    : "bg-[#1a1a1a] hover:bg-[#262626]"
                  }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 sm:px-6">
        {activeTab === "Metrics" && <Metrics />}
        {activeTab === "Orders" && <RecentOrders />}
        {activeTab === "Payments" && <PaymentHistory />}
      </div>

    </div>
  );
};

export default Dashboard;

