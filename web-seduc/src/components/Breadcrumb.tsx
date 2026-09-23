"use client";

import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  currentTabName?: string;
}

export default function Breadcrumb({ currentTabName }: BreadcrumbProps) {
  return (
    <nav aria-label="Histórico de navegação (Breadcrumb)" className="py-2.5">
      <ol className="flex items-center flex-wrap gap-1.5 text-xs text-[#6C757D]">
        <li className="flex items-center gap-1">
          <a
            href="https://seduc.pa.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#A71B2B] transition-colors inline-flex items-center gap-1 text-[#6C757D]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Início</span>
          </a>
        </li>
        <li className="flex items-center">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </li>
        <li>
          <span className="text-[#6C757D]">Painéis de Gestão e Dados</span>
        </li>
        <li className="flex items-center">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </li>
        <li aria-current="location">
          <span className="font-semibold text-[#1D1D1B]">
            {currentTabName || "Resultados Educacionais e Índice de Bônus 2025"}
          </span>
        </li>
      </ol>
    </nav>
  );
}
