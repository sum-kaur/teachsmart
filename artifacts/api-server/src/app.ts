import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve built frontend in production
const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDist = join(__dirname, "../../teachsmart/dist/public");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback — all non-API routes return index.html
  app.get("*", (_req, res) => {
    res.sendFile(join(frontendDist, "index.html"));
  });
}

export default app;
