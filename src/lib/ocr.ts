/**
 * OCR text extraction using Tesseract.js.
 * Server-side only (Node.js).
 */
import * as Tesseract from "tesseract.js";

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

export function getTesseractLang(sourceLang: string): string {
  return LANG_MAP[sourceLang] || "eng+kor+jpn+chi_sim";
}

export async function extractTextFromImage(
  imageBuffer: Buffer,
  sourceLang: string
): Promise<string> {
  const tessLang = getTesseractLang(sourceLang);
  const { data } = await Tesseract.recognize(imageBuffer, tessLang);
  return data.text.trim();
}
