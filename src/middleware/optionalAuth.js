import jwt from "jsonwebtoken";
import User from "../models/User.js";

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (err) {
      // Invalid token → just ignore, treat as guest
      req.user = null;
    }
  } else {
    req.user = null; // guest
  }

  next();
};

export default optionalAuth;
