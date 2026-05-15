import os from "node:os";
import path from "node:path";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { afterEach, describe, expect, it } from "vitest";

const originalCwd = process.cwd();
const originalMongoUri = process.env.MONGO_URI;
const originalJwtSecret = process.env.JWT_SECRET;
const temporaryDirectories = [];

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
  it("loads required values from a cwd .env file", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "goattimer-env-"));
    temporaryDirectories.push(directory);

    await writeFile(
      path.join(directory, ".env"),
      "MONGO_URI=mongodb://127.0.0.1:27017/cwd_env_test\nJWT_SECRET=cwd-secret\n",
      "utf8",
    );

    process.chdir(directory);
    delete process.env.MONGO_URI;
    delete process.env.JWT_SECRET;

    const envModule = await import("@backend/config/env.js");

    expect(envModule.MONGO_URI).toBe("mongodb://127.0.0.1:27017/cwd_env_test");
    expect(envModule.JWT_SECRET).toBe("cwd-secret");
  });
});
