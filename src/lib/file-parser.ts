import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import JSZip from "jszip";

/**
 * Extract text content from various file formats.
 * Runs server-side only (Node.js).
 */
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string
): Promise<{ text: string; pageCount: number }> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";

  switch (ext) {
    case "pdf":
      return extractPdf(buffer);
    case "docx":
      return extractDocx(buffer);
    case "doc":
      return extractDoc(buffer);
    case "pptx":
      return extractPptx(buffer);
    case "xlsx":
    case "xls":
      return extractExcel(buffer, ext);
    case "txt":
    case "md":
    case "csv":
      return { text: buffer.toString("utf-8"), pageCount: 1 };
    case "html":
    case "htm":
    case "xml": {
      const raw = buffer.toString("utf-8");
      const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return { text, pageCount: 1 };
    }
    case "json":
      return { text: buffer.toString("utf-8"), pageCount: 1 };
    case "rtf":
      return extractRtf(buffer);
    case "odt":
      return extractOdt(buffer);
    default:
      return {
        text: `지원하지 않는 파일 형식입니다: .${ext}`,
        pageCount: 0,
      };
  }
}

// --- PDF ---
async function extractPdf(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdf.getText();
  return {
    text: result.text.trim(),
    pageCount: result.total,
  };
}

// --- DOCX (Word) ---
async function extractDocx(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  const pageCount = Math.max(1, Math.ceil(text.length / 3000));
  return { text, pageCount };
}

// --- DOC (Legacy Word) ---
async function extractDoc(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  // Legacy .doc files: extract readable ASCII/Unicode text from binary
  const raw = buffer.toString("latin1");
  const textChunks: string[] = [];
  // .doc files contain text interleaved with binary. Extract runs of printable chars.
  const matches = raw.match(/[\x20-\x7E\u00A0-\u00FF]{4,}/g);
  if (matches) {
    textChunks.push(...matches);
  }
  const text =
    textChunks.join(" ").trim() ||
    ".doc 파일에서 텍스트를 추출할 수 없습니다. .docx 형식을 사용해 주세요.";
  return { text, pageCount: Math.max(1, Math.ceil(text.length / 3000)) };
}

// --- PPTX (PowerPoint) ---
async function extractPptx(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  const zip = await JSZip.loadAsync(buffer);
  const slideTexts: string[] = [];

  // PPTX slides are in ppt/slides/slide1.xml, slide2.xml, etc.
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] ?? "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] ?? "0");
      return numA - numB;
    });

  for (const slidePath of slideFiles) {
    const xml = await zip.files[slidePath].async("string");
    // Extract text from <a:t> tags (PowerPoint text runs)
    const texts: string[] = [];
    const regex = /<a:t>([\s\S]*?)<\/a:t>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      if (match[1].trim()) texts.push(match[1].trim());
    }
    if (texts.length > 0) {
      const slideNum = slidePath.match(/slide(\d+)/)?.[1];
      slideTexts.push(`[슬라이드 ${slideNum}]\n${texts.join(" ")}`);
    }
  }

  const text =
    slideTexts.join("\n\n") || "PPTX 파일에서 텍스트를 추출할 수 없습니다.";
  return { text, pageCount: slideFiles.length };
}

// --- XLSX / XLS (Excel) ---
function extractExcel(
  buffer: Buffer,
  ext: string
): { text: string; pageCount: number } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetTexts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) {
      sheetTexts.push(`[시트: ${sheetName}]\n${csv.trim()}`);
    }
  }

  const text =
    sheetTexts.join("\n\n") ||
    `${ext.toUpperCase()} 파일에서 데이터를 추출할 수 없습니다.`;
  return { text, pageCount: workbook.SheetNames.length };
}

// --- RTF ---
function extractRtf(buffer: Buffer): { text: string; pageCount: number } {
  const raw = buffer.toString("utf-8");
  // Simple RTF text extraction: strip RTF control words and groups
  const text = raw
    .replace(/\{\\[^{}]*\}/g, "") // remove nested groups like {\fonttbl...}
    .replace(/\\[a-z]+\d*\s?/gi, "") // remove control words like \par, \b0
    .replace(/[{}]/g, "") // remove remaining braces
    .replace(/\s+/g, " ")
    .trim();
  return { text, pageCount: Math.max(1, Math.ceil(text.length / 3000)) };
}

// --- ODT (LibreOffice) ---
async function extractOdt(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  const zip = await JSZip.loadAsync(buffer);
  const contentFile = zip.files["content.xml"];
  if (!contentFile) {
    return { text: "ODT 파일에서 content.xml을 찾을 수 없습니다.", pageCount: 0 };
  }

  const xml = await contentFile.async("string");
  // Extract text from <text:p> and similar elements
  const text = xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { text, pageCount: Math.max(1, Math.ceil(text.length / 3000)) };
}
