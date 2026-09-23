"use client";

import { School, CheckCircle, XCircle, BookOpen } from "lucide-react";
import type { KpiData } from "@/lib/types";

interface KpiCardsProps {
  data: KpiData | null;
  loading: boolean;
}

const cards = [
  {
    key: "total_escolas" as const,
    label: "Total de Escolas",
    icon: School,
    color: "#9E0018",
  },
  {
    key: "escolas_publicadas" as const,
    label: "Escolas Publicadas",
    icon: CheckCircle,
    color: "#15803D",
  },
  {
    key: "escolas_nao_publicadas" as const,
    label: "Não Publicadas (Fluxo)",
    icon: XCircle,
    color: "#9E0018",
  },
  {
    key: "escolas_eja_aee" as const,
    label: "Unidades EJA / AEE",
    icon: BookOpen,
    color: "#B45309",
  },
];

export default function KpiCards({ data, loading }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = data ? data[card.key] : 0;

        return (
          <div
            key={card.key}
            className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div
              className="h-1.5"
              style={{ backgroundColor: card.color }}
            />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#4A5568] mb-1">
                    {card.label}
                  </p>
                  {loading ? (
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <p
                      className="text-4xl font-extrabold tracking-tight"
                      style={{ color: card.color }}
                    >
                      {value?.toLocaleString("pt-BR") ?? "—"}
                    </p>
                  )}
                </div>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}10` }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: card.color }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
