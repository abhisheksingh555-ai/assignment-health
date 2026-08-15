import { createServer } from "node:http";

import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { setupVoiceWebSocket } from "./websocket/voice.socket.js";

const httpServer = createServer(app);

setupVoiceWebSocket(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info(
    `HTTP server listening on http://localhost:${env.PORT}`
  );

  logger.info(
    `WebSocket server listening on ws://localhost:${env.PORT}/call`
  );
});

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down server...`);

  httpServer.close(() => {
    logger.info("HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", {
    message: error.message,
    stack: error.stack,
  });

  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    reason: String(reason),
  });
});