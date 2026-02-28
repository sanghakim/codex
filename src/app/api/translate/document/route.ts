import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/file-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("document") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "document file is required" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for Node.js parsers
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { text, pageCount } = await extractTextFromFile(buffer, file.name);

    return NextResponse.json({
      extractedText: text,
      pageCount,
      fileName: file.name,
    });
  } catch (e) {
    console.error("Document parse error:", e);
    return NextResponse.json(
      { error: `파일 파싱 실패: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 500 }
    );
  }
}
