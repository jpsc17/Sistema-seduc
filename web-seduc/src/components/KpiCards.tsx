"use client";

import { School, CheckCircle2, AlertOctagon, BookOpen, Target, TrendingUp, Activity, Slash, X } from "lucide-react";
import type { KpiData } from "@/lib/types";

export type CardFilterType = "meta" | "crescimento" | "fluxo" | "zero" | null;

interface KpiCardsProps {
  data: KpiData | null;
  loading: boolean;
  activeCardFilter?: CardFilterType;
  onCardFilterChange?: (filter: CardFilterType) => void;
}

const mainCardConfigs = [
  {
    key: "total_escolas" as const,
    label: "TOTAL DE ESCOLAS",
    getCaption: () => "100% da Rede Estadual",
    icon: School,
    getPct: () => null,
  },
  {
    key: "escolas_publicadas" as const,
    label: "ESCOLAS PUBLICADAS",
    getCaption: (data: KpiData | null) => {
      const tot = data?.total_escolas ?? 972;
      const pub = data?.escolas_publicadas ?? 895;
      const pct = tot > 0 ? ((pub / tot) * 100).toFixed(1).replace(".", ",") : "92,1";
      return `${pct}% da seleção ativa`;
    },
    icon: CheckCircle2,
    getPct: (data: KpiData | null) => {
      const tot = data?.total_escolas ?? 972;
      const pub = data?.escolas_publicadas ?? 895;
      return tot > 0 ? `${((pub / tot) * 100).toFixed(1).replace(".", ",")}%` : "92,1%";
    },
  },
  {
    key: "escolas_nao_publicadas" as const,
    label: "NÃO PUBLICADAS",
    getCaption: (data: KpiData | null) => {
      const tot = data?.total_escolas ?? 972;
      const np = data?.escolas_nao_publicadas ?? 77;
      const pct = tot > 0 ? ((np / tot) * 100).toFixed(1).replace(".", ",") : "7,9";
      return `${pct}% da seleção ativa`;
    },
    icon: AlertOctagon,
    getPct: (data: KpiData | null) => {
      const tot = data?.total_escolas ?? 972;
      const np = data?.escolas_nao_publicadas ?? 77;
      return tot > 0 ? `${((np / tot) * 100).toFixed(1).replace(".", ",")}%` : "7,9%";
    },
  },
  {
    key: "escolas_eja_aee" as const,
    label: "BÔNUS EJA E AEE",
    getCaption: () => "Modalidades especiais",
    icon: BookOpen,
    getPct: () => null,
  },
];

const analyticalCards = [
  {
    key: "total_meta_sim" as const,
    filterKey: "meta" as const,
    title: "Escolas que Atingiram a Meta",
    caption: "Habilitadas à parcela do 14º",
    icon: Target,
    badgeText: "14º Salário",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    valColor: "text-emerald-700",
    pctColor: "text-emerald-700/80 bg-emerald-50/70 border-emerald-200/50",
    activeClass: "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/30 shadow-sm",
    hoverClass: "hover:border-emerald-300 hover:shadow-xs",
  },
  {
    key: "total_crescimento_positivo" as const,
    filterKey: "crescimento" as const,
    title: "Escolas com Crescimento",
    caption: "Habilitadas à parcela do 15º",
    icon: TrendingUp,
    badgeText: "15º Salário",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200/60",
    valColor: "text-blue-700",
    pctColor: "text-blue-700/80 bg-blue-50/70 border-blue-200/50",
    activeClass: "ring-2 ring-blue-500 border-blue-500 bg-blue-50/30 shadow-sm",
    hoverClass: "hover:border-blue-300 hover:shadow-xs",
  },
  {
    key: "total_somente_fluxo" as const,
    filterKey: "fluxo" as const,
    title: "Atingiram Somente Fluxo",
    caption: "Meta não atingida e cresc. ≤ 0",
    icon: Activity,
    badgeText: "Fluxo > 0",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200/60",
    valColor: "text-slate-800",
    pctColor: "text-amber-700/80 bg-amber-50/70 border-amber-200/50",
    activeClass: "ring-2 ring-amber-500 border-amber-500 bg-amber-50/30 shadow-sm",
    hoverClass: "hover:border-amber-300 hover:shadow-xs",
  },
  {
    key: "total_fator_zero" as const,
    filterKey: "zero" as const,
    title: "Fator Multiplicador Zero (FM = 0)",
    caption: "Docente apurado igual a 0,0",
    icon: Slash,
    badgeText: "FM = 0,0",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    valColor: "text-slate-800",
    pctColor: "text-slate-600 bg-slate-100 border-slate-200",
    activeClass: "ring-2 ring-slate-500 border-slate-500 bg-slate-100/60 shadow-sm",
    hoverClass: "hover:border-slate-300 hover:shadow-xs",
  },
];

