/**
 * Client-side translation using Google Translate free API.
 * Runs in the user's browser — no API key or server proxy needed.
 */

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ translatedText: string; detectedLanguage: string }> {
  const sl = sourceLang === "auto" ? "auto" : sourceLang;
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(targetLang)}` +
    `&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation API error: ${res.status}`);

  const data = await res.json();

  const sentences: string[] = [];
  if (Array.isArray(data[0])) {
    for (const seg of data[0]) {
      if (seg[0]) sentences.push(seg[0]);
    }
  }

  return {
    translatedText: sentences.join(""),
    detectedLanguage: data[2] || sourceLang,
  };
}

/** Translate a long text by splitting into chunks */
export async function translateLongText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<{ translatedText: string; detectedLanguage: string }> {
  const chunks = splitIntoChunks(text, 4500);
  const results: string[] = [];
  let detectedLanguage = sourceLang;

  for (const chunk of chunks) {
    const res = await translateText(chunk, sourceLang, targetLang);
    results.push(res.translatedText);
    if (detectedLanguage === "auto") detectedLanguage = res.detectedLanguage;
  }

  return { translatedText: results.join(""), detectedLanguage };
}

function splitIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf("\n", maxLen);
    if (splitAt < maxLen / 2) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt);
  }
  return chunks;
}

/** Translate HTML/XML — preserves tags, translates text nodes */
export async function translateMarkup(
  content: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const textNodes: string[] = [];
  const pattern = />([^<]+)</g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    if (match[1].trim()) textNodes.push(match[1].trim());
  }
  if (textNodes.length === 0) return content;

  const combined = textNodes.join("\n---SPLIT---\n");
  const { translatedText } = await translateText(combined, sourceLang, targetLang);
  const translated = translatedText.split(/\n?---SPLIT---\n?/);

  let i = 0;
  return content.replace(/>([^<]+)</g, (full, text: string) => {
    if (!text.trim()) return full;
    const r = translated[i++] ?? text.trim();
    return `>${r}<`;
  });
}

/** Translate JSON — preserves keys, translates string values */
export async function translateJson(
  content: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  try {
    const obj = JSON.parse(content);
    const strings: string[] = [];
    const collect = (v: unknown): void => {
      if (typeof v === "string") strings.push(v);
      else if (Array.isArray(v)) v.forEach(collect);
      else if (v && typeof v === "object") Object.values(v).forEach(collect);
    };
    collect(obj);
    if (strings.length === 0) return content;

    const combined = strings.join("\n---SPLIT---\n");
    const { translatedText } = await translateText(combined, sourceLang, targetLang);
    const translated = translatedText.split(/\n?---SPLIT---\n?/);

    let i = 0;
    const replace = (v: unknown): unknown => {
      if (typeof v === "string") return translated[i++] ?? v;
      if (Array.isArray(v)) return v.map(replace);
      if (v && typeof v === "object") {
        const o: Record<string, unknown> = {};
        for (const [k, val] of Object.entries(v)) o[k] = replace(val);
        return o;
      }
      return v;
    };
    return JSON.stringify(replace(obj), null, 2);
  } catch {
    const { translatedText } = await translateText(content, sourceLang, targetLang);
    return translatedText;
  }
}

/** Translate CSV — preserves header, translates data rows */
export async function translateCsv(
  content: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const rows = content.split("\n");
  if (rows.length <= 1) {
    const { translatedText } = await translateText(content, sourceLang, targetLang);
    return translatedText;
  }

  const header = rows[0];
  const dataRows = rows.slice(1).filter((r) => r.trim());
  const cells = dataRows.flatMap((r) => r.split(",").map((c) => c.trim()));

  const combined = cells.join("\n---SPLIT---\n");
  const { translatedText } = await translateText(combined, sourceLang, targetLang);
  const translated = translatedText.split(/\n?---SPLIT---\n?/);

  let idx = 0;
  const translatedRows = dataRows.map((row) =>
    row.split(",").map(() => translated[idx++] ?? "").join(",")
  );

  return [header, ...translatedRows].join("\n");
}
