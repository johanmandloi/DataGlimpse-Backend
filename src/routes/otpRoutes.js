// src/routes/otpRoutes.js
import express from "express";
import { sendOtp } from "../controllers/otpController.js";

const router = express.Router();

/**
 * @openapi
 * /v1/otp/send-otp:
 *   post:
 *     tags:
 *       - otp
 *     summary: Send OTP to an email/phone for verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       '200':
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OTPResponse'
 */
router.post("/send-otp", sendOtp);

export default router;
