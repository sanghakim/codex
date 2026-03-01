import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
import {
  translateText,
  translateLongText,
  translateMarkup,
  translateJson,
  translateCsv,
} from "@/lib/translate-client";

function mockGoogleTranslateResponse(translatedText: string, detectedLang = "ko") {
  return [
    [[translatedText, null, null, null, null]],
    null,
    detectedLang,
  ];
}

describe("translate-client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("translateText", () => {
    it("should call Google Translate API and return result", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Hello"),
      });

      const result = await translateText("안녕하세요", "ko", "en");
      expect(result.translatedText).toBe("Hello");
      expect(result.detectedLanguage).toBe("ko");
    });

    it("should handle auto-detect source language", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Hello", "ko"),
      });

      const result = await translateText("안녕하세요", "auto", "en");
      expect(result.translatedText).toBe("Hello");
      expect(result.detectedLanguage).toBe("ko");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("sl=auto"),
        expect.any(Object)
      );
    });

    it("should throw on API error", async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await expect(translateText("test", "ko", "en")).rejects.toThrow(
        "Translation API error: 500"
      );
    });

    it("should handle multiple sentence segments", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          [
            ["Hello. ", null, null],
            ["How are you?", null, null],
          ],
          null,
          "ko",
        ],
      });

      const result = await translateText("안녕하세요. 잘 지내세요?", "ko", "en");
      expect(result.translatedText).toBe("Hello. How are you?");
    });
  });

  describe("translateLongText", () => {
    it("should handle short text in single chunk", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Hello"),
      });

      const result = await translateLongText("안녕", "ko", "en");
      expect(result.translatedText).toBe("Hello");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should split long text into chunks", async () => {
      const longText = "가".repeat(5000);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleTranslateResponse("A".repeat(3000)),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoogleTranslateResponse("A".repeat(2000)),
        });

      const result = await translateLongText(longText, "ko", "en");
      expect(result.translatedText.length).toBe(5000);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("translateMarkup", () => {
    it("should preserve HTML tags and translate text", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Title\n---SPLIT---\nContent"),
      });

      const result = await translateMarkup(
        "<h1>제목</h1><p>내용</p>",
        "ko",
        "en"
      );
      expect(result).toContain("<h1>");
      expect(result).toContain("</h1>");
      expect(result).toContain("<p>");
    });

    it("should return unchanged content when no text nodes found", async () => {
      const result = await translateMarkup("<br/><hr/>", "ko", "en");
      expect(result).toBe("<br/><hr/>");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("translateJson", () => {
    it("should preserve JSON structure and translate values", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Title\n---SPLIT---\nDescription"),
      });

      const input = JSON.stringify({ title: "제목", desc: "설명" });
      const result = await translateJson(input, "ko", "en");
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty("title");
      expect(parsed).toHaveProperty("desc");
    });

    it("should handle empty JSON object", async () => {
      const result = await translateJson("{}", "ko", "en");
      expect(result).toBe("{}");
    });

    it("should handle invalid JSON gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("not json content"),
      });

      const result = await translateJson("not json", "ko", "en");
      expect(result).toBe("not json content");
    });
  });

  describe("translateCsv", () => {
    it("should preserve header and translate data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () =>
          mockGoogleTranslateResponse(
            "Product A\n---SPLIT---\nFirst product\n---SPLIT---\nElectronics"
          ),
      });

      const input = "이름,설명,카테고리\n제품A,첫 번째 제품,전자기기";
      const result = await translateCsv(input, "ko", "en");
      const lines = result.split("\n");
      expect(lines[0]).toBe("이름,설명,카테고리");
      expect(lines.length).toBe(2);
    });

    it("should handle single-line CSV (header only)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleTranslateResponse("Name,Description"),
      });

      const result = await translateCsv("이름,설명", "ko", "en");
      expect(result).toBe("Name,Description");
    });
  });
});
