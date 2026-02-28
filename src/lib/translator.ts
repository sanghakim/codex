/**
 * Real translation using Google Translate free API.
 * No API key required.
 */

async function googleTranslate(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ translatedText: string; detectedLanguage: string }> {
  const sl = sourceLang === "auto" ? "auto" : sourceLang;
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Translate API error: ${res.status}`);
  }

  const data = await res.json();

  // Response format: [[["translated","original",null,null,10]],null,"detected_lang"]
  const sentences: string[] = [];
  if (Array.isArray(data[0])) {
    for (const seg of data[0]) {
      if (seg[0]) sentences.push(seg[0]);
    }
  }

  const translatedText = sentences.join("");
  const detectedLanguage = data[2] || sourceLang;

  return { translatedText, detectedLanguage };
}

// --- Public API ---

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ translatedText: string; detectedLanguage: string }> {
  return googleTranslate(text, sourceLang, targetLang);
}

export async function translateImageText(
  extractedText: string,
  sourceLang: string,
  targetLang: string
): Promise<{ extractedText: string; translatedText: string }> {
  const { translatedText } = await googleTranslate(
    extractedText,
    sourceLang,
    targetLang
  );
  return { extractedText, translatedText };
}

export async function translateDocument(
  originalText: string,
  fileName: string,
  sourceLang: string,
  targetLang: string
): Promise<{
  originalText: string;
  translatedText: string;
  pageCount: number;
}> {
  // Translate in chunks to handle large documents
  const chunks = splitIntoChunks(originalText, 4000);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    const { translatedText } = await googleTranslate(
      chunk,
      sourceLang,
      targetLang
    );
    translatedChunks.push(translatedText);
  }

  const translatedText = translatedChunks.join("");
  const pageCount = Math.max(1, Math.ceil(originalText.length / 2000));

  return { originalText, translatedText, pageCount };
}

export async function translateFormat(
  content: string,
  format: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  switch (format) {
    case "html":
    case "xml":
      return translateMarkup(content, sourceLang, targetLang);
    case "json":
      return translateJson(content, sourceLang, targetLang);
    case "csv":
      return translateCsv(content, sourceLang, targetLang);
    case "markdown":
      return translateMarkdown(content, sourceLang, targetLang);
    default: {
      const { translatedText } = await googleTranslate(
        content,
        sourceLang,
        targetLang
      );
      return translatedText;
    }
  }
}

// --- Helpers ---

function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    // Try to split at newline
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  return chunks;
}

async function translateMarkup(
  content: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // Extract text nodes between tags
  const textNodes: string[] = [];
  const pattern = />([^<]+)</g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    const txt = match[1].trim();
    if (txt) textNodes.push(txt);
  }

  if (textNodes.length === 0) return content;

  // Translate all text nodes at once for efficiency
  const combined = textNodes.join("\n---SPLIT---\n");
  const { translatedText } = await googleTranslate(
    combined,
    sourceLang,
    targetLang
  );
  const translated = translatedText.split(/\n?---SPLIT---\n?/);

  let i = 0;
  return content.replace(/>([^<]+)</g, (full, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return full;
    const replacement = translated[i] ?? trimmed;
    i++;
    return `>${replacement}<`;
  });
}

async function translateJson(
  content: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
    const obj = JSON.parse(content);

    // Collect all string values
    const strings: string[] = [];
    const collectStrings = (val: unknown): void => {
      if (typeof val === "string") {
        strings.push(val);
      } else if (Array.isArray(val)) {
        val.forEach(collectStrings);
      } else if (val && typeof val === "object") {
        Object.values(val).forEach(collectStrings);
      }
    };
    collectStrings(obj);

    if (strings.length === 0) return content;

    // Translate all strings at once
    const combined = strings.join("\n---SPLIT---\n");
    const { translatedText } = await googleTranslate(
      combined,
      sourceLang,
      targetLang
    );
    const translated = translatedText.split(/\n?---SPLIT---\n?/);

    let i = 0;
    const replaceStrings = (val: unknown): unknown => {
      if (typeof val === "string") {
        return translated[i++] ?? val;
      }
      if (Array.isArray(val)) return val.map(replaceStrings);
      if (val && typeof val === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val)) {
          out[k] = replaceStrings(v);
        }
        return out;
      }
      return val;
    };

    return JSON.stringify(replaceStrings(obj), null, 2);
  } catch {
    const { translatedText } = await googleTranslate(
      content,
      sourceLang,
      targetLang
    );
    return translatedText;
  }
}

async function translateCsv(
  content: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const rows = content.split("\n");
  if (rows.length <= 1) {
    const { translatedText } = await googleTranslate(
      content,
      sourceLang,
      targetLang
    );
    return translatedText;
  }

  // Keep header, translate data rows
  const header = rows[0];
  const dataRows = rows.slice(1).filter((r) => r.trim());

  const cells: string[] = [];
  for (const row of dataRows) {
    cells.push(...row.split(",").map((c) => c.trim()));
  }

  const combined = cells.join("\n---SPLIT---\n");
  const { translatedText } = await googleTranslate(
    combined,
    sourceLang,
    targetLang
  );
  const translated = translatedText.split(/\n?---SPLIT---\n?/);

  let i = 0;
  const translatedRows = dataRows.map((row) =>
    row
      .split(",")
      .map(() => translated[i++] ?? "")
      .join(",")
  );

  return [header, ...translatedRows].join("\n");
}

async function translateMarkdown(
  content: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // Translate the whole markdown content preserving structure
  // Google Translate generally handles markdown syntax well
  const { translatedText } = await googleTranslate(
    content,
    sourceLang,
    targetLang
  );
  return translatedText;
}
