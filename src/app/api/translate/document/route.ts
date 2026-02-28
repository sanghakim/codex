import { NextRequest, NextResponse } from "next/server";
import { translateDocument } from "@/lib/translator";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("document") as File | null;
    const sourceLang = (formData.get("sourceLang") as string) || "auto";
    const targetLang = (formData.get("targetLang") as string) || "en";

    if (!file) {
      return NextResponse.json(
        { error: "document file is required" },
        { status: 400 }
      );
    }

    // Extract text from the uploaded file
    const originalText = await extractTextFromFile(file);

    const result = await translateDocument(
      originalText,
      file.name,
      sourceLang,
      targetLang
    );

    return NextResponse.json({
      originalText: result.originalText,
      translatedText: result.translatedText,
      pageCount: result.pageCount,
      translatedDocumentUrl: `/downloads/translated_${file.name}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Document translation failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 500 }
    );
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  // For text-based files, read directly
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) {
    return await file.text();
  }

  // For HTML/XML files
  if (name.endsWith(".html") || name.endsWith(".htm") || name.endsWith(".xml")) {
    const raw = await file.text();
    // Strip tags for plain-text extraction
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  // For JSON files
  if (name.endsWith(".json")) {
    return await file.text();
  }

  // For binary formats (PDF, DOCX, etc.) we read as text best-effort
  // In production, use a proper parser (pdf-parse, mammoth, etc.)
  try {
    const text = await file.text();
    if (text && text.length > 0 && !/[\x00-\x08\x0E-\x1F]/.test(text.slice(0, 100))) {
      return text;
    }
  } catch {
    // ignore
  }

  return `[${file.name}] 이 파일 형식(${name.split(".").pop()})의 텍스트 추출을 위해서는 별도의 파서 라이브러리가 필요합니다. 현재 텍스트 기반 파일(.txt, .md, .csv, .html, .json)을 지원합니다.`;
}
