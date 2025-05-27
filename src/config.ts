import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version and name info
const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

export interface Config {
  port: number;
  host: string;
  nodeEnv: "development" | "production" | "test";
  logLevel: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  mcpEndpoint: string;
  healthEndpoint: string;
  version: string;
  name: string;
  // Security configuration
  enableAuth: boolean;
  apiKey: string | undefined;
  enableRateLimit: boolean;
  maxRequestsPerMinute: number;
  enableRequestLogging: boolean;
  trustedOrigins: string[];
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return defaultValue;
  }
  return value;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

export function createConfig(): Config {
  const nodeEnv = getEnvVar("NODE_ENV", "development") as Config["nodeEnv"];

  // Validate NODE_ENV
  if (!["development", "production", "test"].includes(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}. Must be development, production, or test`);
  }

  const config: Config = {
    port: getEnvNumber("PORT", 8080),
    host: getEnvVar("HOST", "localhost"),
    nodeEnv,
    logLevel: getEnvVar(
      "LOG_LEVEL",
      nodeEnv === "production" ? "info" : "debug"
    ) as Config["logLevel"],
    mcpEndpoint: getEnvVar("MCP_ENDPOINT", "/mcp"),
    healthEndpoint: getEnvVar("HEALTH_ENDPOINT", "/health"),
    version: packageJson.version,
    name: packageJson.name,
    // Security configuration
    enableAuth: getEnvVar("ENABLE_AUTH", "false") === "true",
    apiKey: process.env.API_KEY,
    enableRateLimit: getEnvVar("ENABLE_RATE_LIMIT", "true") === "true",
    maxRequestsPerMinute: getEnvNumber("MAX_REQUESTS_PER_MINUTE", 100),
    enableRequestLogging: getEnvVar("ENABLE_REQUEST_LOGGING", "true") === "true",
    trustedOrigins: getEnvVar("TRUSTED_ORIGINS", "").split(",").filter(Boolean),
  };

  // Validate log level
  const validLogLevels = ["trace", "debug", "info", "warn", "error", "fatal"];
  if (!validLogLevels.includes(config.logLevel)) {
    throw new Error(
      `Invalid LOG_LEVEL: ${config.logLevel}. Must be one of: ${validLogLevels.join(", ")}`
    );
  }

  // Validate port range
  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid PORT: ${config.port}. Must be between 1 and 65535`);
  }

  return config;
}
