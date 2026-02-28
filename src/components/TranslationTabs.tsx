"use client";

import { TranslationTab } from "@/types/translation";
import { Type, Image, FileText, Code } from "lucide-react";

interface TranslationTabsProps {
  activeTab: TranslationTab;
  onTabChange: (tab: TranslationTab) => void;
}

const TABS: { id: TranslationTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: "text", label: "텍스트 번역", icon: Type, description: "구문, 문장, 문단" },
  { id: "image", label: "이미지 번역", icon: Image, description: "이미지 속 텍스트" },
  { id: "document", label: "문서 번역", icon: FileText, description: "PDF, DOCX, TXT" },
  { id: "format", label: "서식 번역", icon: Code, description: "HTML, JSON, XML" },
];

export default function TranslationTabs({
  activeTab,
  onTabChange,
}: TranslationTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
          </button>
        );
      })}
    </div>
  );
}
