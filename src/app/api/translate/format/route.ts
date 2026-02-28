import { NextRequest, NextResponse } from "next/server";
import { translateFormat } from "@/lib/translator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, format, sourceLang, targetLang } = body;

    if (!content || !format || !targetLang) {
      return NextResponse.json(
        { error: "content, format, and targetLang are required" },
        { status: 400 }
      );
    }

    const translatedContent = await translateFormat(
      content,
      format,
      sourceLang || "auto",
      targetLang
    );

    return NextResponse.json({
      translatedContent,
      format,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Format translation failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 500 }
    );
  }
}
