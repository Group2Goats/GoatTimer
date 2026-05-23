//verifies the JWT from the auth cookie and attaches the logged-in user's email and id to req.auth.
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME } from "../config/auth.js";
import { JWT_SECRET } from "../config/env.js";

//gets the JWT from a bearer token header if one was sent
function getBearerToken(req) {
  const authorization = req.get("authorization");

  if (typeof authorization !== "string") {
    return "";
  }

  const [scheme, token] = authorization.split(" ");

  return scheme?.toLowerCase() === "bearer" && token ? token : "";
}

//requires a valid JWT, then stores the logged-in user's email and id on req.auth.
function requireAuth(req, res, next) {
  const token = req.cookies[AUTH_COOKIE_NAME] || getBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const email = typeof payload === "object" && payload ? payload.email : "";
    const userId = typeof payload === "object" && payload ? payload.sub : "";

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof userId !== "string" ||
      !userId.trim()
    ) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.auth = { email: email.trim().toLowerCase(), userId: userId.trim() };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

export default requireAuth;
