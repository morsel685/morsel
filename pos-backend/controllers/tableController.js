const Table = require("../models/tableModel");
const createHttpError = require("http-errors");
const mongoose = require("mongoose")

const addTable = async (req, res, next) => {
  try {
    const { tableNo, seats } = req.body;
    if (!tableNo) {
      const error = createHttpError(400, "Please provide table No!");
      return next(error);
    }
    const isTablePresent = await Table.findOne({ tableNo });

    if (isTablePresent) {
      const error = createHttpError(400, "Table already exist!");
      return next(error);
    }

    const newTable = new Table({ tableNo, seats });
    await newTable.save();
    res
      .status(201)
      .json({ success: true, message: "Table added!", data: newTable });
  } catch (error) {
    next(error);
  }
};

const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find().populate({
      path: "currentOrder",
      select: "customerDetails items bills orderStatus paymentMethod"
    });
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    next(error);
  }
};

const updateTable = async (req, res, next) => {
  try {
    const { status, orderId } = req.body;

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = createHttpError(404, "Invalid id!");
      return next(error);
    }

    const table = await Table.findByIdAndUpdate(
      id,
      { status, currentOrder: orderId },
      { new: true }
    );

    if (!table) {
      const error = createHttpError(404, "Table not found!");
      return next(error);
    }

    res.status(200).json({ success: true, message: "Table updated!", data: table });

  } catch (error) {
    next(error);
  }
};

const editTableDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tableNo, seats } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid id!"));
    }

    // Check if another table already has that number
    if (tableNo !== undefined) {
      const existing = await Table.findOne({ tableNo, _id: { $ne: id } });
      if (existing) {
        return next(createHttpError(400, "Another table with this number already exists!"));
      }
    }

    const updateData = {};
    if (tableNo !== undefined) updateData.tableNo = tableNo;
    if (seats !== undefined) updateData.seats = seats;

    const table = await Table.findByIdAndUpdate(id, updateData, { new: true });

    if (!table) {
      return next(createHttpError(404, "Table not found!"));
    }

    res.status(200).json({ success: true, message: "Table details updated!", data: table });
  } catch (error) {
    next(error);
  }
};

const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(createHttpError(404, "Invalid id!"));
    }

    const table = await Table.findById(id);
    if (!table) {
      return next(createHttpError(404, "Table not found!"));
    }

    if (table.status === "Booked") {
      return next(createHttpError(400, "Cannot delete a booked table! Free it first."));
    }

    await Table.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Table deleted!" });
  } catch (error) {
    next(error);
  }
};

module.exports = { addTable, getTables, updateTable, editTableDetails, deleteTable };
