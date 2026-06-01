import { describe, expect, it } from "vitest";
import { normalizeUserName } from "@backend/routes/users.js";

describe("user update helpers", () => {
  it("trims valid usernames", () => {
    expect(normalizeUserName("  New Goat  ")).toEqual({ value: "New Goat" });
  });

  it("rejects blank usernames", () => {
    expect(normalizeUserName("   ")).toEqual({
      error: "Username is required",
    });
  });

  it("rejects non-string usernames", () => {
    expect(normalizeUserName(null)).toEqual({
      error: "Username is required",
    });
  });
});
