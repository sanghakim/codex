import { NextRequest, NextResponse } from "next/server";
import { mockTranslateImage } from "@/lib/mock-translator";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const sourceLang = (formData.get("sourceLang") as string) || "auto";
    const targetLang = (formData.get("targetLang") as string) || "en";

    if (!image) {
      return NextResponse.json(
        { error: "image file is required" },
        { status: 400 }
      );
    }

    const result = await mockTranslateImage(sourceLang, targetLang);

    return NextResponse.json({
      extractedText: result.extractedText,
      translatedText: result.translatedText,
    });
  } catch {
    return NextResponse.json(
      { error: "Image translation failed" },
      { status: 500 }
    );
  }
}
