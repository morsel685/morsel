const express = require("express");
const { addOrder, getOrders, getOrderById, updateOrder, getDailyReport, closeDay } = require("../controllers/orderController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();


router.route("/").post(isVerifiedUser, addOrder);
router.route("/").get(isVerifiedUser, getOrders);
router.route("/report/daily").get(isVerifiedUser, getDailyReport);
router.route("/close-day").post(isVerifiedUser, closeDay);
router.route("/:id").get(isVerifiedUser, getOrderById);
router.route("/:id").put(isVerifiedUser, updateOrder);

module.exports = router;