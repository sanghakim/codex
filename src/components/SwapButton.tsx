"use client";

import { ArrowLeftRight } from "lucide-react";

interface SwapButtonProps {
  onSwap: () => void;
  disabled?: boolean;
}

export default function SwapButton({ onSwap, disabled }: SwapButtonProps) {
  return (
    <button
      onClick={onSwap}
      disabled={disabled}
      className="flex items-center justify-center w-10 h-10 bg-white border border-gray-300 rounded-full hover:bg-gray-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all self-end mb-0.5"
      title="언어 교체"
    >
      <ArrowLeftRight className="w-4 h-4 text-gray-600" />
    </button>
  );
}
