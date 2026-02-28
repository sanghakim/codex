"use client";

import { useState, useCallback } from "react";
import LanguageSelector from "./LanguageSelector";
import SwapButton from "./SwapButton";
import { SUPPORTED_LANGUAGES, TARGET_LANGUAGES } from "@/lib/languages";
import { translateText } from "@/lib/translate-client";
import { Copy, Volume2, Loader2, X } from "lucide-react";

export default function TextTranslator() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const MAX_CHARS = 5000;

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) return;

    setIsLoading(true);
    try {
      const result = await translateText(sourceText, sourceLang, targetLang);
      setTranslatedText(result.translatedText);
      if (result.detectedLanguage) {
        setDetectedLang(result.detectedLanguage);
      }
    } catch {
      setTranslatedText("번역 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  }, [sourceText, sourceLang, targetLang]);

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleClear = () => {
    setSourceText("");
    setTranslatedText("");
    setDetectedLang(null);
    setCharCount(0);
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

      {/* Translation Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source */}
        <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs text-gray-500">
              원본 텍스트
              {detectedLang && sourceLang === "auto" && (
                <span className="ml-2 text-blue-600">
                  (감지: {detectedLang})
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs ${charCount > MAX_CHARS ? "text-red-500" : "text-gray-400"}`}
              >
                {charCount}/{MAX_CHARS}
              </span>
              {sourceText && (
                <button
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="지우기"
                >
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => {
              setSourceText(e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder="번역할 텍스트를 입력하세요...&#10;&#10;구문, 문장, 문단 단위로 번역할 수 있습니다."
            className="w-full h-56 px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none placeholder:text-gray-400"
            maxLength={MAX_CHARS}
          />
          <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100">
            <button
              onClick={() => handleCopy(sourceText)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="복사"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="듣기"
            >
              <Volume2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Target */}
        <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
            <span className="text-xs text-blue-600">번역 결과</span>
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
            )}
          </div>
          <div className="w-full h-56 px-4 py-3 text-sm text-gray-900 overflow-y-auto whitespace-pre-wrap">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">번역 중...</p>
                </div>
              </div>
            ) : translatedText ? (
              translatedText
            ) : (
              <span className="text-gray-400">번역 결과가 여기에 표시됩니다</span>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100">
            <button
              onClick={() => handleCopy(translatedText)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="복사"
              disabled={!translatedText}
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
              title="듣기"
              disabled={!translatedText}
            >
              <Volume2 className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Translate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleTranslate}
          disabled={!sourceText.trim() || isLoading || charCount > MAX_CHARS}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              번역 중...
            </span>
          ) : (
            "번역하기"
          )}
        </button>
      </div>
    </div>
  );
}
