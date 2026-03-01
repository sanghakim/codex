import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external modules before imports
vi.mock("@/lib/ocr", () => ({
  extractTextFromImage: vi.fn().mockResolvedValue("OCR extracted text"),
}));

vi.mock("@/lib/translator", () => ({
  translateText: vi.fn().mockResolvedValue({
    translatedText: "Translated text",
    detectedLanguage: "ko",
  }),
  translateImageText: vi.fn().mockResolvedValue({
    extractedText: "OCR extracted text",
    translatedText: "Translated from image",
  }),
  translateFormat: vi.fn().mockResolvedValue("<h1>Translated</h1>"),
}));

vi.mock("@/lib/file-parser", () => ({
  extractTextFromFile: vi.fn().mockResolvedValue({
    text: "Extracted document text",
    pageCount: 3,
  }),
}));

describe("API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/translate/text", () => {
    it("should validate required fields", async () => {
      const { POST } = await import("@/app/api/translate/text/route");
      const request = new Request("http://localhost/api/translate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // @ts-expect-error - NextRequest compatibility
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it("should translate text successfully", async () => {
      const { POST } = await import("@/app/api/translate/text/route");
      const request = new Request("http://localhost/api/translate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "안녕하세요",
          sourceLang: "ko",
          targetLang: "en",
        }),
      });

      // @ts-expect-error - NextRequest compatibility
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.translatedText).toBe("Translated text");
    });
  });

  describe("POST /api/translate/format", () => {
    it("should validate required fields", async () => {
      const { POST } = await import("@/app/api/translate/format/route");
      const request = new Request("http://localhost/api/translate/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // @ts-expect-error - NextRequest compatibility
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it("should translate format successfully", async () => {
      const { POST } = await import("@/app/api/translate/format/route");
      const request = new Request("http://localhost/api/translate/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "<h1>제목</h1>",
          format: "html",
          sourceLang: "ko",
          targetLang: "en",
        }),
      });

      // @ts-expect-error - NextRequest compatibility
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.translatedContent).toBeTruthy();
    });
  });

  describe("POST /api/translate/document", () => {
    it("should validate that file is required", async () => {
      const { POST } = await import("@/app/api/translate/document/route");
      const formData = new FormData();

      const request = new Request("http://localhost/api/translate/document", {
        method: "POST",
        body: formData,
      });

      // @ts-expect-error - NextRequest compatibility
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it("should parse document and return text", async () => {
      const { POST } = await import("@/app/api/translate/document/route");
      const formData = new FormData();
      formData.append(
        "document",
        new File(["test content"], "test.txt", { type: "text/plain" })
      );

      const request = new Request("http://localhost/api/translate/document", {
        method: "POST",
        body: formData,
      });

      // @ts-expect-error - NextRequest compatibility
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.extractedText).toBe("Extracted document text");
      expect(data.pageCount).toBe(3);
    });
  });

  describe("POST /api/translate/image", () => {
    it("should validate that image is required", async () => {
      const { POST } = await import("@/app/api/translate/image/route");
      const formData = new FormData();

      const request = new Request("http://localhost/api/translate/image", {
        method: "POST",
        body: formData,
      });

      // @ts-expect-error - NextRequest compatibility
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it("should extract text from image and translate", async () => {
      const { POST } = await import("@/app/api/translate/image/route");
      const formData = new FormData();
      formData.append(
        "image",
        new File(["fake-image-data"], "test.png", { type: "image/png" })
      );
      formData.append("sourceLang", "ko");
      formData.append("targetLang", "en");

      const request = new Request("http://localhost/api/translate/image", {
        method: "POST",
        body: formData,
      });

      // @ts-expect-error - NextRequest compatibility
      const response = await POST(request);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.extractedText).toBeTruthy();
      expect(data.translatedText).toBeTruthy();
    });
  });
});
