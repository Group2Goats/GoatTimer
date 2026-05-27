// rate limiting -- so nobody can hammer our api and run up the bill
// uses in-memory store by default. fine for single-instance deploys.
// btw if we ever scale to multiple servers we'd want a redis store

import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";
import { AUTH_COOKIE_NAME } from "../config/auth.js";
import { JWT_SECRET } from "../config/env.js";

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

// key by authed user id when we have it, otherwise fall back to ip
// this way multiple devices on the same wan ip (dorm/cgnat) dont share a bucket once logged in
// note: ipKeyGenerator handles ipv6 properly so we dont collapse all ipv6 into one key
function userOrIpKey(req) {
  return getUserIdFromRequest(req) || ipKeyGenerator(req);
}

// generic backstop for the whole api
// 1000 req per 15 min per user (or ip if anonymous)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
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
  // dont count successful logins, only failed attempts
  skipSuccessfulRequests: true,
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
  message: { error: "Too many write requests, slow down" },
});
