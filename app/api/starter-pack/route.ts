// app/api/starter-pack/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * IMPORTANT:
 * - Set GEMINI_MODEL_ID in your env to the actual Gemini 3 model ID
 *   from Google AI Studio (e.g. the one that supports image output).
 */
const MODEL_ID = process.env.GEMINI_MODEL_ID || "gemini-3.0-flash";

/**
 * Reference images that live in your /public folder.
 *
 * Example structure:
 *   public/
 *     starter-pack-refs/
 *       ref-1.png
 *       ref-2.png
 */
const REFERENCE_IMAGES = [
    {
        filename: "starter-pack-refs/ref-1.webp",
        mimeType: "image/webp",
    },
    {
        filename: "starter-pack-refs/ref-2.webp",
        mimeType: "image/webp",
    },
    {
        filename: "starter-pack-refs/ref-3.webp",
        mimeType: "image/webp",
    },
    {
        filename: "starter-pack-refs/ref-4.webp",
        mimeType: "image/webp",
    },
    {
        filename: "starter-pack-refs/ref-5.webp",
        mimeType: "image/webp",
    },
    {
        filename: "starter-pack-refs/ref-6.webp",
        mimeType: "image/webp",
    },
    {
        filename: "starter-pack-refs/ref-7.webp",
        mimeType: "image/webp",
    },
];

const STARTER_PACK_PROMPT = `
You will receive multiple images:
The FIRST images are reference examples showing the @PATHETIC starter pack style (layout, tone, composition, and design language).
The FINAL image is the user’s outfit / fit pic. Base all actual content on this final image only.
The reference images are style guides only. Do NOT copy their content or items.
Produce a @PATHETIC-style starter pack based on the final fit pic.

STRUCTURE REQUIREMENTS (READ CAREFULLY)
Remove the person from the final image. Isolate only clothing/items.
Use current (summer 2025) fashion trends to identify brands, tropes, patterns, or subculture signifiers.
Include one witty title at the very top (~top 10% of image height).
Use Arial Narrow font.
This top title band must contain only the title—no items, no captions.
Below the title band, arrange exactly FOUR items in a clean 2×2 grid layout.
Each grid cell must be a perfect square.
Absolutely NO visible lines, borders, strokes, dividers, boxes, shapes, or separators of ANY kind. The grid must be created purely by spatial arrangement and spacing. This is a hard constraint.
Each item has a short, cutting caption directly underneath it, contained visually within its own cell area.
Background must be pure flat white (#FFFFFF).
Items and text may NOT overlap.
Leave generous margins so nothing touches canvas edges.
Output a single image in roughly 5:6 aspect ratio.

STYLE + TONE
The meme must be biting, culturally aware, and in line with the snarky @PATHETIC tone.
Captions should be modern, punchy, and highly specific to what the model can infer from the exact clothing pieces.
Avoid generic or vague titles. Make the archetype hyper-specific.

NEGATIVE INSTRUCTIONS (DO NOT DO ANY OF THESE)
Do NOT draw grid lines, borders, boxes, separators, or any visual structure marks.
Do NOT create shadows or faint strokes that resemble separators.
Do NOT place ANY content inside the top 10% title band except the title.
Do NOT crop items or text.
Do NOT overlap elements.

Output the final result as a single image.
`;

/**
 * Load reference images from /public and convert them to Gemini inlineData parts.
 * Called on each request; you can memoize if needed, but this is fine to start.
 */
async function loadReferenceImageParts() {
    const parts = [];

    for (const ref of REFERENCE_IMAGES) {
        const filePath = path.join(process.cwd(), "public", ref.filename);
        const buffer = await fs.readFile(filePath);
        const base64Data = buffer.toString("base64");

        parts.push({
            inlineData: {
                data: base64Data,
                mimeType: ref.mimeType,
            },
        });
    }

    return parts;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image");

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: "Missing image file" }, { status: 400 });
        }

        if (file.size > 20 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Image too large (max ~20MB)" },
                { status: 400 }
            );
        }

        // User-uploaded image (treated as the LAST / main prompt image)
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        const userImagePart = {
            inlineData: {
                data: base64Data,
                mimeType: file.type || "image/png",
            },
        };

        // Load reference images from /public (FIRST images)
        const referenceImageParts = await loadReferenceImageParts();

        const model = genAI.getGenerativeModel({
            model: MODEL_ID,
        });

        // Order matters:
        // 1) Text prompt
        // 2) Reference images (from public)
        // 3) User-uploaded image (main fit pic)
        const parts = [
            { text: STARTER_PACK_PROMPT },
            ...referenceImageParts,
            userImagePart,
        ];

        const result = await model.generateContent(parts);

        const response = result.response;
        const candidates = response.candidates || [];

        let dataUrl: string | null = null;

        if (candidates.length) {
            const contentParts = candidates[0].content?.parts || [];
            for (const part of contentParts) {
                const inline = (part as any).inlineData;
                if (inline?.data) {
                    const mime = inline.mimeType || "image/png";
                    dataUrl = `data:${mime};base64,${inline.data}`;
                    break;
                }
            }
        }

        if (!dataUrl) {
            console.error(
                "Gemini did not return inlineData image. Full response:",
                JSON.stringify(response, null, 2)
            );

            return NextResponse.json(
                {
                    error:
                        "Gemini did not return an image (check model ID / config / quota).",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({ image: dataUrl });
    } catch (err: any) {
        console.error("starter-pack error", err);

        const message =
            err?.message ||
            err?.error?.message ||
            "Internal server error from Gemini";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
