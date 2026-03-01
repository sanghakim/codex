import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock usage-tracker
vi.mock("@/lib/usage-tracker", () => ({
  trackTranslation: vi.fn(),
  getEvents: vi.fn(() => []),
  clearEvents: vi.fn(),
  getUsageStats: vi.fn(() => ({
    totalTranslations: 0,
    totalCharacters: 0,
    byType: {},
    bySourceLang: {},
    byTargetLang: {},
    byDate: {},
    byHour: {},
    recentEvents: [],
    topLanguagePairs: [],
  })),
}));

import Header from "@/components/Header";
import SwapButton from "@/components/SwapButton";
import LanguageSelector from "@/components/LanguageSelector";
import TranslationTabs from "@/components/TranslationTabs";
import { SUPPORTED_LANGUAGES } from "@/lib/languages";

describe("Header", () => {
  it("should render brand name", () => {
    render(<Header />);
    expect(screen.getByText("TransLingo")).toBeInTheDocument();
  });

  it("should render subtitle", () => {
    render(<Header />);
    expect(screen.getByText("다국어 번역 서비스")).toBeInTheDocument();
  });

  it("should render dashboard link", () => {
    render(<Header />);
    expect(screen.getByText("대시보드")).toBeInTheDocument();
  });
});

describe("SwapButton", () => {
  it("should render and be clickable", () => {
    const handleSwap = vi.fn();
    render(<SwapButton onSwap={handleSwap} />);
    const button = screen.getByTitle("언어 교체");
    fireEvent.click(button);
    expect(handleSwap).toHaveBeenCalledOnce();
  });

  it("should be disabled when disabled prop is true", () => {
    const handleSwap = vi.fn();
    render(<SwapButton onSwap={handleSwap} disabled />);
    const button = screen.getByTitle("언어 교체");
    expect(button).toBeDisabled();
  });
});

describe("LanguageSelector", () => {
  it("should render selected language", () => {
    render(
      <LanguageSelector
        languages={SUPPORTED_LANGUAGES}
        selectedCode="ko"
        onSelect={() => {}}
        label="원본 언어"
      />
    );
    expect(screen.getByText("Korean")).toBeInTheDocument();
  });

  it("should render label", () => {
    render(
      <LanguageSelector
        languages={SUPPORTED_LANGUAGES}
        selectedCode="en"
        onSelect={() => {}}
        label="번역 언어"
      />
    );
    expect(screen.getByText("번역 언어")).toBeInTheDocument();
  });

  it("should open dropdown on click", () => {
    render(
      <LanguageSelector
        languages={SUPPORTED_LANGUAGES}
        selectedCode="ko"
        onSelect={() => {}}
        label="원본 언어"
      />
    );
    fireEvent.click(screen.getByText("Korean"));
    expect(screen.getByPlaceholderText("언어 검색...")).toBeInTheDocument();
  });

  it("should filter languages when searching", () => {
    render(
      <LanguageSelector
        languages={SUPPORTED_LANGUAGES}
        selectedCode="ko"
        onSelect={() => {}}
        label="원본 언어"
      />
    );
    fireEvent.click(screen.getByText("Korean"));
    const searchInput = screen.getByPlaceholderText("언어 검색...");
    fireEvent.change(searchInput, { target: { value: "Japanese" } });
    expect(screen.getByText("Japanese")).toBeInTheDocument();
  });

  it("should call onSelect when language is chosen", () => {
    const handleSelect = vi.fn();
    render(
      <LanguageSelector
        languages={SUPPORTED_LANGUAGES}
        selectedCode="ko"
        onSelect={handleSelect}
        label="원본 언어"
      />
    );
    fireEvent.click(screen.getByText("Korean"));
    // "English" appears twice (name + nativeName), use getAllByText and click the first (name)
    const englishElements = screen.getAllByText("English");
    fireEvent.click(englishElements[0]);
    expect(handleSelect).toHaveBeenCalledWith("en");
  });
});

describe("TranslationTabs", () => {
  it("should render all 4 tabs", () => {
    render(<TranslationTabs activeTab="text" onTabChange={() => {}} />);
    expect(screen.getByText("텍스트 번역")).toBeInTheDocument();
    expect(screen.getByText("이미지 번역")).toBeInTheDocument();
    expect(screen.getByText("문서 번역")).toBeInTheDocument();
    expect(screen.getByText("서식 번역")).toBeInTheDocument();
  });

  it("should call onTabChange when a tab is clicked", () => {
    const handleChange = vi.fn();
    render(<TranslationTabs activeTab="text" onTabChange={handleChange} />);
    fireEvent.click(screen.getByText("이미지 번역"));
    expect(handleChange).toHaveBeenCalledWith("image");
  });
});
