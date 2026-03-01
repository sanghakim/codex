import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  TARGET_LANGUAGES,
  getLanguageName,
  getLanguageNativeName,
} from "@/lib/languages";

describe("languages", () => {
  describe("SUPPORTED_LANGUAGES", () => {
    it("should include auto-detect option", () => {
      const auto = SUPPORTED_LANGUAGES.find((l) => l.code === "auto");
      expect(auto).toBeDefined();
      expect(auto?.name).toBe("Detect Language");
    });

    it("should include Korean and English", () => {
      expect(SUPPORTED_LANGUAGES.find((l) => l.code === "ko")).toBeDefined();
      expect(SUPPORTED_LANGUAGES.find((l) => l.code === "en")).toBeDefined();
    });

    it("should have at least 20 languages", () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(20);
    });

    it("should have unique codes", () => {
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it("each language should have code, name, and nativeName", () => {
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(lang.code).toBeTruthy();
        expect(lang.name).toBeTruthy();
        expect(lang.nativeName).toBeTruthy();
      }
    });
  });

  describe("TARGET_LANGUAGES", () => {
    it("should not include auto-detect", () => {
      const auto = TARGET_LANGUAGES.find((l) => l.code === "auto");
      expect(auto).toBeUndefined();
    });

    it("should have one less entry than SUPPORTED_LANGUAGES", () => {
      expect(TARGET_LANGUAGES.length).toBe(SUPPORTED_LANGUAGES.length - 1);
    });
  });

  describe("getLanguageName", () => {
    it("should return language name for valid code", () => {
      expect(getLanguageName("ko")).toBe("Korean");
      expect(getLanguageName("en")).toBe("English");
      expect(getLanguageName("ja")).toBe("Japanese");
    });

    it("should return code itself for unknown code", () => {
      expect(getLanguageName("xx")).toBe("xx");
    });
  });

  describe("getLanguageNativeName", () => {
    it("should return native name for valid code", () => {
      expect(getLanguageNativeName("ko")).toBe("한국어");
      expect(getLanguageNativeName("ja")).toBe("日本語");
    });

    it("should return code itself for unknown code", () => {
      expect(getLanguageNativeName("xx")).toBe("xx");
    });
  });
});
