import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler } from "./core/errors/errorHandler.js";

import healthRoutes from "./modules/health/health.routes.js";
import conversationRoutes from "./modules/conversation/conversation.routes.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet()
);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "AI Health Screening API",
    version: "1.0.0",
  });
});

app.use("/health", healthRoutes);

app.use("/api/conversations", conversationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

app.use(errorHandler);

export default app;