"use client";

import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  currentTabName?: string;
  onReset?: () => void;
}

export default function Breadcrumb({ currentTabName, onReset }: BreadcrumbProps) {
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onReset) {
      onReset();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <nav aria-label="Histórico de navegação" className="py-1">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
        <li className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleHomeClick}
            className="hover:text-slate-900 transition-colors inline-flex items-center gap-1 text-slate-600 font-medium cursor-pointer"
            title="Voltar ao início do painel"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Início</span>
          </button>
        </li>
        <li className="flex items-center">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        </li>
        <li>
          <span className="text-slate-500">Painéis de Gestão</span>
        </li>
        <li className="flex items-center">
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        </li>
        <li aria-current="location">
          <span className="font-semibold text-slate-800">
            {currentTabName || "Resultados Educacionais e Índice de Bônus 2025"}
          </span>
        </li>
      </ol>
    </nav>
  );
}
