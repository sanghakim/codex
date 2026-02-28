"use client";

import { useState } from "react";
import LanguageSelector from "./LanguageSelector";
import SwapButton from "./SwapButton";
import { SUPPORTED_LANGUAGES, TARGET_LANGUAGES } from "@/lib/languages";
import {
  translateText,
  translateMarkup,
  translateJson,
  translateCsv,
} from "@/lib/translate-client";
import { Loader2, Copy, Code, FileCode } from "lucide-react";

type FormatType = "html" | "markdown" | "json" | "xml" | "csv";

const FORMAT_OPTIONS: { id: FormatType; label: string; placeholder: string }[] = [
  {
    id: "html",
    label: "HTML",
    placeholder: `<div class="content">
  <h1>제목</h1>
  <p>번역할 본문 내용입니다.</p>
  <ul>
    <li>항목 1</li>
    <li>항목 2</li>
  </ul>
</div>`,
  },
  {
    id: "markdown",
    label: "Markdown",
    placeholder: `# 제목

번역할 본문 내용입니다.

## 부제목

- 항목 1
- 항목 2`,
  },
  {
    id: "json",
    label: "JSON",
    placeholder: `{
  "title": "제목",
  "description": "설명 텍스트",
  "items": ["항목 1", "항목 2"]
}`,
  },
  {
    id: "xml",
    label: "XML",
    placeholder: `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <title>제목</title>
  <content>번역할 내용</content>
</document>`,
  },
  {
    id: "csv",
    label: "CSV",
    placeholder: `이름,설명,카테고리
제품A,첫 번째 제품입니다,전자기기
제품B,두 번째 제품입니다,의류`,
  },
];

export default function FormatTranslator() {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [format, setFormat] = useState<FormatType>("html");
  const [sourceContent, setSourceContent] = useState("");
  const [translatedContent, setTranslatedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentFormat = FORMAT_OPTIONS.find((f) => f.id === format)!;

  const handleTranslate = async () => {
    if (!sourceContent.trim()) return;

    setIsLoading(true);
    try {
      let result: string;
      switch (format) {
        case "html":
        case "xml":
          result = await translateMarkup(sourceContent, sourceLang, targetLang);
          break;
        case "json":
          result = await translateJson(sourceContent, sourceLang, targetLang);
          break;
        case "csv":
          result = await translateCsv(sourceContent, sourceLang, targetLang);
          break;
        case "markdown":
        default: {
          const res = await translateText(sourceContent, sourceLang, targetLang);
          result = res.translatedText;
          break;
        }
      }
      setTranslatedContent(result);
    } catch {
      setTranslatedContent("서식 번역 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceContent(translatedContent);
    setTranslatedContent(sourceContent);
  };

  return (
    <div className="space-y-4">
      {/* Language Selection */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <LanguageSelector
            languages={SUPPORTED_LANGUAGES}
            selectedCode={sourceLang}
            onSelect={setSourceLang}
            label="원본 언어"
          />
        </div>
        <SwapButton onSwap={handleSwap} disabled={sourceLang === "auto"} />
        <div className="flex-1">
          <LanguageSelector
            languages={TARGET_LANGUAGES}
            selectedCode={targetLang}
            onSelect={setTargetLang}
            label="번역 언어"
          />
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          서식 형식
        </label>
        <div className="flex gap-2">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setFormat(opt.id);
                setSourceContent("");
                setTranslatedContent("");
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                format === opt.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              원본 ({currentFormat.label})
            </span>
          </div>
          <textarea
            value={sourceContent}
            onChange={(e) => setSourceContent(e.target.value)}
            placeholder={currentFormat.placeholder}
            className="w-full h-64 px-4 py-3 text-sm text-gray-900 font-mono resize-none focus:outline-none placeholder:text-gray-400"
          />
        </div>

        {/* Target */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
            <span className="text-xs text-blue-600 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" />
              번역 결과 ({currentFormat.label})
            </span>
            {translatedContent && (
              <button
                onClick={() => handleCopy(translatedContent)}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
              </button>
            )}
          </div>
          <div className="w-full h-64 px-4 py-3 text-sm text-gray-900 font-mono overflow-auto whitespace-pre-wrap">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">서식 번역 중...</p>
                </div>
              </div>
            ) : translatedContent ? (
              translatedContent
            ) : (
              <span className="text-gray-400">
                번역된 서식이 여기에 표시됩니다
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-700">
          <strong>서식 보존 번역:</strong> 원본의 {currentFormat.label} 구조와
          태그/키를 유지하면서 텍스트 콘텐츠만 번역합니다. 코드, 태그, 키 이름은
          변경되지 않습니다.
        </p>
      </div>

      {/* Translate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleTranslate}
          disabled={!sourceContent.trim() || isLoading}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              서식 번역 중...
            </span>
          ) : (
            "서식 번역하기"
          )}
        </button>
      </div>
    </div>
  );
}
