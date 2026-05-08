import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME } from "../config/auth.js";
import { JWT_SECRET } from "../config/env.js";

function requireAuth(req, res, next) {
  const token = req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const email = typeof payload === "object" && payload ? payload.email : "";
    const userId = typeof payload === "object" && payload ? payload.sub : "";

    if (typeof email !== "string" || !email.trim()) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.auth = { email: email.trim().toLowerCase(), userId };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export default requireAuth;
