// // src/controllers/accountController.js
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import Dataset from "../models/Dataset.js";
// import GuestSession from "../models/GuestSession.js";
// import User from "../models/User.js";
// import Otp from "../models/Otp.js";
// import { transferGuestDataToUser } from "../services/guestTransferService.js"; // NEW

// /**
//  * Hybrid Signup: Verify OTP, create account, and transfer guest data
//  * POST /api/auth/signup-with-otp
//  * Body: { email, otp, username, fullName, password, confirmPassword, role, sessionId? }
//  */
// export const signupWithOtp = async (req, res) => {
//   try {
//     const { email, otp, username, fullName, password, confirmPassword, role, guestSessionId } = req.body;

//     // Validate required fields
//     if (!email || !otp || !username || !fullName || !password || !confirmPassword || !role) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     // Check valid role
//     const validRoles = ["student_researcher", "analyst_professional", "educator_business"];
//     if (!validRoles.includes(role.toLowerCase())) {
//       return res.status(400).json({ message: "Invalid role" });
//     }

//     // Find latest unused OTP
//     const otpDoc = await Otp.findOne({ email, used: false }).sort({ createdAt: -1 });
//     if (!otpDoc) return res.status(400).json({ message: "OTP not found or expired" });

//     // Compare OTP
//     const isValid = await bcrypt.compare(otp, otpDoc.otpHash);
//     if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

//     // Mark OTP as used
//     otpDoc.used = true;
//     await otpDoc.save();

//     // Check if user already exists
//     const existingUser = await User.findOne({ $or: [{ email }, { username }] });
//     if (existingUser) {
//       return res.status(400).json({ message: "Username or email already exists" });
//     }

//     // Hash password
//     const passwordHash = await bcrypt.hash(password, 10);

//     // Create new user
//     const newUser = await User.create({
//       username,
//       fullName,
//       email,
//       passwordHash,
//       role
//     });

//     // Transfer guest datasets if sessionId is provided
//     if (guestSessionId) {
//       await transferGuestDataToUser(guestSessionId, newUser._id);
//     }

//     // Generate session JWT (7 days)
//     const sessionToken = jwt.sign(
//       { id: newUser._id, username: newUser.username, role: newUser.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.status(201).json({
//       message: "Account created successfully",
//       token: sessionToken,
//       user: {
//         id: newUser._id,
//         username: newUser.username,
//         fullName: newUser.fullName,
//         role: newUser.role
//       }
//     });

//   } catch (error) {
//     console.error("Signup with OTP error:", error);
//     return res.status(500).json({ message: "Failed to create account" });
//   }
// };

// /**
//  * Login (unchanged)
//  * POST /api/auth/login
//  * Body: { username, password, role }
//  */
// export const loginUser = async (req, res) => {
//   try {
//     const { username, password, role } = req.body;

//     if (!username || !password || !role) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const user = await User.findOne({ username, role });
//     if (!user) return res.status(404).json({ message: "User not found with this role" });

//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

//     const token = jwt.sign(
//       { id: user._id, username: user.username, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     return res.status(200).json({
//       message: "Login successful",
//       token,
//       user: { id: user._id, username: user.username, fullName: user.fullName, role: user.role }
//     });

//   } catch (error) {
//     console.error("Login error:", error);
//     return res.status(500).json({ message: "Failed to login" });
//   }
// };


// src/controllers/accountController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Dataset from "../models/Dataset.js";
import GuestSession from "../models/GuestSession.js";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { transferGuestDataToUser } from "../services/guestTransferService.js";

/**
 * 🧩 Hybrid Signup: Verify OTP, create account, and transfer guest data if applicable
 * Route: POST /api/auth/signup-with-otp
 * Body: { email, otp, username, fullName, password, confirmPassword, role, guestSessionId? }
 */
export const signupWithOtp = async (req, res) => {
  try {
    const {
      email,
      otp,
      username,
      fullName,
      password,
      confirmPassword,
      role,
      guestSessionId,
    } = req.body;

    // ✅ Validate required fields
    if (!email || !otp || !username || !fullName || !password || !confirmPassword || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    // ✅ Validate role
    const validRoles = ["student_researcher", "analyst_professional", "educator_business"];
    const normalizedRole = role.toLowerCase();
    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    // ✅ Verify OTP
    const otpDoc = await Otp.findOne({ email, used: false }).sort({ createdAt: -1 });
    if (!otpDoc) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }

    const isValid = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark OTP as used
    otpDoc.used = true;
    await otpDoc.save();

    // ✅ Check duplicate username or email
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username or email already exists" });
    }

    // ✅ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ Create new user
    const newUser = await User.create({
      username,
      fullName,
      email,
      passwordHash,
      role: normalizedRole,
    });

    // ✅ If guest session exists → transfer data
    if (guestSessionId) {
      const transferResult = await transferGuestDataToUser(guestSessionId, newUser._id);
      console.log("[SignupWithOTP] Guest data transfer result:", transferResult);
    }

    // ✅ Generate JWT token (7 days)
    const token = jwt.sign(
      { id: newUser._id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("[SignupWithOtp] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create account" });
  }
};

/**
 * 🔐 Login Controller
 * Route: POST /api/auth/login
 * Body: { username, password, role }
 */
export const loginUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const normalizedRole = role.toLowerCase();
    const user = await User.findOne({ username, role: normalizedRole });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found with this role" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[LoginUser] Error:", error);
    return res.status(500).json({ success: false, message: "Failed to login" });
  }
};
