"use client";

import Image from "next/image";
import { ShieldCheck, PhoneCall, ExternalLink, HelpCircle } from "lucide-react";

export default function HeaderGov() {
  return (
    <header className="bg-white border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          {/* Lado Esquerdo: Brasão Oficial e Nome por Extenso com Hierarquia Institucional */}
          <div className="flex items-center gap-3.5 sm:gap-4.5 text-center sm:text-left">
            <a
              href="https://seduc.pa.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#A71B2B] rounded-lg transition-transform hover:opacity-95"
              title="Portal da SEDUC Pará"
            >
              <img
                src="/brasao5.png"
                alt="Brasão de Armas do Estado do Pará e SEDUC"
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </a>

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

          {/* Lado Direito: Ações utilitárias oficiais (Transparência, Ouvidoria, Exercício) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 sm:gap-3 text-xs">
            {/* Badge Institucional do Exercício */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F6F6F6] border border-[#E2E8F0] rounded-md text-[#1D1D1B] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#15803D]" />
              <span>Base Oficial &bull; Exercício 2025</span>
            </div>

            {/* Canal de Atendimento / Ouvidoria */}
            <a
              href="https://seduc.pa.gov.br/ouvidoria"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#1D1D1B] hover:text-[#A71B2B] hover:bg-[#FDF2F4] border border-[#E2E8F0] rounded-md transition-colors font-medium"
              title="Acessar Canal de Ouvidoria da Educação"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#A71B2B]" />
              <span className="hidden md:inline">Ouvidoria SEDUC</span>
              <span className="md:hidden">Ouvidoria</span>
            </a>

            {/* Guia / Legislação do Bônus */}
            <a
              href="#conteudo-principal"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#A71B2B] text-white hover:bg-[#881220] rounded-md font-semibold transition-colors shadow-xs"
              title="Ir para os dados e índices"
            >
              <span>Acessar Painel</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
