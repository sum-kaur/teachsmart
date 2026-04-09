import Groq from "groq-sdk";

export const GROQ_MODEL = "llama-3.3-70b-versatile";

// Lazy singleton — created on first use so dotenv has already run by then
let _groq: Groq | null = null;
export function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "missing-key" });
  }
  return _groq;
}

// Keep `groq` export for backward compat — proxy to lazy getter
export const groq = new Proxy({} as Groq, {
  get(_target, prop) {
    return (getGroq() as any)[prop];
  },
});

export async function callAI(prompt: string, maxTokens = 1000): Promise<string | null> {
  try {
    const response = await getGroq().chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    return response.choices[0]?.message?.content ?? null;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("Groq fallback triggered:", message);
    return null;
  }
}
