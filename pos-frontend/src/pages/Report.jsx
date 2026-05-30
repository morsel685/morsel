import React, { useState, useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDailyReport, closeDay } from "../https/index";
import { enqueueSnackbar } from "notistack";

const Report = () => {
    const queryClient = useQueryClient();
    const [showConfirmClose, setShowConfirmClose] = useState(false);

    useEffect(() => {
        document.title = "Morsel | Daily Report";
    }, []);

    const { data: reportData, isLoading, isError, refetch } = useQuery({
        queryKey: ["dailyReport"],
        queryFn: async () => {
            const res = await getDailyReport();
            return res.data.data;
        },
        refetchOnMount: 'always',
    });

    const closeDayMutation = useMutation({
        mutationFn: closeDay,
        onSuccess: (res) => {
            enqueueSnackbar(res.data.message, { variant: "success" });
            setShowConfirmClose(false);
            // Invalidate all related queries to refresh data
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["tables"] });
            queryClient.invalidateQueries({ queryKey: ["dailyReport"] });
        },
        onError: (error) => {
            enqueueSnackbar(error.response?.data?.message || "Failed to close day", { variant: "error" });
        }
    });

    const handleExportExcel = () => {
        if (!reportData?.orders?.length) {
            enqueueSnackbar("No orders to export", { variant: "warning" });
            return;
        }

        // Create CSV content with order details
        const headers = [
            "Order ID",
            "Date & Time",
            "Customer Name",
            "Phone",
            "Order Type",
            "Table",
            "Items",
            "Total",
            "Status",
            "Payment Method"
        ];

        const rows = reportData.orders.map(order => {
            const itemsList = order.items?.map(item => `${item.name} x${item.quantity || 1}`).join("; ") || "";
            return [
                order._id,
                new Date(order.createdAt).toLocaleString(),
                order.customerDetails?.name || "Walk-in",
                order.customerDetails?.phone || "",
                order.orderType || "Dine In",
                order.table?.tableNo || "N/A",
                itemsList,
                order.bills?.total?.toFixed(2) || "0.00",
                order.orderStatus || "",
                order.paymentMethod || ""
            ];
        });

        // Add summary rows
        rows.push([]);
        rows.push(["SUMMARY"]);
        rows.push(["Total Orders", reportData.summary?.totalOrders || 0]);
        rows.push(["Completed Orders", reportData.summary?.completedOrders || 0]);
        rows.push(["Cancelled Orders", reportData.summary?.cancelledOrders || 0]);
        rows.push(["Total Revenue", reportData.revenue?.totalRevenue || "0.00"]);
        rows.push(["Cash Payments", reportData.payments?.cash?.total || "0.00"]);
        rows.push(["UPI Payments", reportData.payments?.upi?.total || "0.00"]);

        // Convert to CSV
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        // Download file
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Daily_Report_${reportData.date}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        enqueueSnackbar("Report exported successfully!", { variant: "success" });
    };

    const handlePrintReport = () => {
        const printContent = `
      <html>
        <head>
          <title>Daily Report - ${reportData?.date}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
            h1 { text-align: center; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .section h2 { margin-top: 0; font-size: 16px; color: #666; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; }
            .total { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
            hr { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Daily Closing Report</h1>
          <p style="text-align: center;">${reportData?.date || 'N/A'}</p>
          
          <div class="section">
            <h2>Order Summary</h2>
            <div class="row"><span>Total Orders:</span><span>${reportData?.summary?.totalOrders || 0}</span></div>
            <div class="row"><span>Completed Orders:</span><span>${reportData?.summary?.completedOrders || 0}</span></div>
            <div class="row"><span>Cancelled Orders:</span><span>${reportData?.summary?.cancelledOrders || 0}</span></div>
            <div class="row"><span>Pending Orders:</span><span>${reportData?.summary?.pendingOrders || 0}</span></div>
            <hr/>
            <div class="row"><span>Dine In:</span><span>${reportData?.summary?.dineInOrders || 0}</span></div>
            <div class="row"><span>Take Away:</span><span>${reportData?.summary?.takeAwayOrders || 0}</span></div>
          </div>
          
          <div class="section">
            <h2>Revenue</h2>
            <div class="row" style="font-weight: bold; font-size: 18px;"><span>Total Revenue:</span><span>Rs.${reportData?.revenue?.subtotal || '0.00'}</span></div>
          </div>
          
          <div class="section">
            <h2>Payment Breakdown</h2>
            <div class="row"><span>Cash (${reportData?.payments?.cash?.count || 0}):</span><span>Rs.${reportData?.payments?.cash?.total || '0.00'}</span></div>
            <div class="row"><span>UPI (${reportData?.payments?.upi?.count || 0}):</span><span>Rs.${reportData?.payments?.upi?.total || '0.00'}</span></div>
          </div>
          
          <div class="section">
            <h2>Items Sold</h2>
            <div class="row"><span>Total Items:</span><span>${reportData?.itemsSold || 0}</span></div>
          </div>
          
          <p style="text-align: center; margin-top: 40px; color: #666;">Generated at ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    if (isLoading) {
        return (
            <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] flex items-center justify-center">
                <p className="text-white text-xl">Loading report...</p>
            </section>
        );
    }

  return (
        <section className="bg-[#1f1f1f] min-h-[calc(100vh-5rem)] overflow-y-auto pb-20 lg:h-[calc(100vh-5rem)] lg:overflow-hidden flex flex-col">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-2 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <BackButton />
                    <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
                        Daily Report
                    </h1>
                </div>
                <p className="text-[#ababab] text-md sm:text-lg">{reportData?.date || new Date().toISOString().split('T')[0]}</p>
            </div>

            <div className="px-4 sm:px-16 py-4 overflow-y-auto lg:h-[calc(100vh-14rem)] min-h-0 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Order Summary Card */}
                    <div className="bg-[#262626] p-6 rounded-xl">
                        <h2 className="text-[#ababab] text-sm font-semibold mb-4">ORDER SUMMARY</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-[#ababab]">Total Orders</span>
                                <span className="text-white font-bold text-2xl">{reportData?.summary?.totalOrders || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-green-500">Completed</span>
                                <span className="text-green-500 font-semibold">{reportData?.summary?.completedOrders || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-red-500">❌ Cancelled</span>
                                <span className="text-red-500 font-semibold">{reportData?.summary?.cancelledOrders || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-yellow-500">Pending</span>
                                <span className="text-yellow-500 font-semibold">{reportData?.summary?.pendingOrders || 0}</span>
                            </div>
                            <hr className="border-[#3a3a3a]" />
                            <div className="flex justify-between">
                                <span className="text-[#ababab]">Dine In</span>
                                <span className="text-white font-semibold">{reportData?.summary?.dineInOrders || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[#ababab]">Take Away</span>
                                <span className="text-white font-semibold">{reportData?.summary?.takeAwayOrders || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-[#262626] p-6 rounded-xl">
                        <h2 className="text-[#ababab] text-sm font-semibold mb-4">REVENUE</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[#ababab]">Total Revenue</span>
                                <span className="text-green-500 font-bold text-3xl">Rs.{reportData?.revenue?.subtotal || '0.00'}</span>
                            </div>
                            <div className="mt-6 pt-4 border-t border-[#3a3a3a]">
                                <div className="flex justify-between">
                                    <span className="text-[#ababab]">Items Sold</span>
                                    <span className="text-white font-bold text-xl">{reportData?.itemsSold || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Breakdown Card */}
                    <div className="bg-[#262626] p-6 rounded-xl">
                        <h2 className="text-[#ababab] text-sm font-semibold mb-4">PAYMENT BREAKDOWN</h2>
                        <div className="space-y-4">
                            <div className="bg-[#1a3a1a] p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-green-500 font-semibold">Cash</p>
                                        <p className="text-[#ababab] text-sm">{reportData?.payments?.cash?.count || 0} transactions</p>
                                    </div>
                                    <span className="text-green-500 font-bold text-xl">Rs.{reportData?.payments?.cash?.total || '0.00'}</span>
                                </div>
                            </div>
                            <div className="bg-[#2a1a3a] p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-purple-500 font-semibold">UPI</p>
                                        <p className="text-[#ababab] text-sm">{reportData?.payments?.upi?.count || 0} transactions</p>
                                    </div>
                                    <span className="text-purple-500 font-bold text-xl">Rs.{reportData?.payments?.upi?.total || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 py-3.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-semibold text-md sm:text-lg"
                    >
                        Export to Excel (CSV)
                    </button>
                    <button
                        onClick={handlePrintReport}
                        className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-md sm:text-lg"
                    >
                        Print Report
                    </button>
                    <button
                        onClick={() => setShowConfirmClose(true)}
                        disabled={reportData?.summary?.pendingOrders > 0}
                        className={`flex-1 py-3.5 rounded-xl font-semibold text-md sm:text-lg ${reportData?.summary?.pendingOrders > 0
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-500 text-white"
                            }`}
                    >
                        {reportData?.summary?.pendingOrders > 0
                            ? `Close Day (${reportData?.summary?.pendingOrders} pending)`
                            : "Close Day & Clear Orders"}
                    </button>
                </div>

                {/* Confirm Close Modal */}
                {showConfirmClose && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <div className="bg-[#262626] p-8 rounded-xl max-w-md w-full mx-4">
                            <h2 className="text-white text-xl font-bold mb-4">Close Day</h2>
                            <p className="text-[#ababab] mb-6">
                                Are you sure you want to close the day? This will:
                            </p>
                            <ul className="text-[#ababab] mb-6 space-y-2">
                                <li>• Archive all today's orders</li>
                                <li>• Clear the orders section</li>
                                <li>• Reset all tables to Available</li>
                            </ul>
                            <p className="text-yellow-500 text-sm mb-6">
                                This action cannot be undone. Make sure you have exported the report.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowConfirmClose(false)}
                                    className="flex-1 py-3 bg-[#333] hover:bg-[#444] text-white rounded-lg font-semibold"
                                >
                                    ❌ Cancel
                                </button>
                                <button
                                    onClick={() => closeDayMutation.mutate()}
                                    disabled={closeDayMutation.isPending}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {closeDayMutation.isPending ? "Closing..." : "Confirm Close"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </section>
    );
};

export default Report;
