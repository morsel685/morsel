const express = require("express");
const { getDashboardStats } = require("../controllers/dashboardController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();

router.route("/stats").get(isVerifiedUser, getDashboardStats);

module.exports = router;
