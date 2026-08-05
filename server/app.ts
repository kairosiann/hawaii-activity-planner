import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express, {
  type ErrorRequestHandler,
  type Express,
  type RequestHandler,
} from "express";
import { appRouter } from "./routers";
import { checkDatabaseConnection } from "./db";
import { createContext } from "./_core/context";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerStorageProxy } from "./_core/storageProxy";

const healthHandler: RequestHandler = async (_req, res) => {
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const databaseConnected = await checkDatabaseConnection();

  res.status(databaseConnected ? 200 : 503).json({
    ok: databaseConnected,
    databaseConfigured,
    databaseConnected,
  });
};

const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  console.error("[Server] Unhandled request error", error);
  res.status(500).json({ error: "Internal server error" });
};

/**
 * Configure a request handler without opening a port. Vercel passes in the
 * Express app created by its root entry point, while local development uses
 * the default app created here and attaches it to an HTTP server.
 */
export function createApp(app: Express = express()): Express {
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", healthHandler);
  if (
    process.env.BUILT_IN_FORGE_API_URL &&
    process.env.BUILT_IN_FORGE_API_KEY
  ) {
    registerStorageProxy(app);
  }

  if (
    process.env.OAUTH_SERVER_URL &&
    process.env.VITE_APP_ID &&
    process.env.JWT_SECRET
  ) {
    registerOAuthRoutes(app);
  }
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.use(errorHandler);

  return app;
}
