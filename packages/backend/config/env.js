import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// Loaded from lowest to highest precedence.
const envFiles = [
  path.join(backendRoot, ".env"),
  path.join(backendRoot, ".env.local"),
  path.join(process.cwd(), ".env"),
  path.join(process.cwd(), ".env.local"),
];
const uniqueEnvFiles = [...new Set(envFiles)];

const fileEnv = {};

for (const envFile of uniqueEnvFiles) {
  const { parsed } = dotenv.config({
    path: envFile,
    quiet: true,
    processEnv: {},
  });

  if (parsed) {
    Object.assign(fileEnv, parsed);
  }
}

for (const [name, value] of Object.entries(fileEnv)) {
  process.env[name] ??= value;
}

export const MONGO_URI = process.env.MONGO_URI;
export const JWT_SECRET = process.env.JWT_SECRET;
export const PORT = process.env.PORT || 5050;
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

const missingEnvVars = [
  ["MONGO_URI", MONGO_URI],
  ["JWT_SECRET", JWT_SECRET],
]
  .filter(([, value]) => !value)
  .map(([name]) => name);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
}
