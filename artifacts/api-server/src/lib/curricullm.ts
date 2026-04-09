import OpenAI from "openai";

// CurricuLLM is OpenAI-compatible — same SDK, different baseURL + model
export const curricullm = new OpenAI({
  apiKey: process.env.CURRICULLM_API_KEY ?? "",
  baseURL: "https://api.curricullm.com/v1",
});

export const CURRICULLM_MODEL = "CurricuLLM-AU";
