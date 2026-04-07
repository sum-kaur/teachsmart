import Groq from "groq-sdk";

// Use a placeholder key if not set — Groq will fail at call time (not startup)
// Demo scenarios work without any API key
export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "missing-key" });

export const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function callAI(prompt: string, maxTokens = 1000): Promise<string | null> {
  try {
    const response = await groq.chat.completions.create({
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
