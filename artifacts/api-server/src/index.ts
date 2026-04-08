import { config as loadEnv } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env from workspace root (3 levels up from dist/)
// override: true ensures .env values always win over inherited shell env vars
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, "../../../.env"), override: true });
import app from "./app";
import { logger } from "./lib/logger";
import { TAVILY_AVAILABLE } from "./lib/tavily";

const port = Number(process.env["PORT"] ?? "8080");

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  logger.info("Groq API ready");
  if (TAVILY_AVAILABLE) {
    logger.info("Tavily web search ready");
  } else {
    logger.warn("TAVILY_API_KEY not set — web search disabled, using Groq-only fallback");
  }
});
