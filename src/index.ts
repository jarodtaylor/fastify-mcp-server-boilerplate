import { fastify } from "fastify";
import { streamableHttp } from "fastify-mcp";
import { createConfig } from "./config";
import { createMcpServer } from "./mcp-server";

const config = createConfig();

const app = fastify({
  logger:
    config.nodeEnv === "development"
      ? {
          level: config.logLevel,
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          },
        }
      : {
          level: config.logLevel,
        },
});

// Add request ID for tracing
app.addHook("onRequest", async (request) => {
  request.id = crypto.randomUUID();
});

// Register the Streamable HTTP transport
await app.register(streamableHttp, {
  stateful: false, // Set to true if you need stateful sessions
  mcpEndpoint: config.mcpEndpoint,
  createServer: createMcpServer,
});

// Enhanced health check endpoint
app.get(config.healthEndpoint, async () => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: config.version,
    name: config.name,
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    },
    environment: config.nodeEnv,
  };
});

// Start the server
const start = async (): Promise<void> => {
  try {
    // Listen on all interfaces in production, localhost in development
    const host = config.nodeEnv === "production" ? "0.0.0.0" : config.host;

    await app.listen({ port: config.port, host });

    app.log.info({
      msg: "Server started successfully",
      config: {
        name: config.name,
        version: config.version,
        environment: config.nodeEnv,
        port: config.port,
        host: config.host,
        endpoints: {
          health: `http://${config.host}:${config.port}${config.healthEndpoint}`,
          mcp: `http://${config.host}:${config.port}${config.mcpEndpoint}`,
        },
      },
    });
  } catch (err) {
    app.log.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  app.log.info({ signal }, "Received shutdown signal, starting graceful shutdown");

  try {
    await app.close();
    app.log.info("Graceful shutdown completed");
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, "Error during graceful shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (err) => {
  app.log.fatal({ err }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  app.log.fatal({ reason, promise }, "Unhandled promise rejection");
  process.exit(1);
});

start();
