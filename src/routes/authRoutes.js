// src/routes/authRoutes.js
import express from "express";
import { signupWithOtp, loginUser } from "../controllers/accountController.js";

const router = express.Router();

// Hybrid OTP Signup
router.post("/signup-with-otp", signupWithOtp);

// Login
router.post("/login", loginUser);

export default router;
