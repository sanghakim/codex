"use client";

import { useState, useRef } from "react";
import LanguageSelector from "./LanguageSelector";
import SwapButton from "./SwapButton";
import { SUPPORTED_LANGUAGES, TARGET_LANGUAGES } from "@/lib/languages";
import { Upload, Image as ImageIcon, Loader2, Copy, X } from "lucide-react";

export default function ImageTranslator() {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setExtractedText("");
    setTranslatedText("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleTranslate = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("sourceLang", sourceLang);
      formData.append("targetLang", targetLang);

      const res = await fetch("/api/translate/image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setExtractedText(data.extractedText);
      setTranslatedText(data.translatedText);
    } catch {
      setTranslatedText("이미지 번역 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedText("");
    setTranslatedText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
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

      {/* Image Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl transition-colors ${
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : imagePreview
              ? "border-gray-200 bg-white"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {imagePreview ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {selectedImage?.name}
              </span>
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title="제거"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex justify-center">
              <img
                src={imagePreview}
                alt="업로드된 이미지"
                className="max-h-64 rounded-lg object-contain"
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-12 text-center cursor-pointer"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, GIF, WEBP (최대 10MB)
            </p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
      </div>

      {/* Results */}
      {(extractedText || translatedText) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs text-gray-500">추출된 텍스트 (OCR)</span>
              <button
                onClick={() => handleCopy(extractedText)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {extractedText}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
              <span className="text-xs text-blue-600">번역 결과</span>
              <button
                onClick={() => handleCopy(translatedText)}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </div>
            <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {translatedText}
            </div>
          </div>
        </div>
      )}

      {/* Translate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleTranslate}
          disabled={!selectedImage || isLoading}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              이미지 분석 중...
            </span>
          ) : (
            "이미지 번역하기"
          )}
        </button>
      </div>
    </div>
  );
}
