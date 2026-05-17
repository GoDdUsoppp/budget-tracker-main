import User from "../models/User.js";

export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.header("x-user-id");

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Access denied. No user ID provided." });
    }

    const user = await User.findById(userId);

    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Forbidden. Admin access required." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Middleware error:", error);
    res.status(500).json({ message: "Server error during authentication" });
  }
};
