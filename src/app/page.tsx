"use client";

import { useState } from "react";
import Header from "@/components/Header";
import TranslationTabs from "@/components/TranslationTabs";
import TextTranslator from "@/components/TextTranslator";
import ImageTranslator from "@/components/ImageTranslator";
import DocumentTranslator from "@/components/DocumentTranslator";
import FormatTranslator from "@/components/FormatTranslator";
import { TranslationTab } from "@/types/translation";
import { Globe, Zap, Shield, Clock } from "lucide-react";

const FEATURES = [
  {
    icon: Globe,
    title: "20+ 언어 지원",
    description: "한국어, 영어, 일본어, 중국어 등 주요 언어를 모두 지원합니다",
  },
  {
    icon: Zap,
    title: "빠른 번역",
    description: "최적화된 번역 엔진으로 빠르고 정확한 번역을 제공합니다",
  },
  {
    icon: Shield,
    title: "서식 보존",
    description: "HTML, JSON, XML 등 원본 서식을 유지하면서 번역합니다",
  },
  {
    icon: Clock,
    title: "실시간 처리",
    description: "이미지와 문서도 실시간으로 분석하고 번역합니다",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TranslationTab>("text");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-blue-50 to-transparent pt-8 pb-4">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              모든 콘텐츠를 자유롭게 번역하세요
            </h2>
            <p className="text-gray-600 text-sm">
              텍스트, 이미지, 문서, 서식 — 어떤 형태의 콘텐츠든 20개 이상의
              언어로 번역할 수 있습니다
            </p>
          </div>
        </div>

        {/* Translation Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <TranslationTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div>
              {activeTab === "text" && <TextTranslator />}
              {activeTab === "image" && <ImageTranslator />}
              {activeTab === "document" && <DocumentTranslator />}
              {activeTab === "format" && <FormatTranslator />}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="text-center p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-3">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>TransLingo - 다국어 번역 서비스</span>
            <span>Powered by Next.js & React</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
