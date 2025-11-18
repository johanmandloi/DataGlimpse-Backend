// // src/middleware/authMiddleware.js
// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// export const authenticate = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ success: false, message: "No token provided" });
//     }

//     const token = authHeader.split(" ")[1];

//     // 1️⃣ Guest token handling
//     if (token.startsWith("guest_")) {
//       // No JWT verification needed, just assign sessionId
//       req.user = { role: "guest", sessionId: token };
//       return next();
//     }

//     // 2️⃣ Registered user handling (JWT)
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id);
//     if (!user) {
//       return res.status(401).json({ success: false, message: "User not found" });
//     }

//     req.user = { id: user._id, role: user.role };
//     next();

//   } catch (err) {
//     return res.status(401).json({ success: false, message: "Invalid token", error: err.message });
//   }
// };

// // // Role-based access
// // export const authorizeRoles = (...roles) => (req, res, next) => {
// //   if (!roles.includes(req.user.role)) {
// //     return res.status(403).json({ success: false, message: "Access denied: insufficient privileges" });
// //   }
// //   next();
// // };

// /**
//  * ✅ Role-based authorization middleware
//  * Use: authorizeRoles("admin", "researcher")
//  */
// export const authorizeRoles = (...roles) => (req, res, next) => {
//   if (!roles.includes(req.user.role)) {
//     return res.status(403).json({
//       success: false,
//       message: "Access denied: insufficient privileges",
//     });
//   }
//   next();
// };


// // // src/middleware/authMiddleware.js
// // import jwt from "jsonwebtoken";
// // import User from "../models/User.js";

// /**
//  * ✅ Middleware to authenticate either:
//  * - Registered users via JWT (Bearer token)
//  * - Guests via x-session-id header
//  */
// // export const authenticate = async (req, res, next) => {
// //   try {
// //     const authHeader = req.headers.authorization;
// //     const sessionId = req.headers["x-session-id"];

// //     // 🧩 Case 1: Guest session (handled via custom header)
// //     if (sessionId && sessionId.startsWith("guest_")) {
// //       req.user = { role: "guest", sessionId };
// //       return next();
// //     }

// //     // 🧩 Case 2: Registered user with JWT
// //     if (authHeader && authHeader.startsWith("Bearer ")) {
// //       const token = authHeader.split(" ")[1];
// //       const decoded = jwt.verify(token, process.env.JWT_SECRET);

// //       const user = await User.findById(decoded.id);
// //       if (!user) {
// //         return res.status(401).json({
// //           success: false,
// //           message: "User not found",
// //         });
// //       }

// //       req.user = { id: user._id, role: user.role };
// //       return next();
// //     }

// //     // ❌ Case 3: No valid auth info
// //     return res.status(401).json({
// //       success: false,
// //       message: "Unauthorized: No valid token or session ID",
// //     });
// //   } catch (err) {
// //     return res.status(401).json({
// //       success: false,
// //       message: "Invalid or expired token",
// //       error: err.message,
// //     });
// //   }
// // };
// // export const authenticate = (req, res, next) => {
// //   try {
// //     const authHeader = req.headers.authorization;

// //     if (!authHeader || !authHeader.startsWith("Bearer ")) {
// //       return res.status(401).json({ success: false, message: "Missing or invalid token" });
// //     }

// //     const token = authHeader.split(" ")[1];

// //     // ✅ Case 1: Guest session token
// //     if (token.startsWith("guest_")) {
// //       req.user = {
// //         isGuest: true,
// //         sessionId: token,
// //       };
// //       return next();
// //     }

// //     // ✅ Case 2: Regular JWT token
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     req.user = {
// //       id: decoded.id,
// //       username: decoded.username,
// //       role: decoded.role,
// //       isGuest: false,
// //     };

// //     next();
// //   } catch (error) {
// //     console.error("Auth error:", error);
// //     return res.status(401).json({
// //       success: false,
// //       message: "Invalid or expired token",
// //       error: error.message,
// //     });
// //   }
// // };







// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * 🔐 authenticate → required auth (used for ensureAuth)
 * Supports both guest tokens ("guest_...") and regular JWTs.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 1️⃣ Guest token handling
    if (token.startsWith("guest_")) {
      req.user = { role: "guest", sessionId: token };
      return next();
    }

    // 2️⃣ Registered user handling (JWT)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    // ✅ attach decoded user
    req.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      error: err.message,
    });
  }
};

/**
 * 🧩 optionalAuth → doesn’t block if no/invalid token.
 * If valid token exists, it sets req.user; otherwise req.user = null.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];

    // Guest token
    if (token.startsWith("guest_")) {
      req.user = { role: "guest", sessionId: token };
      return next();
    }

    // Regular JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    req.user = user
      ? { id: user._id.toString(), username: user.username, role: user.role }
      : null;

    next();
  } catch {
    req.user = null; // invalid token — just ignore
    next();
  }
};

/**
 * ✅ Role-based authorization (no change)
 */
export const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied: insufficient privileges",
    });
  }
  next();
};
