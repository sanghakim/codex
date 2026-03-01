"use client";

import Link from "next/link";
import { Languages, BarChart3 } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Languages className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">TransLingo</h1>
              <p className="text-xs text-gray-500">다국어 번역 서비스</p>
            </div>
          </div>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
            <span>20+ 언어 지원</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>텍스트 · 이미지 · 문서 · 서식</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              대시보드
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
