"use client";

import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  Target,
  Activity,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  SlidersHorizontal,
  Building2,
  Compass,
  BarChart3,
} from "lucide-react";
import type {
  DashboardAnaliticoData,
  DreComparativoItem,
  GranularidadeAnalitica,
} from "@/lib/types";

interface TabGraficosAnaliticosProps {
  dre?: string;
  municipio?: string;
  regiaoIntegracao?: string;
  etapa?: string;
  onClearFilters?: () => void;
  onSelectEscola?: (codigo: string, etapa?: string | null) => void;
}

type DreSortOption = "nome" | "meta" | "crescimento" | "fluxo" | "total";

export default function TabGraficosAnaliticos({
  dre = "",
  municipio = "",
  regiaoIntegracao = "",
  etapa = "",
  onClearFilters,
}: TabGraficosAnaliticosProps) {
  const [data, setData] = useState<DashboardAnaliticoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seletor de Granularidade: "etapa" (padrão - 1.197 avaliações) ou "escola" (895 unidades físicas)
  const [granularidade, setGranularidade] = useState<GranularidadeAnalitica>("etapa");

  // Filtros internos do Gráfico 4 (Comparativo DRE)
  const [dreSearch, setDreSearch] = useState("");
  const [dreSort, setDreSort] = useState<DreSortOption>("nome");
  const [selectedDreHighlight, setSelectedDreHighlight] = useState<string | null>(null);

  // Estado interativo dos quadrantes da matriz
  const [activeQuadrant, setActiveQuadrant] = useState<string | null>(null);

  // Estado de hover nas barras do histograma
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("granularidade", granularidade);
      if (dre.trim()) params.set("dre", dre.trim());
      if (municipio.trim()) params.set("municipio", municipio.trim());
      if (regiaoIntegracao.trim()) params.set("regiao_integracao", regiaoIntegracao.trim());
      if (etapa.trim()) params.set("etapa", etapa.trim());

      const url = `/api/graficos/analiticos?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Falha ao carregar indicadores analíticos do servidor.");
      }
      const json: DashboardAnaliticoData = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Erro ao buscar gráficos analíticos:", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dre, municipio, regiaoIntegracao, etapa, granularidade]);

  const hasActiveFilters = Boolean(
    dre.trim() || municipio.trim() || regiaoIntegracao.trim() || etapa.trim()
  );

  const totalCount = data?.total_escolas ?? 0;
  const rotuloUnidade = granularidade === "escola" ? "escolas" : "etapas";
  const rotuloSingular = granularidade === "escola" ? "escola" : "etapa";

  // Gráfico 4: Filtragem e Ordenação de DREs
  const dresFiltradas = useMemo(() => {
    if (!data?.comparativo_dre) return [];
    let list = [...data.comparativo_dre];

    if (dreSearch.trim()) {
      const q = dreSearch.toLowerCase().trim();
      list = list.filter((item) => item.dre.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      if (dreSort === "nome") return a.dre.localeCompare(b.dre);
      if (dreSort === "meta") return b.metaPct - a.metaPct;
      if (dreSort === "crescimento") return b.crescimentoPct - a.crescimentoPct;
      if (dreSort === "fluxo") return b.fluxoPct - a.fluxoPct;
      if (dreSort === "total") return b.total - a.total;
      return 0;
    });

    return list;
  }, [data?.comparativo_dre, dreSearch, dreSort]);

  // Histograma de pontuação — Máximo para escala proporcional
  const maxHistogramCount = useMemo(() => {
    if (!data?.distribuicao_pontos?.length) return 1;
    return Math.max(...data.distribuicao_pontos.map((d) => d.escolas), 1);
  }, [data?.distribuicao_pontos]);

  // Descrições pedagógicas de cada pontuação (0 a 4) para exibição em Tooltip
  const scoreDescriptions: Record<
    number,
    { label: string; percurso: string; bgBadge: string; textBadge: string; barGradient: string }
  > = {
    0: {
      label: "0 Ponto Conquistado",
      percurso: "Nenhum componente pactuado ou de fluxo alcançado nesta apuração.",
      bgBadge: "bg-slate-100",
      textBadge: "text-slate-700",
      barGradient: "from-slate-400 to-slate-500",
    },
    1: {
      label: "1 Ponto Conquistado",
      percurso: "Adesão inicial — alcance de 1 componente (predomínio de fluxo regular).",
      bgBadge: "bg-sky-50",
      textBadge: "text-sky-700",
      barGradient: "from-sky-400 to-sky-600",
    },
    2: {
      label: "2 Pontos Conquistados",
      percurso: "Desempenho intermediário — alinhamento de 2 componentes (ex.: avanço e fluxo).",
      bgBadge: "bg-blue-50",
      textBadge: "text-blue-700",
      barGradient: "from-blue-500 to-indigo-600",
    },
    3: {
      label: "3 Pontos Conquistados",
      percurso: "Alto rendimento integrado — alcance simultâneo de Meta, Crescimento e Fluxo.",
      bgBadge: "bg-emerald-50",
      textBadge: "text-emerald-700",
      barGradient: "from-emerald-400 to-emerald-600",
    },
    4: {
      label: "4 Pontos (Pontuação Plena)",
      percurso: "Excelência pedagógica e Destaque regional na Região de Integração (RI).",
      bgBadge: "bg-purple-50",
      textBadge: "text-purple-700",
      barGradient: "from-purple-500 to-indigo-700",
    },
  };

  return (
    <div className="space-y-6">
      {/* ─── 1. CABEÇALHO LIMPO E COMPACTO COM TOGGLE DE VISÃO ─────────── */}
      <section
        aria-label="Apresentação do Diagnóstico Pedagógico"
        className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all space-y-3"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Título e Subtítulo Discreto */}
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Painel Analítico de Resultados Pedagógicos
            </h2>
            <p className="text-xs text-slate-500">
              Monitoramento de proficiência, rendimento escolar e trajetórias pedagógicas da rede estadual.
            </p>
          </div>

          {/* Toggle de Visão Compacto & Botão Atualizar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div
              role="group"
              aria-label="Granularidade da análise"
              className="inline-flex p-1 bg-slate-100 rounded-xl gap-1"
            >
              <button
                type="button"
                onClick={() => setGranularidade("etapa")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  granularidade === "etapa"
                    ? "bg-white text-indigo-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                📌 Visão por Etapa (1.197)
              </button>

              <button
                type="button"
                onClick={() => setGranularidade("escola")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  granularidade === "escola"
                    ? "bg-white text-emerald-900 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                🏫 Visão por Escola (895)
              </button>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              title="Recarregar indicadores analíticos"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-400" : ""}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Alerta de Filtros Ativos (se houver) */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-semibold text-slate-700">Recorte aplicado:</span>
              {dre && (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200 font-medium">
                  DRE: {dre}
                </span>
              )}
              {municipio && (
                <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-200 font-medium">
                  Município: {municipio}
                </span>
              )}
              {regiaoIntegracao && (
                <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 font-medium">
                  RI: {regiaoIntegracao}
                </span>
              )}
              {etapa && (
                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                  Etapa: {etapa}
                </span>
              )}
            </div>

            {onClearFilters && (
              <button
                onClick={onClearFilters}
                className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors underline cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </section>

      {/* ─── Mensagem de Erro (se houver) ─────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="font-semibold">Erro ao carregar dados analíticos</p>
            <p className="text-xs text-rose-600">{error}</p>
          </div>
        </div>
      )}

      {/* ─── 2. CARDS DE KPI DO TOPO ─────────────────────────────────────── */}
      <section aria-label="Resumo dos Indicadores" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total do Universo */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {granularidade === "escola" ? "Escolas Avaliadas" : "Etapas Avaliadas"}
            </span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {loading ? "..." : totalCount.toLocaleString("pt-BR")}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700">100,0%</span>
            <span>do universo publicado</span>
          </div>
        </div>

        {/* Card 2: Meta */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">Meta</span>
            <Target className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-sky-900 tabular-nums">
            {loading ? "..." : `${data?.indicadores?.find((i) => i.id === "meta")?.percent ?? 0}%`}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-sky-700 tabular-nums">
              {data?.indicadores?.find((i) => i.id === "meta")?.count ?? 0}
            </span>
            <span>{rotuloUnidade} com meta atingida</span>
          </div>
        </div>

        {/* Card 3: Crescimento */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Crescimento &gt; 0</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 tabular-nums">
            {loading ? "..." : `${data?.indicadores?.find((i) => i.id === "crescimento")?.percent ?? 0}%`}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-emerald-700 tabular-nums">
              {data?.indicadores?.find((i) => i.id === "crescimento")?.count ?? 0}
            </span>
            <span>{rotuloUnidade} com avanço pedagógico</span>
          </div>
        </div>

        {/* Card 4: Fluxo */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">Fluxo Apurado</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900 tabular-nums">
            {loading ? "..." : `${data?.indicadores?.find((i) => i.id === "fluxo")?.percent ?? 0}%`}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-amber-700 tabular-nums">
              {data?.indicadores?.find((i) => i.id === "fluxo")?.count ?? 0}
            </span>
            <span>{rotuloUnidade} com rendimento regular</span>
          </div>
        </div>
      </section>

      {/* ─── 3. Fileira Dupla: GRÁFICO 1 (Indicadores) e GRÁFICO 2 (Histograma) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── GRÁFICO 1 — INDICADORES DA REDE (BARRAS HORIZONTAIS) ─────── */}
        <section
          aria-labelledby="titulo-grafico-1"
          className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <h3 id="titulo-grafico-1" className="text-base font-bold text-slate-900">
                  Indicadores da Rede Estadual
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                4 Componentes
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Percentual de alcance nos 4 componentes pedagógicos oficiais.
            </p>

            {loading ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                Carregando indicadores...
              </div>
            ) : (
              <div className="space-y-5">
                {data?.indicadores?.map((ind) => {
                  return (
                    <div key={ind.id} className="space-y-1.5 group">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 tracking-wide">
                          {ind.nome}
                        </span>
                        {/* Notação Numérica Limpa: Quantidade + Badge Percentual */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-500 font-semibold tabular-nums text-xs">
                            {ind.count.toLocaleString("pt-BR")}
                          </span>
                          <span
                            className="font-bold text-xs px-2 py-0.5 rounded-md tabular-nums"
                            style={{
                              color: ind.color,
                              backgroundColor: `${ind.color}15`,
                            }}
                          >
                            {ind.percent.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Horizontal */}
                      <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out shadow-xs"
                          style={{
                            width: `${Math.min(100, Math.max(0, ind.percent))}%`,
                            backgroundColor: ind.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ─── GRÁFICO 2 — DISTRIBUIÇÃO DA PONTUAÇÃO (HISTOGRAMA 0 A 4 PONTOS) ─── */}
        <section
          aria-labelledby="titulo-grafico-2"
          className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 id="titulo-grafico-2" className="text-base font-bold text-slate-900">
                  Distribuição da Pontuação (0 a 4 Pontos)
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                Histograma
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Distribuição do número de componentes pedagógicos alcançados.
            </p>

            {loading ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
                Carregando distribuição...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Colunas Verticais do Histograma em SVG / CSS */}
                <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-1 px-2 border-b border-slate-200">
                  {data?.distribuicao_pontos?.map((item) => {
                    const heightPercent =
                      maxHistogramCount > 0
                        ? Math.max(12, Math.round((item.escolas / maxHistogramCount) * 100))
                        : 12;
                    const config = scoreDescriptions[item.pontos] || scoreDescriptions[0];
                    const isHovered = hoveredScore === item.pontos;

                    return (
                      <div
                        key={item.pontos}
                        onMouseEnter={() => setHoveredScore(item.pontos)}
                        onMouseLeave={() => setHoveredScore(null)}
                        title={`${config.label}: ${item.escolas} ${rotuloUnidade} (${item.percent.toFixed(1)}%)\n${config.percurso}`}
                        className="relative flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      >
                        {/* Tooltip Dinâmico Leve ao passar o mouse */}
                        {isHovered && (
                          <div className="absolute -top-12 z-20 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-all">
                            <span>{config.percurso}</span>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                          </div>
                        )}

                        {/* Topo da Coluna: Valor absoluto em negrito e percentual abaixo */}
                        <div
                          className={`mb-1.5 text-center transition-transform ${
                            isHovered ? "-translate-y-1" : ""
                          }`}
                        >
                          <span className="block text-xs font-bold text-slate-900 tabular-nums">
                            {item.escolas}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-medium tabular-nums">
                            {item.percent.toFixed(1)}%
                          </span>
                        </div>

                        {/* Barra Vertical */}
                        <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg p-0.5 h-full flex items-end">
                          <div
                            className={`w-full rounded-t-md bg-gradient-to-t ${config.barGradient} transition-all duration-500 ease-out ${
                              isHovered ? "brightness-110 shadow-md" : "shadow-xs"
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>

                        {/* Rótulo Eixo X Limpo */}
                        <div className="mt-2 text-center">
                          <span className="text-xs font-semibold text-slate-600">
                            {item.pontos} {item.pontos === 1 ? "pto" : "ptos"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ─── 4. GRÁFICO 3 — MATRIZ DE TRAJETÓRIA ESCOLAR (FLUXO × CRESCIMENTO) ─── */}
      <section
        aria-labelledby="titulo-grafico-3"
        className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 id="titulo-grafico-3" className="text-base font-bold text-slate-900">
                Matriz de Trajetória Escolar (Fluxo &times; Crescimento — 2&times;2)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cruzamento para diagnóstico de evasão versus avanço pedagógico.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              Vertical: <strong>Crescimento</strong> &bull; Horizontal: <strong>Fluxo</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            Carregando matriz de trajetória...
          </div>
        ) : (
          <div className="space-y-3">
            {/* Grid 2x2 dos 4 Quadrantes Limpos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quadrante A: Alto Desempenho */}
              <div
                onMouseEnter={() => setActiveQuadrant("A")}
                onMouseLeave={() => setActiveQuadrant(null)}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  activeQuadrant === "A"
                    ? "border-emerald-500 shadow-md bg-emerald-50/90"
                    : "border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/70"
                }`}
              >
                {/* 1. Topo: Badge com nome do quadrante */}
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    Quadrante A &bull; Alto Desempenho
                  </span>
                </div>

                {/* 2. Número em Destaque: Quantidade e Percentual */}
                <div className="my-1.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-900 tabular-nums">
                    {data?.matriz_trajetoria?.quadranteA?.count?.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-sm font-bold text-emerald-700 tabular-nums">
                    &bull; {data?.matriz_trajetoria?.quadranteA?.percent.toFixed(1)}%
                  </span>
                </div>

                {/* 3. Texto Explicativo em cinza neutro */}
                <p className="text-xs text-slate-500 leading-relaxed">
                  {data?.matriz_trajetoria?.quadranteA?.descricao}
                </p>
              </div>

              {/* Quadrante B: Alerta de Fluxo/Evasão */}
              <div
                onMouseEnter={() => setActiveQuadrant("B")}
                onMouseLeave={() => setActiveQuadrant(null)}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  activeQuadrant === "B"
                    ? "border-amber-500 shadow-md bg-amber-50/90"
                    : "border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/70"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    Quadrante B &bull; Alerta de Fluxo / Evasão
                  </span>
                </div>

                <div className="my-1.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 tabular-nums">
                    {data?.matriz_trajetoria?.quadranteB?.count?.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-sm font-bold text-amber-700 tabular-nums">
                    &bull; {data?.matriz_trajetoria?.quadranteB?.percent.toFixed(1)}%
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {data?.matriz_trajetoria?.quadranteB?.descricao}
                </p>
              </div>

              {/* Quadrante C: Regularidade sem Avanço */}
              <div
                onMouseEnter={() => setActiveQuadrant("C")}
                onMouseLeave={() => setActiveQuadrant(null)}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  activeQuadrant === "C"
                    ? "border-sky-500 shadow-md bg-sky-50/90"
                    : "border-sky-200/80 bg-sky-50/40 hover:bg-sky-50/70"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                    <Activity className="w-3 h-3 text-sky-700" />
                    Quadrante C &bull; Regularidade sem Avanço
                  </span>
                </div>

                <div className="my-1.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-sky-900 tabular-nums">
                    {data?.matriz_trajetoria?.quadranteC?.count?.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-sm font-bold text-sky-700 tabular-nums">
                    &bull; {data?.matriz_trajetoria?.quadranteC?.percent.toFixed(1)}%
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {data?.matriz_trajetoria?.quadranteC?.descricao}
                </p>
              </div>

              {/* Quadrante D: Intervenção Prioritária */}
              <div
                onMouseEnter={() => setActiveQuadrant("D")}
                onMouseLeave={() => setActiveQuadrant(null)}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  activeQuadrant === "D"
                    ? "border-rose-500 shadow-md bg-rose-50/90"
                    : "border-rose-200/80 bg-rose-50/40 hover:bg-rose-50/70"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                    <AlertCircle className="w-3 h-3 text-rose-700" />
                    Quadrante D &bull; Intervenção Prioritária
                  </span>
                </div>

                <div className="my-1.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-rose-900 tabular-nums">
                    {data?.matriz_trajetoria?.quadranteD?.count?.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-sm font-bold text-rose-700 tabular-nums">
                    &bull; {data?.matriz_trajetoria?.quadranteD?.percent.toFixed(1)}%
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {data?.matriz_trajetoria?.quadranteD?.descricao}
                </p>
              </div>
            </div>

            {/* Rodapé Limpo com Diretriz Pedagógica */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
              <span>
                <strong>Diretriz Pedagógica:</strong> Foco prioritário de supervisão e tutoria nos Quadrantes B (evasão) e D (intervenção).
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ─── 5. GRÁFICO 4 — RESULTADO COMPARATIVO POR DRE (BARRAS AGRUPADAS) ─── */}
      <section
        aria-labelledby="titulo-grafico-4"
        className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 id="titulo-grafico-4" className="text-base font-bold text-slate-900">
                Resultado Comparativo por DRE
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comportamento pedagógico regional comparando % Meta, % Crescimento e % Fluxo.
            </p>
          </div>

          {/* Legenda dos 3 Indicadores Agrupados */}
          <div className="flex items-center gap-4 flex-wrap text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-sky-500" />
              <span className="text-slate-700">% Meta</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-slate-700">% Crescimento</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500" />
              <span className="text-slate-700">% Fluxo</span>
            </div>
          </div>
        </div>

        {/* Barra de Média da Rede de Referência */}
        {data?.media_rede && (
          <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
              Média Geral da Rede Estadual:
            </span>
            <div className="flex items-center gap-4 text-xs font-semibold tabular-nums">
              <span className="text-sky-700">Meta: {data.media_rede.metaPct.toFixed(1)}%</span>
              <span className="text-emerald-700">Crescimento: {data.media_rede.crescimentoPct.toFixed(1)}%</span>
              <span className="text-amber-700">Fluxo: {data.media_rede.fluxoPct.toFixed(1)}%</span>
            </div>
          </div>
        )}

        {/* Controles de Busca e Ordenação das DREs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={dreSearch}
              onChange={(e) => setDreSearch(e.target.value)}
              placeholder="Buscar regional..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {dreSearch && (
              <button
                onClick={() => setDreSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Ordenar por:</span>
            <select
              value={dreSort}
              onChange={(e) => setDreSort(e.target.value as DreSortOption)}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="nome">Ordem Alfabética (A-Z)</option>
              <option value="meta">Maior % Meta</option>
              <option value="crescimento">Maior % Crescimento</option>
              <option value="fluxo">Maior % Fluxo</option>
              <option value="total">Mais {rotuloUnidade} na DRE</option>
            </select>
          </div>
        </div>

        {/* Lista de Linhas por DRE Limpas */}
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
            Carregando comparativo regional...
          </div>
        ) : dresFiltradas.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
            Nenhuma Diretoria Regional de Ensino encontrada com o filtro &quot;{dreSearch}&quot;.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {dresFiltradas.map((item) => {
              const isSelected = selectedDreHighlight === item.dre;

              return (
                <div
                  key={item.dre}
                  onClick={() =>
                    setSelectedDreHighlight(isSelected ? null : item.dre)
                  }
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-400 bg-indigo-50/40 shadow-xs"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                      {item.dre}
                    </span>
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {item.total} {item.total === 1 ? rotuloSingular : rotuloUnidade}
                    </span>
                  </div>

                  {/* 3 Barras Horizontais Compactas e Alinhadas com Percentuais à Direita */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Barra 1: Meta */}
                    <div
                      title={`Meta: ${item.metaCount} de ${item.total} ${rotuloUnidade} (${item.metaPct.toFixed(1)}%)`}
                      className="flex items-center gap-2 group/bar"
                    >
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full transition-all duration-500 group-hover/bar:bg-sky-600"
                          style={{ width: `${Math.min(100, Math.max(0, item.metaPct))}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-sky-700 tabular-nums w-12 text-right">
                        {item.metaPct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Barra 2: Crescimento */}
                    <div
                      title={`Crescimento: ${item.crescimentoCount} de ${item.total} ${rotuloUnidade} (${item.crescimentoPct.toFixed(1)}%)`}
                      className="flex items-center gap-2 group/bar"
                    >
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500 group-hover/bar:bg-emerald-600"
                          style={{ width: `${Math.min(100, Math.max(0, item.crescimentoPct))}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-emerald-700 tabular-nums w-12 text-right">
                        {item.crescimentoPct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Barra 3: Fluxo */}
                    <div
                      title={`Fluxo: ${item.fluxoCount} de ${item.total} ${rotuloUnidade} (${item.fluxoPct.toFixed(1)}%)`}
                      className="flex items-center gap-2 group/bar"
                    >
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500 group-hover/bar:bg-amber-600"
                          style={{ width: `${Math.min(100, Math.max(0, item.fluxoPct))}%` }}
                        />
                      </div>
                      <span className="font-bold text-xs text-amber-700 tabular-nums w-12 text-right">
                        {item.fluxoPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
