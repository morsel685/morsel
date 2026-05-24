const express = require("express");
const { getDailySalesReport } = require("../controllers/reportController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

// GET /api/report/daily-sales - Download daily sales report as Excel
// Optional query param: ?date=YYYY-MM-DD for specific date
router.route("/daily-sales").get(isVerifiedUser, getDailySalesReport);

module.exports = router;
