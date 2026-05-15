import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

process.env.MONGO_URI ||= "mongodb://127.0.0.1:27017/goattimer_test";
process.env.JWT_SECRET ||= "test-secret";

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
