import { NextRequest, NextResponse } from "next/server";
import { mockTranslateFormat } from "@/lib/mock-translator";

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

    const translatedContent = await mockTranslateFormat(
      content,
      format,
      sourceLang || "auto",
      targetLang
    );

    return NextResponse.json({
      translatedContent,
      format,
    });
  } catch {
    return NextResponse.json(
      { error: "Format translation failed" },
      { status: 500 }
    );
  }
}
