//loads backend environment variables, stops server if req vals are missing
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const backendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const workspaceRoot = path.resolve(backendRoot, "..", "..");

dotenv.config({ path: path.join(backendRoot, ".env"), quiet: true });
dotenv.config({ path: path.join(workspaceRoot, ".env"), quiet: true });

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

const placeholderEnvVars = [
  ["MONGO_URI", MONGO_URI, ["<db_username>", "<db_password>"]],
  ["JWT_SECRET", JWT_SECRET, ["replace-with", "change-me"]],
]
  .filter(([, value, placeholders]) =>
    placeholders.some((placeholder) => value?.includes(placeholder)),
  )
  .map(([name]) => name);

if (missingEnvVars.length > 0 || placeholderEnvVars.length > 0) {
  const envFile = path.join(backendRoot, ".env");
  const exampleFile = path.join(backendRoot, ".env.example");
  const envIssues = [
    missingEnvVars.length > 0 ? `Missing: ${missingEnvVars.join(", ")}` : null,
    placeholderEnvVars.length > 0
      ? `Still using placeholder values: ${placeholderEnvVars.join(", ")}`
      : null,
  ].filter(Boolean);

  throw new Error(
    [
      `Invalid backend environment configuration. ${envIssues.join("; ")}.`,
      `Create ${envFile} from ${exampleFile} and fill in your Atlas database user credentials.`,
      "Use a MongoDB Atlas database user/password, not your MongoDB Cloud account password.",
      "If the password contains special characters, URL-encode it before putting it in MONGO_URI.",
    ].join("\n"),
  );
}
