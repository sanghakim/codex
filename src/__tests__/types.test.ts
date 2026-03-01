import { describe, it, expect } from "vitest";
import type {
  Language,
  TextTranslationRequest,
  TextTranslationResponse,
  ImageTranslationRequest,
  ImageTranslationResponse,
  DocumentTranslationRequest,
  DocumentTranslationResponse,
  FormatTranslationRequest,
  FormatTranslationResponse,
  TranslationTab,
} from "@/types/translation";

describe("TypeScript type definitions", () => {
  it("should validate Language type shape", () => {
    const lang: Language = { code: "ko", name: "Korean", nativeName: "한국어" };
    expect(lang.code).toBe("ko");
    expect(lang.name).toBe("Korean");
    expect(lang.nativeName).toBe("한국어");
  });

  it("should validate TextTranslationRequest", () => {
    const req: TextTranslationRequest = {
      text: "hello",
      sourceLang: "en",
      targetLang: "ko",
    };
    expect(req.text).toBe("hello");
  });

  it("should validate TextTranslationResponse", () => {
    const res: TextTranslationResponse = {
      translatedText: "안녕",
      detectedLanguage: "en",
      confidence: 0.99,
    };
    expect(res.translatedText).toBe("안녕");
  });

  it("should validate ImageTranslationResponse", () => {
    const res: ImageTranslationResponse = {
      extractedText: "Hello",
      translatedText: "안녕",
    };
    expect(res.extractedText).toBe("Hello");
  });

  it("should validate DocumentTranslationResponse", () => {
    const res: DocumentTranslationResponse = {
      translatedDocumentUrl: "/path/to/doc",
      pageCount: 5,
      originalText: "Original",
      translatedText: "Translated",
    };
    expect(res.pageCount).toBe(5);
  });

  it("should validate FormatTranslationRequest", () => {
    const formats: FormatTranslationRequest["format"][] = [
      "html",
      "markdown",
      "json",
      "xml",
      "csv",
    ];
    expect(formats).toHaveLength(5);
  });

  it("should validate FormatTranslationResponse", () => {
    const res: FormatTranslationResponse = {
      translatedContent: "<h1>Title</h1>",
      format: "html",
    };
    expect(res.format).toBe("html");
  });

  it("should validate TranslationTab type", () => {
    const tabs: TranslationTab[] = ["text", "image", "document", "format"];
    expect(tabs).toHaveLength(4);
    expect(tabs).toContain("text");
    expect(tabs).toContain("image");
    expect(tabs).toContain("document");
    expect(tabs).toContain("format");
  });

  // Verify unused variable warnings are suppressed properly
  it("should allow optional fields in types", () => {
    const reqImg: ImageTranslationRequest = {
      image: new File(["test"], "test.png", { type: "image/png" }),
      sourceLang: "auto",
      targetLang: "en",
    };
    expect(reqImg.image).toBeInstanceOf(File);

    const reqDoc: DocumentTranslationRequest = {
      document: new File(["test"], "test.pdf", { type: "application/pdf" }),
      sourceLang: "ko",
      targetLang: "en",
    };
    expect(reqDoc.document).toBeInstanceOf(File);
  });
});
