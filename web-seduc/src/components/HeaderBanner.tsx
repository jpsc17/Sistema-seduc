"use client";

import { GraduationCap, MousePointerClick } from "lucide-react";

export default function HeaderBanner() {
  return (
    <header className="bg-white border-b border-[#E2E8F0] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center gap-3.5">
          {/* Brasão Oficial do Estado do Pará / SEDUC */}
          <div className="flex items-center justify-center">
            <img
              src="/brasao5.png"
              alt="Brasão do Estado do Pará — SEDUC"
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-xs"
            />
          </div>

          {/* Badge topo oficial */}
          <div className="inline-flex items-center gap-2 bg-[#9E0018] text-white text-sm font-semibold px-5 py-1.5 rounded-full shadow-md">
            <MousePointerClick className="w-4 h-4" />
            <span>Clique aqui e acesse</span>
          </div>

          {/* Título principal com ícone do chapéu perfeitamente alinhado */}
          <div className="flex items-center justify-center gap-3.5 sm:gap-4 max-w-fit mx-auto">
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#FDF2F4] text-[#9E0018] shrink-0 border border-[#FAD2D8] shadow-xs">
              <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight">
                Resultados Educacionais e Índice de Bônus
                <br />
                <span className="text-[#9E0018]">
                  das DREs e Escolas Estaduais
                </span>
              </h1>
            </div>
          </div>

          {/* Subtítulo institucional */}
          <p className="text-xs sm:text-sm text-[#4A5568] font-medium -mt-1">
            Referente ao Exercício de 2025 &mdash; SEDUC / SECTET &mdash; Estado do Pará
          </p>
        </div>
      </div>
    </header>
  );
}
