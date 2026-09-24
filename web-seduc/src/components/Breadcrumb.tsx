"use client";

import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  currentTabName?: string;
}

export default function Breadcrumb({ currentTabName }: BreadcrumbProps) {
  return (
    <nav aria-label="Histórico de navegação" className="py-1">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
        <li className="flex items-center gap-1">
          <a
            href="https://seduc.pa.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800 transition-colors inline-flex items-center gap-1 text-slate-500"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Início</span>
          </a>
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
          <span className="font-medium text-slate-800">
            {currentTabName || "Resultados Educacionais e Índice de Bônus 2025"}
          </span>
        </li>
      </ol>
    </nav>
  );
}
