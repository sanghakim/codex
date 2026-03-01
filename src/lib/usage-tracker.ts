/**
 * Client-side usage tracking using localStorage.
 * Tracks translation events for dashboard analytics.
 */

export interface TranslationEvent {
  id: string;
  type: "text" | "image" | "document" | "format";
  sourceLang: string;
  targetLang: string;
  charCount: number;
  timestamp: number;
  formatType?: string; // for format translations: html, json, xml, csv, markdown
  fileName?: string; // for document/image translations
}

export interface UsageStats {
  totalTranslations: number;
  totalCharacters: number;
  byType: Record<string, number>;
  bySourceLang: Record<string, number>;
  byTargetLang: Record<string, number>;
  byDate: Record<string, number>;
  byHour: Record<number, number>;
  recentEvents: TranslationEvent[];
  topLanguagePairs: { pair: string; count: number }[];
}

const STORAGE_KEY = "translingo_usage";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function trackTranslation(event: Omit<TranslationEvent, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;

  const entry: TranslationEvent = {
    ...event,
    id: generateId(),
    timestamp: Date.now(),
  };

  try {
    const existing = getEvents();
    existing.push(entry);
    // Keep last 1000 events to prevent localStorage overflow
    const trimmed = existing.slice(-1000);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function getEvents(): TranslationEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearEvents(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getUsageStats(): UsageStats {
  const events = getEvents();

  const byType: Record<string, number> = {};
  const bySourceLang: Record<string, number> = {};
  const byTargetLang: Record<string, number> = {};
  const byDate: Record<string, number> = {};
  const byHour: Record<number, number> = {};
  const langPairCounts: Record<string, number> = {};
  let totalCharacters = 0;

  for (const event of events) {
    // By type
    byType[event.type] = (byType[event.type] || 0) + 1;

    // By source language
    bySourceLang[event.sourceLang] = (bySourceLang[event.sourceLang] || 0) + 1;

    // By target language
    byTargetLang[event.targetLang] = (byTargetLang[event.targetLang] || 0) + 1;

    // By date
    const date = new Date(event.timestamp).toISOString().split("T")[0];
    byDate[date] = (byDate[date] || 0) + 1;

    // By hour
    const hour = new Date(event.timestamp).getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;

    // Language pairs
    const pair = `${event.sourceLang} → ${event.targetLang}`;
    langPairCounts[pair] = (langPairCounts[pair] || 0) + 1;

    totalCharacters += event.charCount;
  }

  const topLanguagePairs = Object.entries(langPairCounts)
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalTranslations: events.length,
    totalCharacters,
    byType,
    bySourceLang,
    byTargetLang,
    byDate,
    byHour,
    recentEvents: events.slice(-20).reverse(),
    topLanguagePairs,
  };
}
