import OpenAI from "openai";
import { getGroq, GROQ_MODEL } from "./groq";

// CurricuLLM is OpenAI-compatible — same SDK, different baseURL + model.
// Use lazy init so dotenv has already run by first use.
let _curricullm: OpenAI | null = null;

export function getCurricullm(): OpenAI {
  if (!_curricullm) {
    _curricullm = new OpenAI({
      apiKey: process.env.CURRICULLM_API_KEY ?? "",
      baseURL: "https://api.curricullm.com/v1",
    });
  }
  return _curricullm;
}

export const curricullm = new Proxy({} as OpenAI, {
  get(_target, prop) {
    return (getCurricullm() as any)[prop];
  },
});

export const CURRICULLM_MODEL = "CurricuLLM-AU";

type CompletionOptions = {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
};

type CurriculumAIResult = {
  text: string;
  provider: string;
};

export async function callCurriculumAI({
  prompt,
  maxTokens = 1000,
  temperature = 0.4,
}: CompletionOptions): Promise<CurriculumAIResult> {
  if (process.env.CURRICULLM_API_KEY) {
    try {
      const completion = await getCurricullm().chat.completions.create({
        model: CURRICULLM_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature,
      });
      return {
        text: completion.choices[0]?.message?.content ?? "",
        provider: "CurricuLLM-AU",
      };
    } catch {
      // Fall through to Groq
    }
  }

  const completion = await getGroq().chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature,
  });
  return {
    text: completion.choices[0]?.message?.content ?? "",
    provider: "Groq/LLaMA3",
  };
}

export async function reviewCurriculumFaithfulness({
  promptContext,
  draftJson,
  maxTokens = 5000,
}: {
  promptContext: string;
  draftJson: string;
  maxTokens?: number;
}): Promise<CurriculumAIResult> {
  if (!process.env.CURRICULLM_API_KEY) {
    return { text: draftJson, provider: "review-skipped" };
  }

  const reviewPrompt = `You are CurricuLLM-AU acting as a curriculum-faithfulness reviewer.

Review the following generated JSON against the curriculum/task context below.
- Preserve the JSON schema and top-level fields.
- Correct content only where needed to improve curriculum fidelity, year-level appropriateness, and subject accuracy.
- Remove obvious hallucinations, off-topic drift, or misaligned activities if present.
- Do not add commentary.
- Return ONLY corrected valid JSON.

CONTEXT:
${promptContext}

DRAFT JSON:
${draftJson}`;

  try {
    const completion = await getCurricullm().chat.completions.create({
      model: CURRICULLM_MODEL,
      messages: [{ role: "user", content: reviewPrompt }],
      max_tokens: maxTokens,
      temperature: 0.2,
    });
    return {
      text: completion.choices[0]?.message?.content ?? draftJson,
      provider: "CurricuLLM-AU reviewer",
    };
  } catch {
    return { text: draftJson, provider: "review-fallback" };
  }
}
