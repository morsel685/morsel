const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const Table = require("../models/tableModel");
const { default: mongoose } = require("mongoose");

const addOrder = async (req, res, next) => {
  try {
    const { table, orderType } = req.body;

    // Only check for Dine In orders with a table
    if (table && orderType !== "Take Away") {
      // Check if the table is already booked by looking at table status
      const tableDoc = await Table.findById(table);

      if (tableDoc && tableDoc.status === "Booked") {
        const error = createHttpError(400, "Table already has an active order. Complete or cancel the existing order first.");
        return next(error);
      }
    }

    // Generate sequential order number in format YYYYMMDDXXX
    const today = new Date();
    const datePrefix = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0');

    // Find today's orders to get the next sequence number
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayOrderCount = await Order.countDocuments({
      orderDate: { $gte: startOfDay, $lt: endOfDay }
    });

    const sequenceNumber = String(todayOrderCount + 1).padStart(3, '0');
    const orderNumber = datePrefix + sequenceNumber;

    const order = new Order({
      ...req.body,
      orderNumber: orderNumber
    });
    await order.save();
    res
      .status(201)
      .json({ success: true, message: "Order created!", data: order });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const order = await Order.findById(id);
    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    // Only get non-archived orders
    const orders = await Order.find({ archived: { $ne: true } }).populate("table");
    res.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const { orderStatus, paymentMethod, items, bills, customerDetails } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (items) updateData.items = items;
    if (bills) updateData.bills = bills;
    if (customerDetails) updateData.customerDetails = customerDetails;

    const order = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!order) {
      const error = createHttpError(404, "Order not found!");
      return next(error);
    }

    res
      .status(200)
      .json({ success: true, message: "Order updated", data: order });
  } catch (error) {
    next(error);
  }
};

// Get daily report
const getDailyReport = async (req, res, next) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get all orders for today
    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lt: endOfDay }
    }).populate("table");

    // Calculate statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.orderStatus === "Completed");
    const cancelledOrders = orders.filter(o => o.orderStatus === "Cancelled");
    const pendingOrders = orders.filter(o => !["Completed", "Cancelled"].includes(o.orderStatus));

    const dineInOrders = orders.filter(o => o.orderType !== "Take Away");
    const takeAwayOrders = orders.filter(o => o.orderType === "Take Away");

    // Calculate revenue (only from completed orders) - no tax
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.bills?.total || 0), 0);

    // Payment breakdown
    const cashPayments = completedOrders.filter(o => o.paymentMethod === "Cash");
    const upiPayments = completedOrders.filter(o => o.paymentMethod === "UPI");
    const cashTotal = cashPayments.reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);
    const upiTotal = upiPayments.reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);

    // Items sold
    const allItems = completedOrders.flatMap(o => o.items || []);
    const totalItemsSold = allItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const report = {
      date: startOfDay.toISOString().split('T')[0],
      summary: {
        totalOrders,
        completedOrders: completedOrders.length,
        cancelledOrders: cancelledOrders.length,
        pendingOrders: pendingOrders.length,
        dineInOrders: dineInOrders.length,
        takeAwayOrders: takeAwayOrders.length,
      },
      revenue: {
        subtotal: totalRevenue.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
      },
      payments: {
        cash: { count: cashPayments.length, total: cashTotal.toFixed(2) },
        upi: { count: upiPayments.length, total: upiTotal.toFixed(2) },
      },
      itemsSold: totalItemsSold,
      orders: orders,
    };

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

// Close day - Archive and clear all active orders
const closeDay = async (req, res, next) => {
  try {
    // Check for pending orders (non-completed, non-cancelled, non-archived)
    const pendingOrders = await Order.find({
      archived: { $ne: true },
      orderStatus: { $nin: ["Completed", "Cancelled"] }
    });

    if (pendingOrders.length > 0) {
      const error = createHttpError(400, `Cannot close day. ${pendingOrders.length} order(s) are still pending. Complete or cancel all orders first.`);
      return next(error);
    }

    // Archive all non-archived orders
    const result = await Order.updateMany(
      { archived: { $ne: true } },
      { $set: { archived: true } }
    );

    // Reset all tables to Available
    await Table.updateMany({}, { status: "Available", currentOrder: null });

    res.status(200).json({
      success: true,
      message: `Day closed successfully! ${result.modifiedCount} orders archived.`,
      archivedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrder, getDailyReport, closeDay };
