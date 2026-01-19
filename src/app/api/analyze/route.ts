import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { withRetry, getErrorMessage } from "@/lib/retryUtils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Zod schema for validating AI responses
const AnalysisResponseSchema = z.object({
    decision: z.enum(['BUY', 'WAIT', 'SELL']),
    confidence_score: z.enum(['High', 'Medium', 'Low']),
    is_demo: z.boolean().optional(),
    analysis_summary: z.string(),
    trading_plan: z.object({
        entry_area: z.string(),
        target_price: z.string(),
        stop_loss: z.string(),
        risk_reward_ratio: z.string()
    })
});

type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

// SYSTEM PROMPTS FOR SINGLE AND MULTI-TIMEFRAME ANALYSIS
const BASE_PROMPT_INSTRUCTIONS = `
Analyze the provided chart(s) with professional institutional precision.
Context provided by user: "{{USER_CONTEXT}}"
`;

// SINGLE IMAGE PROMPTS
const SCALPING_PROMPT_SINGLE = `
${BASE_PROMPT_INSTRUCTIONS}
You are an expert Market Maker and Tape Reader specializing in Scalping.
Analyze this image (Order Book/Intraday Chart) for a quick "Hit & Run" trade (seconds to minutes).
Focus heavily on:
1. Bid-Offer Imbalance (Who is in control?).
2. "Fake Walls" or Spoofing in the Order Book.
3. Burst/Momentum signals.

**LANGUAGE INSTRUCTION:**
- Output the 'analysis_summary' in **INDONESIAN LANGUAGE** (Bahasa Indonesia).
- **CRITICAL:** Start directly with the analysis. Do not use phrases like "Berikut adalah analisa...".
- **IMPORTANT:** Keep standard trading terms in **ENGLISH** (e.g. Breakout, Support, Resistance, Bid-Offer, Scalping, Swing, Cut Loss, Target). Do NOT translate these terms.

Output strictly in JSON format.
`;

const SWING_PROMPT_SINGLE = `
${BASE_PROMPT_INSTRUCTIONS}
You are a Senior Technical Analyst specializing in Swing Trading and Trend Following.
Analyze this image (Daily/Hourly Chart) for a position trade (days to weeks).
Focus heavily on:
1. Major Trend Structure (HH/HL or LH/LL).
2. Key Support & Resistance Levels.
3. Volume Accumulation/Distribution patterns.

**LANGUAGE INSTRUCTION:**
- Output the 'analysis_summary' in **INDONESIAN LANGUAGE** (Bahasa Indonesia).
- **CRITICAL:** Start directly with the analysis. Do not use phrases like "Berikut adalah ringkasan...".
- **IMPORTANT:** Keep standard trading terms in **ENGLISH** (e.g. Trend, Swing, Breakout, Rejection, Supply/Demand). Do NOT translate these terms.

Output strictly in JSON format.
`;

// MULTI-TIMEFRAME PROMPTS (DUAL IMAGE)
const SCALPING_PROMPT_MULTI = `
${BASE_PROMPT_INSTRUCTIONS}
You are an expert Scalper using Multi-Timeframe Analysis.
You have been provided with TWO images:
1. **First Image:** Higher Timeframe (e.g., H1/H4). Use this for MACRO TREND bias.
2. **Second Image:** Lower Timeframe (e.g., M1/M5). Use this for ENTRY TIMING.

**CRITICAL CONFLUENCE RULES:**
- If Higher Timeframe is BEARISH, you must NOT signal BUY unless there is a strong counter-trend reversal pattern.
- If Higher Timeframe is BULLISH, look for aggressive BUY setups on the Lower Timeframe.
- If timeframes conflict significantly, your decision must be "WAIT".

Analyze the synergy between the big picture and the immediate price action.

**LANGUAGE INSTRUCTION:**
- Output the 'analysis_summary' in **INDONESIAN LANGUAGE** (Bahasa Indonesia).
- **IMPORTANT:** Keep standard trading terms in **ENGLISH**.

Output strictly in JSON format.
`;

const SWING_PROMPT_MULTI = `
${BASE_PROMPT_INSTRUCTIONS}
You are a Senior Swing Trader using Top-Down Analysis.
You have been provided with TWO images:
1. **First Image:** Higher Timeframe (e.g., Weekly/Daily). Use this for MAJOR STRUCTURE & KEY LEVELS.
2. **Second Image:** Execution Timeframe (e.g., H1/H4). Use this for PRECISION ENTRIES.

**CRITICAL CONFLUENCE RULES:**
- Respect Key Levels from Image 1. If Price is at Major Resistance in Image 1, do NOT Buy in Image 2.
- Look for structure alignment (Fractal Nature of Markets).
- If Image 1 shows consolidation/chop, be very conservative.

Analyze the structural relationship between the two charts.

**LANGUAGE INSTRUCTION:**
- Output the 'analysis_summary' in **INDONESIAN LANGUAGE** (Bahasa Indonesia).
- **IMPORTANT:** Keep standard trading terms in **ENGLISH**.

Output strictly in JSON format.
`;


