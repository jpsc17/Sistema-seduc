"use client";

import { ShieldCheck } from "lucide-react";

interface HeaderGovProps {
  onReset?: () => void;
}

export default function HeaderGov({ onReset }: HeaderGovProps) {
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onReset) {
      onReset();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          {/* Lado Esquerdo: Brasão Oficial e Nome por Extenso com Hierarquia Institucional */}
          <div className="flex items-center gap-3.5 sm:gap-4.5 text-center sm:text-left">
            <button
              type="button"
              onClick={handleLogoClick}
              className="shrink-0 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#A71B2B] rounded-lg transition-transform hover:opacity-95 cursor-pointer"
              title="Voltar ao início do painel"
            >
              <img
                src="/brasao5.png"
                alt="Brasão de Armas do Estado do Pará e SEDUC"
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </button>

            <div className="border-l-0 sm:border-l sm:border-gray-200 sm:pl-4">
              <span className="block text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#6C757D]">
                Governo do Estado do Pará
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1D1D1B] tracking-tight leading-snug">
                Secretaria de Estado de Educação
              </h2>
              <span className="block text-xs text-[#A71B2B] font-semibold mt-0.5">
                SEDUC &bull; Sistema de Gestão e Auditoria de Resultados
              </span>
            </div>
          </div>

          {/* Lado Direito: Badge do Exercício e Acesso ao Painel (Sem Ouvidoria) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3 text-xs">
            {/* Badge Institucional do Exercício */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F6] border border-[#E2E8F0] rounded-md text-[#1D1D1B] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#15803D]" />
              <span>Base Oficial &bull; Exercício 2025</span>
            </div>

            {/* Botão de Retorno / Acesso ao Painel */}
            <button
              type="button"
              onClick={handleLogoClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#A71B2B] text-white hover:bg-[#881220] rounded-md font-semibold transition-colors shadow-xs cursor-pointer"
              title="Voltar ao início do painel e redefinir filtros"
            >
              <span>Início &bull; Painel</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
