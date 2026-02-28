export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export interface TextTranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

export interface TextTranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

export interface ImageTranslationRequest {
  image: File;
  sourceLang: string;
  targetLang: string;
}

export interface ImageTranslationResponse {
  extractedText: string;
  translatedText: string;
  overlayImageUrl?: string;
}

export interface DocumentTranslationRequest {
  document: File;
  sourceLang: string;
  targetLang: string;
}

export interface DocumentTranslationResponse {
  translatedDocumentUrl: string;
  pageCount: number;
  originalText: string;
  translatedText: string;
}

export interface FormatTranslationRequest {
  content: string;
  format: "html" | "markdown" | "json" | "xml" | "csv";
  sourceLang: string;
  targetLang: string;
}

export interface FormatTranslationResponse {
  translatedContent: string;
  format: string;
}

export type TranslationTab = "text" | "image" | "document" | "format";
