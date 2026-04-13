import OpenAI from "openai";

export async function askOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set in environment");
  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  try {
    const resp = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800
    });
    return resp.choices?.[0]?.message?.content ?? "";
  } catch (err: any) {
    console.error("OpenAI request failed:", err?.message ?? err);
    throw err;
  }
}
