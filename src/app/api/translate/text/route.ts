import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/translator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceLang, targetLang } = body;

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "text and targetLang are required" },
        { status: 400 }
      );
    }

    const result = await translateText(
      text,
      sourceLang || "auto",
      targetLang
    );

    return NextResponse.json({
      translatedText: result.translatedText,
      detectedLanguage: result.detectedLanguage,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Translation failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 500 }
    );
  }
}
