import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./env.js";

export const AUTH_COOKIE_NAME = "goattimer_jwt";

const JWT_EXPIRES_IN = "7d";
const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  path: "/",
  partitioned: true,
  maxAge: ONE_WEEK_IN_MS,
};

export const clearAuthCookieOptions = {
  httpOnly: authCookieOptions.httpOnly,
  sameSite: authCookieOptions.sameSite,
  secure: authCookieOptions.secure,
  partitioned: authCookieOptions.partitioned,
  path: authCookieOptions.path,
};

export function createAuthToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}
