"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Languages,
  BarChart3,
  TrendingUp,
  Clock,
  Type,
  Image,
  FileText,
  Code,
  ArrowLeft,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { getUsageStats, clearEvents, type UsageStats, type TranslationEvent } from "@/lib/usage-tracker";
import { getLanguageName } from "@/lib/languages";

const TYPE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  text: { label: "텍스트", icon: Type, color: "bg-blue-500" },
  image: { label: "이미지", icon: Image, color: "bg-green-500" },
  document: { label: "문서", icon: FileText, color: "bg-purple-500" },
  format: { label: "서식", icon: Code, color: "bg-orange-500" },
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function BarChartSimple({
  data,
  labelFormatter,
  maxBars,
}: {
  data: Record<string, number>;
  labelFormatter?: (key: string) => string;
  maxBars?: number;
}) {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxBars || 10);

  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">데이터가 없습니다</p>;
  }

  const max = Math.max(...entries.map(([, v]) => v));

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-24 truncate text-right">
            {labelFormatter ? labelFormatter(key) : key}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
              style={{ width: `${Math.max(8, (value / max) * 100)}%` }}
            >
              <span className="text-[10px] text-white font-medium">{value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HourlyChart({ data }: { data: Record<number, number> }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const max = Math.max(...hours.map((h) => data[h] || 0), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {hours.map((hour) => {
        const value = data[hour] || 0;
        const height = max > 0 ? (value / max) * 100 : 0;
        return (
          <div key={hour} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
              <div
                className="w-full bg-blue-400 rounded-t-sm transition-all duration-500 hover:bg-blue-600"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${hour}시: ${value}건`}
              />
            </div>
            {hour % 3 === 0 && (
              <span className="text-[9px] text-gray-400">{hour}시</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecentList({ events }: { events: TranslationEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">번역 기록이 없습니다</p>;
  }

  return (
    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
      {events.map((event) => {
        const typeInfo = TYPE_LABELS[event.type] || TYPE_LABELS.text;
        const Icon = typeInfo.icon;
        return (
          <div key={event.id} className="flex items-center gap-3 py-3 px-1">
            <div className={`p-1.5 rounded-md ${typeInfo.color}`}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">
                  {getLanguageName(event.sourceLang)} → {getLanguageName(event.targetLang)}
                </span>
                {event.fileName && (
                  <span className="text-[10px] text-gray-400 truncate max-w-32">
                    {event.fileName}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400">
                {event.charCount.toLocaleString()}자 · {typeInfo.label}
                {event.formatType ? ` (${event.formatType.toUpperCase()})` : ""}
              </p>
            </div>
            <span className="text-[10px] text-gray-400 whitespace-nowrap">
              {formatRelativeTime(event.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "방금 전";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(timestamp).toLocaleDateString("ko-KR");
}

function TypeDistribution({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((s, v) => s + v, 0) || 1;
  const types = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-3">
      <div className="flex rounded-full h-4 overflow-hidden bg-gray-100">
        {types.map(([type, count]) => {
          const info = TYPE_LABELS[type] || TYPE_LABELS.text;
          return (
            <div
              key={type}
              className={`${info.color} transition-all duration-500`}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${info.label}: ${count}건 (${Math.round((count / total) * 100)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4">
        {types.map(([type, count]) => {
          const info = TYPE_LABELS[type] || TYPE_LABELS.text;
          const Icon = info.icon;
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${info.color}`} />
              <Icon className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-600">
                {info.label}: {count}건 ({Math.round((count / total) * 100)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyChart({ data }: { data: Record<string, number> }) {
  const sortedDates = Object.keys(data).sort();
  const last14 = sortedDates.slice(-14);

  if (last14.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">데이터가 없습니다</p>;
  }

  const max = Math.max(...last14.map((d) => data[d] || 0), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {last14.map((date) => {
        const value = data[date] || 0;
        const height = (value / max) * 100;
        const label = date.slice(5); // MM-DD
        return (
          <div key={date} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-gray-500 font-medium">{value}</span>
            <div className="w-full flex flex-col justify-end" style={{ height: "80px" }}>
              <div
                className="w-full bg-blue-400 rounded-t-sm transition-all duration-500 hover:bg-blue-600"
                style={{ height: `${Math.max(height, 3)}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<UsageStats | null>(null);

  const refreshStats = useCallback(() => {
    setStats(getUsageStats());
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleClear = () => {
    if (window.confirm("모든 사용 기록을 삭제하시겠습니까?")) {
      clearEvents();
      refreshStats();
    }
  };

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="홈으로"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="bg-blue-600 p-2 rounded-lg">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">사용량 대시보드</h1>
                <p className="text-xs text-gray-500">TransLingo 번역 분석</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshStats}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="새로고침"
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={handleClear}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="기록 삭제"
              >
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="총 번역 횟수"
            value={stats.totalTranslations.toLocaleString()}
            icon={BarChart3}
            color="bg-blue-500"
          />
          <StatCard
            label="총 번역 글자수"
            value={stats.totalCharacters.toLocaleString()}
            icon={Type}
            color="bg-green-500"
          />
          <StatCard
            label="사용 언어 수"
            value={new Set([...Object.keys(stats.bySourceLang), ...Object.keys(stats.byTargetLang)]).size}
            icon={Languages}
            color="bg-purple-500"
          />
          <StatCard
            label="오늘 번역"
            value={stats.byDate[new Date().toISOString().split("T")[0]] || 0}
            icon={TrendingUp}
            color="bg-orange-500"
          />
        </div>

        {/* Type Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            번역 유형 분포
          </h2>
          <TypeDistribution data={stats.byType} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              일별 번역 추이 (최근 14일)
            </h2>
            <DailyChart data={stats.byDate} />
          </div>

          {/* Hourly Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              시간대별 사용 패턴
            </h2>
            <HourlyChart data={stats.byHour} />
          </div>
        </div>

        {/* Language Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top Language Pairs */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">인기 언어 조합</h2>
            {stats.topLanguagePairs.length > 0 ? (
              <div className="space-y-2">
                {stats.topLanguagePairs.slice(0, 8).map((item, i) => (
                  <div key={item.pair} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="text-xs text-gray-700 flex-1">{item.pair}</span>
                    <span className="text-xs font-medium text-blue-600">{item.count}건</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">데이터가 없습니다</p>
            )}
          </div>

          {/* Source Languages */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">원본 언어 사용 빈도</h2>
            <BarChartSimple
              data={stats.bySourceLang}
              labelFormatter={getLanguageName}
              maxBars={8}
            />
          </div>

          {/* Target Languages */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">번역 언어 사용 빈도</h2>
            <BarChartSimple
              data={stats.byTargetLang}
              labelFormatter={getLanguageName}
              maxBars={8}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            최근 번역 기록
          </h2>
          <RecentList events={stats.recentEvents} />
        </div>
      </main>
    </div>
  );
}
