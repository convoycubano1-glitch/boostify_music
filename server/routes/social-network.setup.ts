import { Express } from "express";
import socialNetworkRouter from "./social-network";

/**
 * Configura las rutas de la red social
 */
export function setupSocialNetworkRoutes(app: Express): void {
  app.use("/api/social", socialNetworkRouter);
}