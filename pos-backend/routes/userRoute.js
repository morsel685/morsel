const express = require("express");
const { register, login, getUserData, logout, verifyEmail } = require("../controllers/userController");
const { isVerifiedUser } = require("../middlewares/tokenVerification");
const router = express.Router();


// Authentication Routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(isVerifiedUser, logout);
router.route("/verify-email").get(verifyEmail);

router.route("/").get(isVerifiedUser, getUserData);

module.exports = router;