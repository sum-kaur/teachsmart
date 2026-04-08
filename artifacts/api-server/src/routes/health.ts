import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/debug-env", (_req, res) => {
  const key = process.env.GROQ_API_KEY;
  res.json({
    groqKeySet: !!key,
    groqKeyPrefix: key ? key.substring(0, 8) + "..." : "MISSING",
    curricullmKeySet: !!process.env.CURRICULLM_API_KEY,
    nodeEnv: process.env.NODE_ENV,
  });
});

export default router;
