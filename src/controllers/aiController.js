// ✅ /src/controllers/aiController.js

import dotenv from "dotenv";
import AIMessage from "../models/AIMessage.js";
import Visualization from "../models/Visualization.js";
// ⬇️ Swapped: GoogleGenerativeAI → OpenAI
import OpenAI from "openai";

dotenv.config();

// ⬇️ OpenAI client (reads OPENAI_API_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// -----------------------------------------------------------
// POST /api/ai/generate  → Generate AI summary/stats/recommendations
// -----------------------------------------------------------

export const generateAIInsight = async (req, res) => {
  try {
    const { vizId, mode } = req.body;

    if (!vizId || !mode) {
      return res
        .status(400)
        .json({ success: false, message: "vizId and mode required" });
    }

    const visualization = await Visualization.findById(vizId).populate(
      "datasetId",
      "fileName columns rows"
    );

    if (!visualization) {
      return res
        .status(404)
        .json({ success: false, message: "Visualization not found" });
    }

    const dataSample = visualization.previewData?.slice(0, 10) || [];
    const chartType = visualization.chartType || "unspecified chart";
    const datasetName = visualization.datasetId?.fileName || "Unnamed Dataset";

    // -----------------------------------------------------------
    // ✨ DISTINCT PROMPTS FOR EACH MODE (unchanged except wording from your latest version)
    // -----------------------------------------------------------
    let prompt = "";

    if (mode === "summary") {
  prompt = `
You are an expert data analyst.
Analyze the ${chartType} visualization generated from dataset "${datasetName}".
Here is a sample of the data:
${JSON.stringify(dataSample, null, 2)}

FORMAT & STYLE:
- Output in clean **Markdown** (no code fences).
- Use a short heading, bold key terms/metrics, _italics_ for caveats, and bullet points where appropriate.
- Keep it concise and readable for a non-technical stakeholder.
- Length: aim for ~180-200 words.

STRUCTURE (follow loosely as needed):
**Overview:** One-two sentences on the overall story.
**Key Signals:**
- Bullet 1 with a crisp insight (use **bold** for important numbers/names)
- Bullet 2 …
- Bullet 3 …
**Context/Caveats:** _One short line noting any assumptions or data limits._

RULES:
- Avoid raw tables; use bullets.
- Do not list formula-level stats (that belongs to "stats" mode).
- Keep the tone professional, actionable, and easy to skim.
`;
    } else if (mode === "stats") {
      prompt = `
You are a statistician.
Analyze the dataset "${datasetName}" based on the following sample:
${JSON.stringify(dataSample, null, 2)}

Provide a detailed, line-by-line statistical summary.
List out columns and their numerical insights.
Include metrics like mean, median, mode, minimum, maximum, and standard deviation (if applicable).
Present each column's stats clearly, for example:
- Column Name: Mean = ..., Median = ..., Max = ..., etc.
Focus purely on quantitative summaries.
Keep it concise but formatted for readability.
Try to keep it under 200 words.
      `;
    } else if (mode === "recommendation") {
      prompt = `
You are a senior business analyst. Review the ${chartType} built from dataset "${datasetName}".
Use the following sample rows:
${JSON.stringify(dataSample, null, 2)}

TASK:
Provide business-focused, actionable recommendations grounded in the data. 
Infer the domain (e.g., sales, marketing, operations, finance) from column names and values.
If it looks like SALES data (e.g., columns like revenue, price, units, product, region, channel, date), 
focus on growth and efficiency strategies (pricing, bundling, channel mix, regional focus, inventory, funnel).

OUTPUT STRICTLY IN THIS STRUCTURE (keep it concise, data-backed, and non-generic):
1) Quick Diagnosis — 2-3 bullet points on what the data indicates (trends/segments/time windows).
2) Growth / Optimization Plays — 3-5 numbered, actionable strategies tailored to the domain (e.g., for sales: pricing tests, product mix, regional focus, channel reallocation, cross-sell/upsell).
3) Risks & Caveats — 2-3 bullets (data quality, seasonality, sample bias).
4) Next 7-Day Actions — checklist-style (• …) concrete steps the team can execute now.
5) KPIs to Monitor — 3-5 bullets with short formulas or definitions (e.g., AOV = Revenue / Orders).

RULES:
- Be specific and tied to the data patterns you see; avoid fluff.
- If uncertainty exists, state assumptions explicitly.
- Keep total length ≲ 120 words.
      `;
    } else {
      // fallback for unexpected mode values
      prompt = `
You are a data analyst.
Provide a general overview of dataset "${datasetName}" visualized as a ${chartType}.
Use this data sample:
${JSON.stringify(dataSample, null, 2)}
Summarize key points in under 200 words.
      `;
    }

    // -----------------------------------------------------------
    // OpenAI API Call (Chat Completions)
    // -----------------------------------------------------------
    let text = "No valid response from AI.";
    try {
      const resp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        messages: [
          { role: "system", content: "You are a precise, concise data analyst." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      });
      text = resp.choices?.[0]?.message?.content ?? text;
    } catch (apiErr) {
      console.error("❌ OpenAI API Error:", apiErr.message);
      return res.status(502).json({
        success: false,
        message: "OpenAI API request failed",
        error: apiErr.message,
      });
    }

    // Keep full response
    const trimmedText = (text || "").trim();


    // Save message in DB (unchanged)
    const aiMessage = await AIMessage.create({
      vizId,
      type: mode,
      content: trimmedText,
    });

    // Link AI message to Visualization (unchanged)
    await Visualization.findByIdAndUpdate(vizId, {
      $push: { aiMessageIds: aiMessage._id },
    });

    res.status(200).json({
      success: true,
      message: "AI insight generated successfully",
      data: aiMessage,
    });
  } catch (err) {
    console.error("❌ AI insight generation error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error generating AI insight",
      error: err.message,
    });
  }
};

// -----------------------------------------------------------
// GET /api/ai/history/:vizId  → Fetch full history (oldest -> newest)
// -----------------------------------------------------------
export const getAIHistory = async (req, res) => {
  try {
    const { vizId } = req.params;

    if (!vizId) {
      return res
        .status(400)
        .json({ success: false, message: "vizId is required" });
    }

    const history = await AIMessage.find({ vizId })
      .sort({ createdAt: 1 }) // oldest -> newest
      .lean(); // no limit: return full history

    res.status(200).json({
      success: true,
      message: "AI history fetched successfully",
      data: history,
    });
  } catch (err) {
    console.error("❌ AI history fetch error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error fetching AI history",
      error: err.message,
    });
  }
};
