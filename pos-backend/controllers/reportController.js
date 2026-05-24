const ExcelJS = require("exceljs");
const Order = require("../models/orderModel");

const getDailySalesReport = async (req, res, next) => {
    try {
        // Get date from query params or use today
        const dateParam = req.query.date;
        let startDate, endDate;

        if (dateParam) {
            startDate = new Date(dateParam);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(dateParam);
            endDate.setHours(23, 59, 59, 999);
        } else {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        }

        // Fetch all orders for the date
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate },
        }).populate("table");

        // Calculate summary statistics
        let totalOrders = orders.length;
        let completedOrders = orders.filter(o => o.orderStatus === "Completed" || o.orderStatus === "completed").length;
        let cancelledOrders = orders.filter(o => o.orderStatus === "Cancelled" || o.orderStatus === "cancelled").length;
        let cashTotal = 0;
        let upiTotal = 0;
        let grandTotal = 0;

        orders.forEach((order) => {
            if (order.orderStatus !== "Cancelled" && order.orderStatus !== "cancelled") {
                grandTotal += order.bills?.total || 0;

                const paymentMethod = (order.paymentMethod || "").toLowerCase();
                if (paymentMethod === "cash") {
                    cashTotal += order.bills?.total || 0;
                } else if (paymentMethod === "upi" || paymentMethod === "online" || paymentMethod === "razorpay") {
                    upiTotal += order.bills?.total || 0;
                }
            }
        });

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = "POS System";
        workbook.created = new Date();

        // ========== Sheet 1: Settlement Summary ==========
        const summarySheet = workbook.addWorksheet("Day End Settlement");

        // Set column widths
        summarySheet.columns = [
            { width: 30 },
            { width: 25 },
        ];

        // Title
        summarySheet.addRow(["DAILY SETTLEMENT REPORT", ""]);
        summarySheet.getRow(1).font = { bold: true, size: 16 };
        summarySheet.mergeCells("A1:B1");
        summarySheet.getCell("A1").alignment = { horizontal: "center" };

        summarySheet.addRow([]);

        // Report Date
        const reportDateStr = startDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
        summarySheet.addRow(["Report Date", reportDateStr]);
        summarySheet.getRow(3).font = { bold: true };

        summarySheet.addRow([]);

        // Order Summary Section
        summarySheet.addRow(["ORDER SUMMARY", ""]);
        summarySheet.getRow(5).font = { bold: true, size: 12, color: { argb: "FF4472C4" } };

        summarySheet.addRow(["Total Orders", totalOrders]);
        summarySheet.addRow(["Completed Orders", completedOrders]);
        summarySheet.addRow(["Cancelled Orders", cancelledOrders]);

        summarySheet.addRow([]);

        // Payment Settlement Section
        summarySheet.addRow(["PAYMENT SETTLEMENT", ""]);
        summarySheet.getRow(10).font = { bold: true, size: 12, color: { argb: "FF4472C4" } };

        summarySheet.addRow(["Cash Collection", `₹${cashTotal.toLocaleString("en-IN")}`]);
        summarySheet.addRow(["UPI Collection", `₹${upiTotal.toLocaleString("en-IN")}`]);

        summarySheet.addRow(["Total Day Settlement", `₹${grandTotal.toLocaleString("en-IN")}`]);
        summarySheet.getRow(13).font = { bold: true, size: 14 };
        summarySheet.getRow(13).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE2EFDA" },
        };

        summarySheet.addRow([]);

        // Revenue Section
        summarySheet.addRow(["REVENUE SUMMARY", ""]);
        summarySheet.getRow(15).font = { bold: true, size: 12, color: { argb: "FF4472C4" } };

        summarySheet.addRow(["Total Revenue", `₹${grandTotal.toLocaleString("en-IN")}`]);
        summarySheet.getRow(16).font = { bold: true };

        summarySheet.addRow([]);

        // Generated timestamp
        const generatedAt = new Date().toLocaleString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
        summarySheet.addRow(["Generated At", generatedAt]);
        summarySheet.getRow(19).font = { italic: true, color: { argb: "FF808080" } };

        // ========== Sheet 2: Order Details ==========
        const ordersSheet = workbook.addWorksheet("Order Details");

        // Headers
        ordersSheet.columns = [
            { header: "Order #", key: "orderNum", width: 10 },
            { header: "Time", key: "time", width: 12 },
            { header: "Customer", key: "customer", width: 15 },
            { header: "Phone", key: "phone", width: 15 },
            { header: "Guests", key: "guests", width: 8 },
            { header: "Table", key: "table", width: 12 },
            { header: "Items", key: "items", width: 40 },
            { header: "Total", key: "total", width: 12 },
            { header: "Payment", key: "payment", width: 12 },
            { header: "Status", key: "status", width: 12 },
        ];

        // Style header row
        ordersSheet.getRow(1).font = { bold: true };
        ordersSheet.getRow(1).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4472C4" },
        };
        ordersSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

        // Add order data
        orders.forEach((order, index) => {
            const itemsStr = (order.items || [])
                .map((item) => `${item.quantity}x ${item.name}`)
                .join(", ");

            const timeStr = new Date(order.createdAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });

            ordersSheet.addRow({
                orderNum: index + 1,
                time: timeStr,
                customer: order.customerDetails?.name || "-",
                phone: order.customerDetails?.phone || "-",
                guests: order.customerDetails?.guests || 0,
                table: order.table?.name || order.table?.tableNumber || "-",
                items: itemsStr || "-",
                total: `₹${(order.bills?.total || 0).toLocaleString("en-IN")}`,
                payment: order.paymentMethod || "-",
                status: order.orderStatus || "-",
            });
        });

        // Set response headers for file download
        const fileName = `Sales_Report_${reportDateStr.replace(/\s/g, "_")}.xlsx`;
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        next(error);
    }
};

module.exports = { getDailySalesReport };
