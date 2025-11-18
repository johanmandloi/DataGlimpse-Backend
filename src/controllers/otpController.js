// src/controllers/otpController.js
import bcrypt from "bcryptjs";
import Otp from "../models/Otp.js";
import transporter from "../config/mail.js";

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH) || 6;
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES) || 5;
const OTP_HASH_SALT_ROUNDS = parseInt(process.env.OTP_HASH_SALT_ROUNDS) || 10;

const generateOtp = () => {
  return Math.floor(Math.pow(10, OTP_LENGTH - 1) + Math.random() * 9 * Math.pow(10, OTP_LENGTH - 1)).toString();
};

// POST /api/auth/send-otp
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, OTP_HASH_SALT_ROUNDS);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await Otp.create({ email, otpHash, expiresAt, used: false });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for DataGlimpse Signup",
      text: `Your OTP is: ${otp}. It is valid for ${OTP_TTL_MINUTES} minutes.`
    });

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};
