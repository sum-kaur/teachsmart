import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getGroq, GROQ_MODEL } from "../lib/groq";

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

router.get("/debug-groq", async (_req, res) => {
  try {
    const groq = getGroq();
    const result = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: "Say hi." }],
      max_tokens: 10,
    });
    res.json({ ok: true, reply: result.choices[0]?.message?.content, model: GROQ_MODEL });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    res.json({ ok: false, error: message, stack });
  }
});

export default router;
