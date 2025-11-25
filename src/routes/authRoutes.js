// src/routes/authRoutes.js
import express from "express";
import { signupWithOtp, loginUser } from "../controllers/accountController.js";

const router = express.Router();

/**
 * @openapi
 * /v1/auth/signup-with-otp:
 *   post:
 *     tags:
 *       - auth
 *     summary: Signup using OTP (hybrid flow)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Created user and returned JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       '400':
 *         $ref: '#/components/schemas/Error'
 */
router.post("/signup-with-otp", signupWithOtp);

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     tags:
 *       - auth
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *     responses:
 *       '200':
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       '401':
 *         $ref: '#/components/schemas/Error'
 */
router.post("/login", loginUser);

export default router;
