import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME } from "../config/auth.js";
import { JWT_SECRET } from "../config/env.js";

const skipPreflight = (req) => req.method === "OPTIONS";

// pull the userId out of the auth cookie if its valid
// we cant rely on req.auth here because limiters run before requireAuth
function getUserIdFromRequest(req) {
  // req.auth gets set by requireAuth, use it if it ran already
  if (req.auth?.userId) return req.auth.userId;

  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return typeof payload === "object" && payload?.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

// for azure deployment
function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  const rawIp = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : req.ip || req.socket?.remoteAddress || "";

  // If IPv4 has a port appended, strip it
  return rawIp.replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/, "$1");
}

function userOrIpKey(req) {
  const userId = getUserIdFromRequest(req);
  if (userId) return `user:${userId}`;

  return `ip:${ipKeyGenerator(getClientIp(req))}`;
}

function ipOnlyKey(req) {
  return `ip:${ipKeyGenerator(getClientIp(req))}`;
}

// generic backstop for the whole api
// 1000 req per 15 min per user (or ip if anonymous)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  skip: skipPreflight,
  message: { error: "Too many requests, slow down" },
});

// strict limit on auth endpoints (signup/login)
// 10 failed attempts per 15 min per ip -- stops brute force on passwords
// auth routes are pre-login so we cant key by user id here, ip is the only option
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: ipOnlyKey,
  // dont count successful logins, only failed attempts
  skipSuccessfulRequests: true,
  skip: skipPreflight,
  message: { error: "Too many auth attempts, try again later" },
});

// medium limit for write ops (create/update/delete)
// 60 writes per 15 min per user (or ip if anonymous)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  skip: skipPreflight,
  message: { error: "Too many write requests, slow down" },
});
