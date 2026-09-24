"use client";

import { School, CheckCircle2, AlertOctagon, BookOpen } from "lucide-react";
import type { KpiData } from "@/lib/types";

interface KpiCardsProps {
  data: KpiData | null;
  loading: boolean;
}

const cards = [
  {
    key: "total_escolas" as const,
    label: "TOTAL DE ESCOLAS",
    caption: "Rede Estadual",
    icon: School,
  },
  {
    key: "escolas_publicadas" as const,
    label: "ESCOLAS PUBLICADAS",
    caption: "Com meta calculada",
    icon: CheckCircle2,
  },
  {
    key: "escolas_nao_publicadas" as const,
    label: "NÃO PUBLICADAS",
    caption: "Pendentes de fluxo",
    icon: AlertOctagon,
  },
  {
    key: "escolas_eja_aee" as const,
    label: "BÔNUS EJA E AEE",
    caption: "Modalidades especiais",
    icon: BookOpen,
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
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:shadow-sm p-4 sm:p-5 flex flex-col justify-between transition-shadow"
            >
              {/* Topo: Rótulo da métrica em caixa alta leve + ícone discreto monocromático */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 tracking-wider">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </div>

              {/* Centro: Número grande e limpo */}
              <div className="my-3">
                {loading ? (
                  <div className="h-9 w-24 bg-slate-100 rounded animate-pulse" />
                ) : (
                  <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                    {value?.toLocaleString("pt-BR") ?? "—"}
                  </p>
                )}
              </div>

              {/* Rodapé: Legenda curta sem corte */}
              <div>
                <p className="text-xs text-slate-400 m-0">
                  {card.caption}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
