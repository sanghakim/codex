"use client";

import { useState, useRef } from "react";
import LanguageSelector from "./LanguageSelector";
import SwapButton from "./SwapButton";
import { SUPPORTED_LANGUAGES, TARGET_LANGUAGES } from "@/lib/languages";
import { translateLongText } from "@/lib/translate-client";
import {
  Upload,
  FileText,
  Loader2,
  Copy,
  Download,
  X,
  File,
} from "lucide-react";

const ACCEPTED_TYPES = [
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".rtf",
  ".odt",
  ".pptx",
  ".xlsx",
];

const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".html", ".htm", ".xml", ".json", ".rtf"];

async function extractText(file: File): Promise<string> {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();

  // Text-based files: read directly
  if (TEXT_EXTENSIONS.includes(ext)) {
    const text = await file.text();
    // Strip HTML tags if HTML file
    if (ext === ".html" || ext === ".htm" || ext === ".xml") {
      return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    return text;
  }

  // For binary files (PDF, DOCX, etc.): attempt text read, validate content
  try {
    const raw = await file.text();
    // Check if the content looks like readable text (not binary garbage)
    const sample = raw.slice(0, 500);
    const printableRatio =
      (sample.match(/[\x20-\x7E\uAC00-\uD7AF\u3040-\u30FF\u4E00-\u9FFF\n\r\t]/g)?.length ?? 0) /
      sample.length;

    if (printableRatio > 0.7 && raw.length > 0) {
      return raw;
    }
  } catch {
    // ignore read errors
  }

  return `[${file.name}] 이 파일 형식은 바이너리 파싱이 필요합니다.\n\n현재 지원되는 파일: .txt, .md, .csv, .html, .json\nPDF/DOCX 파일은 별도 파서 라이브러리(pdf-parse, mammoth 등)가 필요합니다.`;
}

export default function DocumentTranslator() {
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("en");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "PDF";
    if (ext === "docx" || ext === "doc") return "DOC";
    if (ext === "txt") return "TXT";
    if (ext === "pptx") return "PPT";
    if (ext === "xlsx") return "XLS";
    return "FILE";
  };

  const handleFileSelect = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      alert(
        `지원하지 않는 파일 형식입니다.\n지원 형식: ${ACCEPTED_TYPES.join(", ")}`
      );
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert("파일 크기는 20MB 이하여야 합니다.");
      return;
    }
    setSelectedFile(file);
    setOriginalText("");
    setTranslatedText("");
    setPageCount(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleTranslate = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      const textContent = await extractText(selectedFile);

      if (!textContent.trim()) {
        setTranslatedText("파일에서 텍스트를 추출할 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setOriginalText(textContent);

      const result = await translateLongText(textContent, sourceLang, targetLang);
      setTranslatedText(result.translatedText);
      setPageCount(Math.max(1, Math.ceil(textContent.length / 2000)));
    } catch (e) {
      console.error("Document translation error:", e);
      setTranslatedText(
        "문서 번역 중 오류가 발생했습니다. 텍스트 기반 파일(.txt, .md, .csv, .html)을 사용해 주세요."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setOriginalText("");
    setTranslatedText("");
    setPageCount(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

      {/* File Upload Area */}
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
            : selectedFile
              ? "border-gray-200 bg-white"
              : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {selectedFile ? (
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <File className="w-6 h-6 text-blue-600 mx-auto" />
                  <span className="text-[10px] font-bold text-blue-600">
                    {getFileIcon(selectedFile.name)}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                  {pageCount > 0 && ` · ${pageCount}페이지`}
                </p>
              </div>
              <button
                onClick={handleClear}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="제거"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-12 text-center cursor-pointer"
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600">
              문서를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, DOCX, DOC, TXT, RTF, ODT, PPTX, XLSX (최대 20MB)
            </p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />
      </div>

      {/* Results */}
      {(originalText || translatedText) && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  원본 문서 내용
                </span>
                <button
                  onClick={() => handleCopy(originalText)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
              <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {originalText}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
                <span className="text-xs text-blue-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  번역된 문서 내용
                </span>
                <button
                  onClick={() => handleCopy(translatedText)}
                  className="p-1 hover:bg-blue-100 rounded transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                </button>
              </div>
              <div className="p-4 text-sm text-gray-900 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {translatedText}
              </div>
            </div>
          </div>

          {/* Download Translated Document */}
          <div className="flex justify-center">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              번역된 문서 다운로드
            </button>
          </div>
        </>
      )}

      {/* Translate Button */}
      <div className="flex justify-center">
        <button
          onClick={handleTranslate}
          disabled={!selectedFile || isLoading}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              문서 번역 중...
            </span>
          ) : (
            "문서 번역하기"
          )}
        </button>
      </div>
    </div>
  );
}
