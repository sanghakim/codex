import { NextRequest, NextResponse } from "next/server";
import { mockTranslateDocument } from "@/lib/mock-translator";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const document = formData.get("document") as File | null;
    const sourceLang = (formData.get("sourceLang") as string) || "auto";
    const targetLang = (formData.get("targetLang") as string) || "en";

    if (!document) {
      return NextResponse.json(
        { error: "document file is required" },
        { status: 400 }
      );
    }

    const result = await mockTranslateDocument(
      document.name,
      sourceLang,
      targetLang
    );

    return NextResponse.json({
      originalText: result.originalText,
      translatedText: result.translatedText,
      pageCount: result.pageCount,
      translatedDocumentUrl: `/downloads/translated_${document.name}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Document translation failed" },
      { status: 500 }
    );
  }
}
