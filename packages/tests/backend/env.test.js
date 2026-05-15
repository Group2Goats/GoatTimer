import os from "node:os";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const originalCwd = process.cwd();
const originalMongoUri = process.env.MONGO_URI;
const originalJwtSecret = process.env.JWT_SECRET;
const temporaryDirectories = [];
const cwdEnvContents =
  "MONGO_URI=mongodb://127.0.0.1:27017/cwd_env_test\nJWT_SECRET=cwd-secret\n";
const cwdEnvLocalContents =
  "MONGO_URI=mongodb://127.0.0.1:27017/cwd_env_local_test\nJWT_SECRET=cwd-local-secret\n";

afterEach(async () => {
  process.chdir(originalCwd);

  if (originalMongoUri === undefined) {
    delete process.env.MONGO_URI;
  } else {
    process.env.MONGO_URI = originalMongoUri;
  }

  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }

  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe.sequential("backend env config", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("prefers cwd .env.local over cwd .env for required values", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "goattimer-env-"));
    temporaryDirectories.push(directory);

    await writeFile(
      path.join(directory, ".env"),
      cwdEnvContents,
      "utf8",
    );
    await writeFile(
      path.join(directory, ".env.local"),
      cwdEnvLocalContents,
      "utf8",
    );

    process.chdir(directory);
    delete process.env.MONGO_URI;
    delete process.env.JWT_SECRET;

    const envModule = await import("@backend/config/env.js");

    expect(envModule.MONGO_URI).toBe(
      "mongodb://127.0.0.1:27017/cwd_env_local_test",
    );
    expect(envModule.JWT_SECRET).toBe("cwd-local-secret");
  });
});
