"use client";

import { School, CheckCircle2, AlertOctagon, BookOpen, Info } from "lucide-react";
import type { KpiData } from "@/lib/types";

interface KpiCardsProps {
  data: KpiData | null;
  loading: boolean;
}

const cards = [
  {
    key: "total_escolas" as const,
    label: "Total de Escolas",
    sigla: "REDE",
    description: "Total de escolas estaduais cadastradas no censo escolar",
    icon: School,
    color: "#A71B2B",
    bgIcon: "#FDF2F4",
  },
  {
    key: "escolas_publicadas" as const,
    label: "Escolas Publicadas",
    sigla: "APTAS",
    description: "Unidades com metas apuradas e aptas para cálculo de bonificação",
    icon: CheckCircle2,
    color: "#15803D",
    bgIcon: "#F0FDF4",
  },
  {
    key: "escolas_nao_publicadas" as const,
    label: "Não Publicadas (Fluxo)",
    sigla: "PENDÊNCIA",
    description: "Unidades com inconsistência ou pendência de fluxo de rendimento",
    icon: AlertOctagon,
    color: "#9E0018",
    bgIcon: "#FEF2F2",
  },
  {
    key: "escolas_eja_aee" as const,
    label: "Unidades EJA / AEE",
    sigla: "ESPECIAL",
    description: "Educação de Jovens e Adultos e Atendimento Educacional Especializado",
    icon: BookOpen,
    color: "#B45309",
    bgIcon: "#FFFBEB",
  },
];

export default function KpiCards({ data, loading }: KpiCardsProps) {
  return (
    <section aria-label="Indicadores Chave do Sistema" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = data ? data[card.key] : 0;

          return (
            <div
              key={card.key}
              className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden transition-all duration-150 hover:shadow-md hover:border-gray-300 flex flex-col justify-between"
            >
              {/* Faixa colorida fina institucional de 3px no topo */}
              <div
                className="h-[3px] w-full"
                style={{ backgroundColor: card.color }}
              />

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wide">
                        {card.label}
                      </span>
                      {/* Tooltip acessível */}
                      <span
                        tabIndex={0}
                        title={card.description}
                        aria-label={card.description}
                        className="cursor-help text-gray-400 hover:text-[#1D1D1B] focus:text-[#1D1D1B] transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {loading ? (
                      <div className="h-9 w-24 bg-gray-200 rounded animate-pulse my-1" />
                    ) : (
                      <p
                        className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1B]"
                        style={{ color: card.color }}
                      >
                        {value?.toLocaleString("pt-BR") ?? "—"}
                      </p>
                    )}
                  </div>

                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-black/5"
                    style={{ backgroundColor: card.bgIcon }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: card.color }}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#6C757D]">
                  <span className="truncate pr-1">{card.description}</span>
                  <span
                    className="font-bold text-[10px] px-1.5 py-0.5 rounded uppercase shrink-0"
                    style={{ color: card.color, backgroundColor: card.bgIcon }}
                  >
                    {card.sigla}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
