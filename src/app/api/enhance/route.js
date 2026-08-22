import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are a professional technical writer for Sunon Asogli Power Plant (Maintenance - Controls & Instrumentation Department).

Your job is to rewrite work report entries into formal, professional, technically precise language suitable for an official company weekly work summary report.

Strict output rules — these override everything else:
- Output ONLY the rewritten text. Nothing else.
- Do NOT start with any heading, label, title, field name, or colon-prefixed line of any kind.
- Do NOT output phrases like "Important Work:", "Completion:", "Work Done:", "Here is the rewritten text:", "Rewritten:", or any similar prefix.
- Do NOT add any preamble, commentary, explanation, or closing note.
- Fix ALL spelling mistakes and grammar errors.
- Rewrite in formal, professional engineering language.
- Keep the same meaning and facts — do not invent or add information.
- Use proper technical terminology for power plant / instrumentation / CCTV / networking work.
- Preserve any model numbers, serial numbers, or equipment codes exactly as written.`;

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
      ? `This is the "Important Work" field — a SHORT, single-sentence title or description of the work task.
Output rules for this field:
- Rewrite as ONE clean, concise sentence or short phrase describing what work was done.
- Do NOT write numbered steps, bullet points, or multiple sentences.
- Do NOT include any heading, label, or prefix of any kind.
- Start directly with the action, e.g. "Installation of..." or "Inspection and replacement of..."
- Output only the rewritten sentence. Nothing else.`
      : `This is the "Completion, Process and Results" field — a detailed step-by-step account of how the work was performed.
Output rules for this field:
- Rewrite as clear numbered steps (1. 2. 3.) if the input has multiple steps, or as a concise paragraph if it is a single action.
- Only add "Results: ..." at the very end if the input mentions an outcome or result.
- Do NOT include any heading, label, or prefix of any kind — not "Completion:", not "Process:", not "Steps:", nothing.
- Start directly with the first step or first sentence.
- Output only the rewritten content. Nothing else.`;

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
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
      console.error("Groq error:", response.status, err);
      return NextResponse.json({ error: `AI service error (${response.status})` }, { status: 502 });
    }

    const data = await response.json();
    let enhanced = data.choices?.[0]?.message?.content?.trim();

    if (!enhanced) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 502 });
    }

    // ── Server-side post-processing ──────────────────────────────────────────

    // 1. Strip any leading label/heading line the AI added (e.g. "Important Work:", "Here is the rewritten text:")
    enhanced = enhanced
      .replace(/^(?:important\s+work|completion[,\s]*process[,\s]*and[,\s]*results|work\s+done|rewritten(\s+text)?|here\s+is[^:\n]*|steps?|process|result)[:\s\-]+/i, "")
      .replace(/^[^\n]{1,80}:\s*\n/, "") // catch-all: any short line ending with colon at the very top
      .trim();

    // 2. For the "important_work" field: enforce a single clean sentence/phrase.
    //    No steps, no bullets, no multi-line output — keep only the first meaningful line.
    if (field === "important_work") {
      // Take only the first non-empty line
      const firstLine = enhanced.split(/\n/).find(l => l.trim().length > 0) || enhanced;
      // Also cut at the first full stop that ends a sentence (not a model number abbreviation)
      // e.g. "Installation of X. Steps: 1. ..." → "Installation of X."
      const sentenceMatch = firstLine.match(/^(.+?[.!?])(?:\s|$)/);
      enhanced = sentenceMatch ? sentenceMatch[1].trim() : firstLine.trim();
      // Remove any leading step number or bullet the AI may have put
      enhanced = enhanced.replace(/^[\d]+\.\s*/, "").replace(/^[•\-]\s*/, "").trim();
    }

    return NextResponse.json({ enhanced });
  } catch (err) {
    console.error("Enhance route error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
