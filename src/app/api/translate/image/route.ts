import { NextRequest, NextResponse } from "next/server";
import { translateImageText } from "@/lib/translator";
import { extractTextFromImage } from "@/lib/ocr";

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

    // Convert File to Buffer for Tesseract OCR
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Perform OCR using Tesseract.js
    const extractedText = await extractTextFromImage(buffer, sourceLang);

    if (!extractedText) {
      return NextResponse.json({
        extractedText: "",
        translatedText: "",
        message: "이미지에서 텍스트를 찾을 수 없습니다.",
      });
    }

    // Translate the extracted text
    const effectiveSourceLang = sourceLang === "auto" ? "auto" : sourceLang;
    const result = await translateImageText(
      extractedText,
      effectiveSourceLang,
      targetLang
    );

    return NextResponse.json({
      extractedText: result.extractedText,
      translatedText: result.translatedText,
    });
  } catch (e) {
    console.error("Image translation error:", e);
    return NextResponse.json(
      {
        error: `Image translation failed: ${e instanceof Error ? e.message : "unknown"}`,
      },
      { status: 500 }
    );
  }
}
