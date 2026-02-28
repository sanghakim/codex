const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    ko: "[한국어 번역] ",
    ja: "[日本語翻訳] ",
    zh: "[中文翻译] ",
    "zh-TW": "[中文翻譯] ",
    es: "[Traducción al español] ",
    fr: "[Traduction française] ",
    de: "[Deutsche Übersetzung] ",
    pt: "[Tradução em português] ",
    ru: "[Русский перевод] ",
    ar: "[الترجمة العربية] ",
    hi: "[हिंदी अनुवाद] ",
    th: "[แปลภาษาไทย] ",
    vi: "[Bản dịch tiếng Việt] ",
    id: "[Terjemahan Indonesia] ",
    it: "[Traduzione italiana] ",
    nl: "[Nederlandse vertaling] ",
    pl: "[Polskie tłumaczenie] ",
    tr: "[Türkçe çeviri] ",
    sv: "[Svensk översättning] ",
  },
  ko: {
    en: "[English Translation] ",
    ja: "[日本語翻訳] ",
    zh: "[中文翻译] ",
  },
};

function detectLanguage(text: string): string {
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  return "en";
}

export async function mockTranslateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ translatedText: string; detectedLanguage: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  const detected = sourceLang === "auto" ? detectLanguage(text) : sourceLang;

  if (detected === targetLang) {
    return { translatedText: text, detectedLanguage: detected };
  }

  const prefix =
    MOCK_TRANSLATIONS[detected]?.[targetLang] ??
    `[${targetLang.toUpperCase()} Translation] `;

  return {
    translatedText: prefix + text,
    detectedLanguage: detected,
  };
}

export async function mockTranslateImage(
  sourceLang: string,
  targetLang: string
): Promise<{ extractedText: string; translatedText: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  const extractedText =
    "이미지에서 추출된 텍스트입니다.\n여러 줄의 텍스트가 포함되어 있습니다.\n번역 서비스 데모용 샘플입니다.";

  const { translatedText } = await mockTranslateText(
    extractedText,
    sourceLang === "auto" ? "ko" : sourceLang,
    targetLang
  );

  return { extractedText, translatedText };
}

export async function mockTranslateDocument(
  fileName: string,
  sourceLang: string,
  targetLang: string
): Promise<{
  originalText: string;
  translatedText: string;
  pageCount: number;
}> {
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1500));

  const originalText = `[${fileName}] 문서 내용:\n\n제1장: 소개\n이 문서는 다국어 번역 서비스의 데모를 위한 샘플 문서입니다.\n\n제2장: 주요 기능\n텍스트, 이미지, 문서, 서식 번역을 지원합니다.\n\n제3장: 결론\n다양한 언어 간의 원활한 번역이 가능합니다.`;

  const { translatedText } = await mockTranslateText(
    originalText,
    sourceLang === "auto" ? "ko" : sourceLang,
    targetLang
  );

  return {
    originalText,
    translatedText,
    pageCount: 3,
  };
}

export async function mockTranslateFormat(
  content: string,
  format: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

  const detected = sourceLang === "auto" ? detectLanguage(content) : sourceLang;

  if (detected === targetLang) return content;

  const prefix =
    MOCK_TRANSLATIONS[detected]?.[targetLang] ??
    `[${targetLang.toUpperCase()}] `;

  switch (format) {
    case "html": {
      return content.replace(
        />([^<]+)</g,
        (_, text: string) => `>${prefix}${text.trim()}<`
      );
    }
    case "json": {
      try {
        const obj = JSON.parse(content);
        const translate = (val: unknown): unknown => {
          if (typeof val === "string") return prefix + val;
          if (Array.isArray(val)) return val.map(translate);
          if (val && typeof val === "object") {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(val)) {
              out[k] = translate(v);
            }
            return out;
          }
          return val;
        };
        return JSON.stringify(translate(obj), null, 2);
      } catch {
        return prefix + content;
      }
    }
    case "xml": {
      return content.replace(
        />([^<]+)</g,
        (_, text: string) => `>${prefix}${text.trim()}<`
      );
    }
    case "csv": {
      return content
        .split("\n")
        .map((row, i) => {
          if (i === 0) return row;
          return row
            .split(",")
            .map((cell) => prefix + cell.trim())
            .join(",");
        })
        .join("\n");
    }
    case "markdown": {
      return content
        .split("\n")
        .map((line) => {
          if (line.startsWith("#")) {
            const match = line.match(/^(#+\s*)(.*)/);
            return match ? `${match[1]}${prefix}${match[2]}` : line;
          }
          if (line.trim() === "") return line;
          return prefix + line;
        })
        .join("\n");
    }
    default:
      return prefix + content;
  }
}
