import { NextRequest, NextResponse } from "next/server";
import Tesseract from "tesseract.js";
import { translateImageText } from "@/lib/translator";

// Map our language codes to Tesseract language codes
const LANG_MAP: Record<string, string> = {
  auto: "eng+kor+jpn+chi_sim",
  ko: "kor",
  en: "eng",
  ja: "jpn",
  zh: "chi_sim",
  "zh-TW": "chi_tra",
  es: "spa",
  fr: "fra",
  de: "deu",
  pt: "por",
  ru: "rus",
  ar: "ara",
  hi: "hin",
  th: "tha",
  vi: "vie",
  id: "ind",
  it: "ita",
  nl: "nld",
  pl: "pol",
  tr: "tur",
  sv: "swe",
};

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

    // Convert File to Buffer for Tesseract
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine Tesseract language
    const tessLang = LANG_MAP[sourceLang] || "eng+kor+jpn+chi_sim";

    // Perform OCR using Tesseract.js
    const { data } = await Tesseract.recognize(buffer, tessLang);

    const extractedText = data.text.trim();

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