const JSON_FORMAT_INSTRUCTION = `
Output strictly in this JSON format:
{
  "decision": "BUY" | "WAIT" | "SELL",
  "confidence_score": "High" | "Medium" | "Low",
  "analysis_summary": "Max 3 sentences in INDONESIAN. Explicitly mention confluence between timeframes if applicable, keeping trading terms in ENGLISH.",
  "trading_plan": {
    "entry_area": "Specific price zone",
    "target_price": "Take profit level",
    "stop_loss": "Invalidation level",
    "risk_reward_ratio": "e.g. 1:3"
  }
}
`;

// === MOCK RESPONSES FOR DEMO MODE ===
const MOCK_RESPONSE_SINGLE = {
    decision: "BUY",
    confidence_score: "High",
    is_demo: true,
    analysis_summary: "Pola Bullish Engulfing yang kuat terdeteksi di area Support. Volume mengkonfirmasi pergerakan naik.",
    trading_plan: {
        entry_area: "105.50 - 105.80",
        target_price: "108.00",
        stop_loss: "104.90",
        risk_reward_ratio: "1:2.5"
    }
};

const MOCK_RESPONSE_MULTI = {
    decision: "BUY",
    confidence_score: "High",
    is_demo: true,
    analysis_summary: "KONFLUENSI TERKONFIRMASI: H4 (Gambar 1) menunjukkan Breakout bersih dari Bullish Flag. M5 (Gambar 2) baru saja Retest level breakout dengan Pinbar. Setup sangat solid.",
    trading_plan: {
        entry_area: "Entry Agresif di 2050",
        target_price: "2100 (Swing High H4)",
        stop_loss: "Di bawah 2040 (Low M5)",
        risk_reward_ratio: "1:5"
    }
};

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const mode = formData.get("mode") as string;
        const context = formData.get("context") as string || "No additional context provided.";

        // Handle both single and dual image uploads
        const imageFile1 = (formData.get("image") || formData.get("image_htf")) as File; // Backward compat + New HTF
        const imageFile2 = formData.get("image_ltf") as File | null;

        if (!imageFile1 || !mode) {
            return NextResponse.json(
                { error: "Missing required image or mode." },
                { status: 400 }
            );
        }

        const isMultiTimeframe = !!imageFile2;

        // === DEMO MODE CHECK ===
        const isDemoMode = process.env.DEMO_MODE === 'true';
        if (isDemoMode) {
            logger.info(`🚀 DEMO MODE ACTIVE (${isMultiTimeframe ? 'Multi' : 'Single'} TF)`);

            // Simulate AI processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            return NextResponse.json(
                isMultiTimeframe ? MOCK_RESPONSE_MULTI : MOCK_RESPONSE_SINGLE
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "API key not configured." },
                { status: 500 }
            );
        }

        // Prepare prompt based on mode and number of images
        let promptTemplate = "";
        if (isMultiTimeframe) {
            promptTemplate = mode === "scalping" ? SCALPING_PROMPT_MULTI : SWING_PROMPT_MULTI;
        } else {
            promptTemplate = mode === "scalping" ? SCALPING_PROMPT_SINGLE : SWING_PROMPT_SINGLE;
        }

        const fullPrompt = promptTemplate.replace("{{USER_CONTEXT}}", context) + JSON_FORMAT_INSTRUCTION;

        // Prepare image parts for Gemini
        interface ImagePart {
            inlineData: {
                data: string;
                mimeType: string;
            };
        }
        const imageParts: ImagePart[] = [];

        // Process Image 1 (HTF/Main)
        const buffer1 = await imageFile1.arrayBuffer();
        imageParts.push({
            inlineData: {
                data: Buffer.from(buffer1).toString("base64"),
                mimeType: imageFile1.type,
            },
        });

        // Process Image 2 (LTF) if exists
        if (imageFile2 && isMultiTimeframe) {
            const buffer2 = await imageFile2.arrayBuffer();
            imageParts.push({
                inlineData: {
                    data: Buffer.from(buffer2).toString("base64"),
                    mimeType: imageFile2.type,
                },
            });
        }

        // Call Gemini API
        const modelName = "gemini-1.5-flash"; // Optimized model
        const modelsToTry = [modelName]; // Can add fallbacks later

        let responseText = "";
        let lastError: unknown = null;

        for (const model of modelsToTry) {
            try {
                logger.info(`Analyzing with ${model} (Multi-TF: ${isMultiTimeframe})`);

                responseText = await withRetry(async () => {
                    const aiModel = genAI.getGenerativeModel({ model });
                    const result = await aiModel.generateContent([
                        fullPrompt,
                        ...imageParts // Spread image parts (1 or 2 images)
                    ]);
                    return result.response.text();
                }, `Gemini ${model}`);

                break;
            } catch (e) {
                logger.error(`Failed with ${model}`, e);
                lastError = e;
            }
        }

        if (!responseText) {
            return NextResponse.json(
                { error: getErrorMessage(lastError) },
                { status: 503 }
            );
        }

        // Clean and Parse JSON
        const cleanedText = responseText.replace(/```json|```/g, "").trim();

        try {
            const jsonResponse = JSON.parse(cleanedText);
            const validatedResponse = AnalysisResponseSchema.parse(jsonResponse);
            return NextResponse.json(validatedResponse);
        } catch (error) {
            logger.error("JSON Parse Error", error);
            return NextResponse.json(
                { error: "Failed to parse AI response." },
                { status: 500 }
            );
        }

    } catch (error) {
        logger.error("Analysis Error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}