export default function KpiCards({
  data,
  loading,
  activeCardFilter = null,
  onCardFilterChange,
}: KpiCardsProps) {
  const basePublicadas = data?.escolas_publicadas ?? 895;

  const calcPctPub = (val?: number) => {
    if (val === undefined || val === null || !basePublicadas || basePublicadas === 0) return "0,0%";
    return `${((val / basePublicadas) * 100).toFixed(1).replace(".", ",")}%`;
  };

  const handleCardClick = (cardKey: CardFilterType) => {
    if (!onCardFilterChange) return;
    if (activeCardFilter === cardKey) {
      onCardFilterChange(null);
    } else {
      onCardFilterChange(cardKey);
    }
  };

  const activeCardInfo = analyticalCards.find((c) => c.filterKey === activeCardFilter);

  return (
    <section aria-label="Indicadores Chave do Sistema" className="w-full space-y-3">
      {/* 1ª Fileira: Cards Institucionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainCardConfigs.map((card) => {
          const Icon = card.icon;
          const value = data ? data[card.key] : 0;
          const pct = card.getPct(data);

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

              {/* Centro: Número grande e limpo + percentual quando aplicável */}
              <div className="my-3 flex items-baseline justify-between">
                {loading ? (
                  <div className="h-9 w-24 bg-slate-100 rounded animate-pulse" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {value?.toLocaleString("pt-BR") ?? "—"}
                    </p>
                    {pct && (
                      <span className="text-xs font-semibold text-slate-500 tabular-nums bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                        {pct}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Rodapé: Legenda curta com percentual contextual */}
              <div>
                <p className="text-xs text-slate-400 m-0">
                  {card.getCaption(data)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2ª Fileira: Mini-Cards Analíticos com Percentuais e Modo Interativo / Filtro Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {analyticalCards.map((c) => {
          const Icon = c.icon;
          const value = data && data[c.key] !== undefined ? data[c.key] : 0;
          const pct = calcPctPub(value);
          const isActive = activeCardFilter === c.filterKey;

          return (
            <div
              key={c.key}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              onClick={() => handleCardClick(c.filterKey)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(c.filterKey);
                }
              }}
              title={
                isActive
                  ? `Filtro ativo: ${c.title}. Clique para remover o filtro.`
                  : `Clique para filtrar a tabela por: ${c.title}`
              }
              className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-150 select-none ${
                isActive ? c.activeClass : `border-slate-200 ${c.hoverClass}`
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 truncate" title={c.title}>
                  {c.title}
                </span>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${c.badgeClass} shrink-0`}
                >
                  {c.badgeText}
                </span>
              </div>

              <div className="my-2 flex items-baseline justify-between">
                {loading ? (
                  <div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold tracking-tight tabular-nums ${c.valColor}`}>
                      {value?.toLocaleString("pt-BR") ?? "—"}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold border tabular-nums ${c.pctColor}`}
                    >
                      {pct}
                    </span>
                  </div>
                )}
                <Icon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 gap-1">
                <span className="truncate" title={`${c.caption} (${pct} das publicadas)`}>
                  {c.caption}
                </span>
                <span className={`text-[10px] font-bold shrink-0 ${isActive ? "text-emerald-700" : "text-slate-400"}`}>
                  {isActive ? "Filtro ativo ✓" : "Filtrar"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Feedback do Card Selecionado com Opção de Desativação */}
      {activeCardFilter && activeCardInfo && (
        <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2 rounded-xl text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Relatório Executivo Ativo:{" "}
              <strong className="text-emerald-300">{activeCardInfo.title}</strong>
              <span className="text-slate-400 ml-1">({activeCardInfo.badgeText})</span>
            </span>
          </div>

          <button
            onClick={() => onCardFilterChange?.(null)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpar Filtro do Card</span>
          </button>
        </div>
      )}
    </section>
  );
}
