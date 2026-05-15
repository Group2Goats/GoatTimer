import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";
import { AUTH_COOKIE_NAME, createAuthToken } from "@backend/config/auth.js";
import requireAuth from "@backend/middleware/requireAuth.js";

function createResponse() {
  const res = {};

  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);

  return res;
}

function createRequest({ authorization = "", cookies = {} } = {}) {
  return {
    cookies,
    get: vi.fn((header) =>
      header.toLowerCase() === "authorization" ? authorization : "",
    ),
  };
}

describe("auth helpers", () => {
  it("creates a JWT-shaped auth token", () => {
    const token = createAuthToken({
      _id: "user-123",
      email: "student@example.com",
    });

    expect(token.split(".")).toHaveLength(3);
  });

  it("accepts a valid auth cookie and sets req.auth", () => {
    const req = createRequest({
      cookies: {
        [AUTH_COOKIE_NAME]: jwt.sign(
          { sub: "user-123", email: "Student@Example.com" },
          process.env.JWT_SECRET,
        ),
      },
    });
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.auth).toEqual({
      email: "student@example.com",
      userId: "user-123",
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("accepts a valid bearer token and sets req.auth", () => {
    const token = jwt.sign(
      { sub: "user-456", email: "learner@example.com" },
      process.env.JWT_SECRET,
    );
    const req = createRequest({ authorization: `Bearer ${token}` });
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.auth).toEqual({
      email: "learner@example.com",
      userId: "user-456",
    });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects requests without auth", () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Authentication required",
    });
  });

  it("rejects invalid tokens", () => {
    const req = createRequest({ authorization: "Bearer not-a-token" });
    const res = createResponse();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid or expired session",
    });
  });
});
