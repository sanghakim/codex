import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

import {
  translateText,
  translateImageText,
  translateDocument,
  translateFormat,
} from "@/lib/translator";

function mockGoogleTranslateResponse(translatedText: string, detectedLang = "ko") {
  return [
    [[translatedText, null, null, null, null]],
    null,
    detectedLang,
  ];
}

describe("translator (server-side)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("translateText", () => {
    it("should translate text using Google API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Hello"),
      });

      const result = await translateText("안녕하세요", "ko", "en");
      expect(result.translatedText).toBe("Hello");
      expect(result.detectedLanguage).toBe("ko");
    });

    it("should throw on API error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
      await expect(translateText("test", "ko", "en")).rejects.toThrow();
    });
  });

  describe("translateImageText", () => {
    it("should return both extracted and translated text", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Hello world"),
      });

      const result = await translateImageText("안녕 세계", "ko", "en");
      expect(result.extractedText).toBe("안녕 세계");
      expect(result.translatedText).toBe("Hello world");
    });
  });

  describe("translateDocument", () => {
    it("should translate and compute page count", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Translated document content"),
      });

      const result = await translateDocument("문서 내용", "doc.pdf", "ko", "en");
      expect(result.originalText).toBe("문서 내용");
      expect(result.translatedText).toBe("Translated document content");
      expect(result.pageCount).toBeGreaterThanOrEqual(1);
    });

    it("should handle long documents by chunking", async () => {
      const longText = "가".repeat(8000);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleTranslateResponse("A".repeat(4000)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleTranslateResponse("A".repeat(4000)),
        });

      const result = await translateDocument(longText, "big.docx", "ko", "en");
      expect(result.translatedText.length).toBe(8000);
    });
  });

  describe("translateFormat", () => {
    it("should translate HTML format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Title"),
      });

      const result = await translateFormat("<h1>제목</h1>", "html", "ko", "en");
      expect(result).toContain("<h1>");
      expect(result).toContain("Title");
    });

    it("should translate JSON format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Hello"),
      });

      const result = await translateFormat('{"key":"안녕"}', "json", "ko", "en");
      const parsed = JSON.parse(result);
      expect(parsed.key).toBe("Hello");
    });

    it("should translate CSV format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Product\n---SPLIT---\nElectronics"),
      });

      const result = await translateFormat("이름,카테고리\n제품,전자기기", "csv", "ko", "en");
      expect(result).toContain("이름,카테고리");
    });

    it("should translate markdown format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("# Title\nContent"),
      });

      const result = await translateFormat("# 제목\n내용", "markdown", "ko", "en");
      expect(result).toContain("Title");
    });

    it("should handle unknown format with plain translation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Hello"),
      });

      const result = await translateFormat("안녕", "unknown", "ko", "en");
      expect(result).toBe("Hello");
    });
  });
});
