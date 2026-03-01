import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  trackTranslation,
  getEvents,
  clearEvents,
  getUsageStats,
} from "@/lib/usage-tracker";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("usage-tracker", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("trackTranslation", () => {
    it("should store a translation event", () => {
      trackTranslation({
        type: "text",
        sourceLang: "ko",
        targetLang: "en",
        charCount: 100,
      });

      const events = getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("text");
      expect(events[0].sourceLang).toBe("ko");
      expect(events[0].targetLang).toBe("en");
      expect(events[0].charCount).toBe(100);
      expect(events[0].id).toBeTruthy();
      expect(events[0].timestamp).toBeTruthy();
    });

    it("should accumulate multiple events", () => {
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 50 });
      trackTranslation({ type: "image", sourceLang: "en", targetLang: "ko", charCount: 200, fileName: "test.png" });
      trackTranslation({ type: "document", sourceLang: "ko", targetLang: "ja", charCount: 1000, fileName: "doc.pdf" });

      const events = getEvents();
      expect(events).toHaveLength(3);
    });

    it("should include optional fields", () => {
      trackTranslation({
        type: "format",
        sourceLang: "ko",
        targetLang: "en",
        charCount: 300,
        formatType: "json",
      });

      const events = getEvents();
      expect(events[0].formatType).toBe("json");
    });
  });

  describe("getEvents", () => {
    it("should return empty array when no events exist", () => {
      expect(getEvents()).toEqual([]);
    });
  });

  describe("clearEvents", () => {
    it("should remove all events", () => {
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 10 });
      expect(getEvents()).toHaveLength(1);

      clearEvents();
      expect(getEvents()).toEqual([]);
    });
  });

  describe("getUsageStats", () => {
    it("should return zeroed stats when no events", () => {
      const stats = getUsageStats();
      expect(stats.totalTranslations).toBe(0);
      expect(stats.totalCharacters).toBe(0);
      expect(stats.recentEvents).toEqual([]);
      expect(stats.topLanguagePairs).toEqual([]);
    });

    it("should compute correct totals", () => {
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 100 });
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 200 });
      trackTranslation({ type: "image", sourceLang: "en", targetLang: "ko", charCount: 50 });

      const stats = getUsageStats();
      expect(stats.totalTranslations).toBe(3);
      expect(stats.totalCharacters).toBe(350);
    });

    it("should compute byType counts", () => {
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 100 });
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 100 });
      trackTranslation({ type: "image", sourceLang: "ko", targetLang: "en", charCount: 50 });
      trackTranslation({ type: "document", sourceLang: "ko", targetLang: "en", charCount: 500 });

      const stats = getUsageStats();
      expect(stats.byType.text).toBe(2);
      expect(stats.byType.image).toBe(1);
      expect(stats.byType.document).toBe(1);
    });

    it("should compute top language pairs", () => {
      for (let i = 0; i < 5; i++) {
        trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 10 });
      }
      for (let i = 0; i < 3; i++) {
        trackTranslation({ type: "text", sourceLang: "en", targetLang: "ko", charCount: 10 });
      }

      const stats = getUsageStats();
      expect(stats.topLanguagePairs[0].pair).toBe("ko → en");
      expect(stats.topLanguagePairs[0].count).toBe(5);
      expect(stats.topLanguagePairs[1].pair).toBe("en → ko");
      expect(stats.topLanguagePairs[1].count).toBe(3);
    });

    it("should return recent events in reverse order", () => {
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 10 });
      trackTranslation({ type: "image", sourceLang: "en", targetLang: "ko", charCount: 20 });

      const stats = getUsageStats();
      expect(stats.recentEvents[0].type).toBe("image");
      expect(stats.recentEvents[1].type).toBe("text");
    });

    it("should compute byDate correctly", () => {
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 10 });

      const stats = getUsageStats();
      const today = new Date().toISOString().split("T")[0];
      expect(stats.byDate[today]).toBe(1);
    });

    it("should compute byHour correctly", () => {
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 10 });

      const stats = getUsageStats();
      const currentHour = new Date().getHours();
      expect(stats.byHour[currentHour]).toBe(1);
    });

    it("should compute source and target language frequencies", () => {
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "en", charCount: 10 });
      trackTranslation({ type: "text", sourceLang: "ko", targetLang: "ja", charCount: 10 });
      trackTranslation({ type: "text", sourceLang: "en", targetLang: "ko", charCount: 10 });

      const stats = getUsageStats();
      expect(stats.bySourceLang.ko).toBe(2);
      expect(stats.bySourceLang.en).toBe(1);
      expect(stats.byTargetLang.en).toBe(1);
      expect(stats.byTargetLang.ja).toBe(1);
      expect(stats.byTargetLang.ko).toBe(1);
    });
  });
});
