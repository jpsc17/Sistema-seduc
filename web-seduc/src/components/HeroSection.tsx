"use client";

import { Award, Calendar, FileCheck, Layers, BookMarked } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="bg-white border-b border-[#E2E8F0] pt-6 pb-7 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            {/* Tag e Selo Institucional */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F6F6F6] border border-[#E2E8F0] rounded-full text-xs font-semibold text-[#1D1D1B]">
              <span className="w-2 h-2 rounded-full bg-[#A71B2B]" />
              <span className="text-[#A71B2B] font-bold">SEDUC-PA</span>
              <span className="text-gray-400">|</span>
              <span>Portal de Transparência e Eficiência Pedagógica</span>
            </div>

            {/* Título Principal H1 com destaque sóbrio */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1D1D1B] tracking-tight leading-tight">
              Resultados Educacionais e Índice de Bônus{" "}
              <span className="text-[#A71B2B] block sm:inline">
                das DREs e Escolas Estaduais
              </span>
            </h1>

            {/* Descrição em conformidade com o padrão institucional .gov */}
            <p className="text-sm sm:text-base text-[#6C757D] leading-relaxed">
              Consulta pública e auditoria dos indicadores de desempenho escolar, metas do IDEB,
              crescimento pedagógico, fluxo escolar e apuração dos índices de bonificação docente e
              administrativa da Rede Estadual de Ensino do Pará.
            </p>

            {/* Metadados Institucionais */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1 text-xs text-[#6C757D]">
              <div className="flex items-center gap-1.5 font-medium text-[#1D1D1B]">
                <Calendar className="w-4 h-4 text-[#A71B2B]" />
                <span>Exercício de Referência: <strong>2025</strong></span>
              </div>
              <span className="text-gray-300 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#15803D]" />
                <span>Base Oficial Consolidada</span>
              </div>
              <span className="text-gray-300 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-[#A71B2B]" />
                <span>Critérios e Metas do IDEB</span>
              </div>
            </div>
          </div>

          {/* Card Resumo Normativo Lateral */}
          <div className="bg-[#F8F9FA] border border-[#E2E8F0] rounded-lg p-4 lg:w-80 shrink-0 text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#1D1D1B]">
              <Layers className="w-4 h-4 text-[#A71B2B]" />
              <span>Conformidade &amp; Diretrizes</span>
            </div>
            <p className="text-[#6C757D] leading-normal">
              Os índices apurados seguem a metodologia de metas da SEDUC-PA, ponderando aprovação de
              fluxo, notas padronizadas e inclusão de unidades EJA e AEE.
            </p>
            <div className="pt-1.5 border-t border-gray-200 flex items-center justify-between text-[11px] text-[#6C757D]">
              <span>Abrangência Estadual</span>
              <span className="font-semibold text-[#15803D]">100% dos Polos DRE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
