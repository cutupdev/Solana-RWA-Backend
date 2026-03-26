import express from "express";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();
  app.use(corsMiddleware);
  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => {
    res.json({
      service: "solana-rwa-backend",
      docs: "See README for API overview",
    });
  });

  app.use("/api", apiRouter);
  app.use(errorHandler);
  return app;
}
