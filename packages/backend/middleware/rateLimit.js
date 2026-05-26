// rate limiting -- so nobody can hammer our api and run up the bill
// uses in-memory store by default. fine for single-instance deploys.
// btw if we ever scale to multiple servers we'd want a redis store

import rateLimit from "express-rate-limit";

// generic backstop for the whole api
// 200 req per 15 min per ip -- normal usage shouldnt hit this
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, slow down" },
});

// strict limit on auth endpoints (signup/login)
// 10 attempts per 15 min per ip -- stops brute force on passwords
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
// 60 writes per 15 min per ip
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many write requests, slow down" },
});
