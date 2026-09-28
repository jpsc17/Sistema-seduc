"use client";

import { useState } from "react";
import { Info } from "lucide-react";

export const TOOLTIP_FATOR_DOCENTE =
  "Índice cumulativo aplicado sobre o vencimento-base do docente em regência de classe, apurado a partir do cumprimento de metas, evolução pedagógica e fluxo. Sujeito ao teto legal máximo de 3,5x (Lei Estadual nº 10.435/2024).";

export const TOOLTIP_FATOR_ADMIN =
  "Índice proporcional aplicado sobre o vencimento-base dos servidores das equipes de apoio técnico e administrativo da unidade escolar, conforme critérios regulamentares do Programa Escola que Transforma (Teto: 3,5x).";

interface InfoTooltipProps {
  content: string;
  align?: "left" | "right" | "center";
  className?: string;
}

export default function InfoTooltip({
  content,
  align = "right",
  className = "",
}: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  const alignClass =
    align === "left"
      ? "left-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "right-0";

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
      tabIndex={0}
      role="button"
      aria-label="Informações sobre o indicador"
    >
      <Info className="w-3.5 h-3.5 ml-1 text-slate-400 hover:text-slate-600 inline-block cursor-help transition-colors" />
      {open && (
        <span
          role="tooltip"
          className={`absolute top-full mt-1.5 ${alignClass} bg-slate-900 text-white text-xs rounded-md shadow-lg p-2.5 max-w-xs z-50 w-72 pointer-events-none text-left font-normal normal-case tracking-normal leading-relaxed animate-in fade-in zoom-in-95 duration-100`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
