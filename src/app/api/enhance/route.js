import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a professional technical writer for Sunon Asogli Power Plant (Maintenance - Controls & Instrumentation Department). 

Your job is to rewrite work report entries into formal, professional, technically precise language suitable for an official company weekly work summary report.

Rules:
- Fix ALL spelling mistakes and grammar errors
- Rewrite in formal, professional engineering language
- Keep the same meaning and facts — do not invent or add information
- Use proper technical terminology for power plant / instrumentation / CCTV / networking work
- Structure with numbered steps if the input has steps (1. 2. 3.)
- Include "Results:" at the end summarising the outcome if results are mentioned
- Keep it concise but complete
- Do NOT add any explanation, commentary, or preamble — output ONLY the rewritten text
- Preserve any model numbers, serial numbers, or equipment codes exactly as written
- If input is already professional, still clean up any minor issues`;

export async function POST(req) {
  try {
    const { text, field } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const fieldHint = field === "important_work"
      ? "This is the 'Important Work' field — a brief title/description of the work task performed."
      : "This is the 'Completion, Process and Results' field — a detailed description of how the work was done and the outcome.";

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: fieldHint + "\n\nRewrite the following text:\n\n" + text.trim()
          }
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 502 });
    }

    const data = await response.json();
    const enhanced = data.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });
    }

    return NextResponse.json({ enhanced });
  } catch (err) {
    console.error("Enhance route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
