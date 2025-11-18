// src/config/mail.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// optional: verify transporter on startup (safe to call once)
export const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log("Mail transporter verified");
  } catch (err) {
    console.warn("Mail transporter verification failed:", err.message);
  }
};

export default transporter;
