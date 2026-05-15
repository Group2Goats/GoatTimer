import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

process.env.JWT_SECRET ||= "test-secret";

vi.mock("@backend/config/env.js", () => ({
  IS_PRODUCTION: false,
  JWT_SECRET: "test-secret",
  MONGO_URI: undefined,
  PORT: 5050,
}));

vi.mock("@backend/config/database.js", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
}));

HTMLCanvasElement.prototype.requestPointerLock = vi.fn();

document.exitPointerLock = vi.fn();

globalThis.requestAnimationFrame = vi.fn((callback) => {
  callback();
  return 1;
});

globalThis.cancelAnimationFrame = vi.fn();
