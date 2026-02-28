import { NextRequest, NextResponse } from "next/server";
import { translateImageText } from "@/lib/translator";

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

    // In production, use an OCR service (e.g. Google Vision, Tesseract)
    // to extract text from the image. For now we return a guidance message.
    const extractedText =
      "[OCR 미연동] 이미지에서 텍스트를 추출하려면 Google Vision API 또는 Tesseract OCR 연동이 필요합니다.";

    const result = await translateImageText(
      extractedText,
      sourceLang === "auto" ? "ko" : sourceLang,
      targetLang
    );

    return NextResponse.json({
      extractedText: result.extractedText,
      translatedText: result.translatedText,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Image translation failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 500 }
    );
  }
}
