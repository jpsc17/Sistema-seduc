"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  PieChart as PieIcon,
  BookOpen,
  Award,
  Users,
  HeartHandshake,
  Layers,
  Filter,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import type { DashboardGraficosData, ItemComposicaoBonus } from "@/lib/types";

interface TabGraficosProps {
  dre?: string;
  municipio?: string;
  regiaoIntegracao?: string;
  etapa?: string;
  onClearFilters?: () => void;
  onSelectEscola?: (codigo: string, etapa?: string | null) => void;
}

export default function TabGraficos({
  dre = "",
  municipio = "",
  regiaoIntegracao = "",
  etapa = "",
  onClearFilters,
}: TabGraficosProps) {
  const [data, setData] = useState<DashboardGraficosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (dre.trim()) params.set("dre", dre.trim());
      if (municipio.trim()) params.set("municipio", municipio.trim());
      if (regiaoIntegracao.trim()) params.set("regiao_integracao", regiaoIntegracao.trim());
      if (etapa.trim()) params.set("etapa", etapa.trim());

      const url = params.toString() ? `/api/graficos?${params.toString()}` : "/api/graficos";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Falha ao carregar indicadores agregados do servidor.");
      }
      const json: DashboardGraficosData = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error("Erro ao buscar gráficos:", err);
      const msg = err instanceof Error ? err.message : "Erro ao carregar dados";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dre, municipio, regiaoIntegracao, etapa]);

  const hasActiveFilters = Boolean(
    dre.trim() || municipio.trim() || regiaoIntegracao.trim() || etapa.trim()
  );

  const activeSlice: ItemComposicaoBonus | null = useMemo(() => {
    if (activeIndex !== null && data?.composicao_bonus[activeIndex]) {
      return data.composicao_bonus[activeIndex];
    }
    return null;
  }, [activeIndex, data]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl border border-slate-200" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl border border-slate-200" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Não foi possível carregar a consolidação gráfica
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </button>
      </div>
    );
  }

  const composicao = data?.composicao_bonus || [];
  const totalPontos = data?.total_pontos ?? 0;
  const detalhesIdeb = data?.detalhes_ideb;

  return (
    <div className="space-y-6">
      {/* ─── 1. Header Card Executivo ────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 bottom-0 translate-y-12 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-sky-300 border border-white/10 backdrop-blur-xs">
              <PieIcon className="w-3.5 h-3.5" />
              <span>Painel Executivo de Bonificação</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Distribuição Global da Bonificação
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consolidação analítica do volume total de pontos apurados na rede estadual por
              modalidade de ensino, conforme os critérios da{" "}
              <strong className="text-white font-semibold">Lei Estadual nº 10.435/2024</strong>.
            </p>
          </div>

          {/* Indicador de Filtro Ativo */}
          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            {hasActiveFilters ? (
              <div className="flex flex-wrap items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl border border-white/10 text-xs">
                <Filter className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-slate-300 font-medium">Recorte territorial ativo</span>
                {onClearFilters && (
                  <button
                    onClick={onClearFilters}
                    className="ml-2 text-sky-300 hover:text-white underline cursor-pointer text-xs font-semibold"
                  >
                    Redefinir
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Visão Integral da Rede Estadual</span>
              </div>
            )}

            <div className="text-xs text-slate-400 sm:text-right">
              Volume total:{" "}
              <strong className="text-white font-mono font-bold text-sm">
                {totalPontos.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </strong>{" "}
              pontos apurados
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Quatro Cards de Síntese (As 4 Fatias) ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fatia 1: IDEB Regular */}
        <div
          onMouseEnter={() => setActiveIndex(0)}
          onMouseLeave={() => setActiveIndex(null)}
          className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all duration-150 ${
            activeIndex === 0
              ? "ring-2 ring-sky-500 border-sky-400 shadow-md bg-sky-50/20"
              : "border-slate-200/80 shadow-xs hover:border-sky-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-sky-700 uppercase">
              1. IDEB (Regular)
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {(composicao[0]?.value ?? 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full tabular-nums">
              {composicao[0]?.percent ?? 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-2">
            Meta pactuada, crescimento positivo, destaque RI e rendimento.
          </p>
        </div>

        {/* Fatia 2: Alfabetização */}
        <div
          onMouseEnter={() => setActiveIndex(1)}
          onMouseLeave={() => setActiveIndex(null)}
          className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all duration-150 ${
            activeIndex === 1
              ? "ring-2 ring-emerald-500 border-emerald-400 shadow-md bg-emerald-50/20"
              : "border-slate-200/80 shadow-xs hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase">
              2. Alfabetização
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {(composicao[1]?.value ?? 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full tabular-nums">
              {composicao[1]?.percent ?? 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-2">
            Fatores específicos de alfabetização apurados para 1º e 2º ano.
          </p>
        </div>

        {/* Fatia 3: EJA */}
        <div
          onMouseEnter={() => setActiveIndex(2)}
          onMouseLeave={() => setActiveIndex(null)}
          className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all duration-150 ${
            activeIndex === 2
              ? "ring-2 ring-amber-500 border-amber-400 shadow-md bg-amber-50/20"
              : "border-slate-200/80 shadow-xs hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
              3. Total EJA
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {(composicao[2]?.value ?? 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full tabular-nums">
              {composicao[2]?.percent ?? 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-2">
            Educação de Jovens e Adultos (Iniciais + Finais + Médio).
          </p>
        </div>

        {/* Fatia 4: AEE */}
        <div
          onMouseEnter={() => setActiveIndex(3)}
          onMouseLeave={() => setActiveIndex(null)}
          className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all duration-150 ${
            activeIndex === 3
              ? "ring-2 ring-purple-500 border-purple-400 shadow-md bg-purple-50/20"
              : "border-slate-200/80 shadow-xs hover:border-purple-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-purple-700 uppercase">
              4. Total AEE
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {(composicao[3]?.value ?? 0).toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full tabular-nums">
              {composicao[3]?.percent ?? 0}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 line-clamp-2">
            Atendimento Educacional Especializado apurado oficialmente.
          </p>
        </div>
      </div>

      {/* ─── 3. Bloco Principal: Donut Chart Central + Detalhamento Comparativo ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Gráfico Donut Moderno */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-sky-600" />
                <span>Composição Global da Bonificação</span>
              </h3>
              <p className="text-xs text-slate-500">
                Passe o cursor sobre as fatias para inspecionar os valores
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
              4 Fatias
            </span>
          </div>

          <div className="relative my-4 flex items-center justify-center min-h-[320px]">
            {mounted && totalPontos > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload as ItemComposicaoBonus;
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs space-y-1">
                            <div className="flex items-center gap-2 font-bold text-sm">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span>{item.name}</span>
                            </div>
                            <div className="text-slate-300">
                              Volume:{" "}
                              <strong className="text-white font-mono">
                                {item.value.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 2,
                                })}
                              </strong>{" "}
                              pts
                            </div>
                            <div className="text-slate-300">
                              Participação:{" "}
                              <strong className="text-sky-300">{item.percent}%</strong>
                            </div>
                            {item.descricao && (
                              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                                {item.descricao}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={composicao}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={125}
                    paddingAngle={3}
                    cornerRadius={5}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {composicao.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={activeIndex === index ? 3 : 1.5}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          filter:
                            activeIndex === index
                              ? "drop-shadow(0px 4px 10px rgba(0,0,0,0.2))"
                              : "none",
                          opacity: activeIndex === null || activeIndex === index ? 1 : 0.45,
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-medium">Nenhum ponto computado no recorte atual</p>
              </div>
            )}

            {/* Centro do Donut: Métricas Dinâmicas ao Hover */}
            {totalPontos > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {activeSlice ? activeSlice.name : "TOTAL DA REDE"}
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                  {activeSlice
                    ? activeSlice.value.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })
                    : totalPontos.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {activeSlice ? `${activeSlice.percent}% do total` : "pontos apurados"}
                </span>
              </div>
            )}
          </div>

          {/* Legenda Customizada Horizontal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100">
            {composicao.map((item, idx) => (
              <button
                key={item.name}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center gap-1.5 text-xs text-left p-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeIndex === idx ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-700 truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detalhamento Analítico das 4 Fatias */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Discriminação e Peso Relativo</span>
              </h3>
              <p className="text-xs text-slate-500">
                Detalhamento dos componentes de pontuação de cada modalidade
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-1 rounded">
                100,0%
              </span>
            </div>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {composicao.map((item, idx) => {
              const isHovered = activeIndex === idx;

              return (
                <div
                  key={item.name}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`pt-3 first:pt-0 transition-colors p-2.5 rounded-xl ${
                    isHovered ? "bg-slate-50/80 ring-1 ring-slate-300" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {item.value.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
                        {item.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, item.percent))}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>

                  <p className="text-xs text-slate-500">{item.descricao}</p>

                  {/* Sub-discriminação específica do IDEB Regular */}
                  {item.name.includes("IDEB") && detalhesIdeb && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-sky-50/60 p-2 rounded-lg border border-sky-100 text-[11px]">
                        <span className="text-slate-500 block">14º (Meta)</span>
                        <strong className="font-mono text-sky-900 text-xs">
                          {detalhesIdeb.meta.toLocaleString("pt-BR")} pts
                        </strong>
                      </div>
                      <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-100 text-[11px]">
                        <span className="text-slate-500 block">15º (Cresc.)</span>
                        <strong className="font-mono text-blue-900 text-xs">
                          {detalhesIdeb.crescimento.toLocaleString("pt-BR", {
                            minimumFractionDigits: 1,
                          })}{" "}
                          pts
                        </strong>
                      </div>
                      <div className="bg-amber-50/60 p-2 rounded-lg border border-amber-100 text-[11px]">
                        <span className="text-slate-500 block">16º (RI)</span>
                        <strong className="font-mono text-amber-900 text-xs">
                          {detalhesIdeb.destaque_ri.toLocaleString("pt-BR")} pts
                        </strong>
                      </div>
                      <div className="bg-slate-100/70 p-2 rounded-lg border border-slate-200 text-[11px]">
                        <span className="text-slate-500 block">Fluxo</span>
                        <strong className="font-mono text-slate-800 text-xs">
                          {detalhesIdeb.fluxo.toLocaleString("pt-BR", {
                            minimumFractionDigits: 1,
                          })}{" "}
                          pts
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 4. Nota de Auditoria e Metodologia Oficial ─────────────────────── */}
      <footer className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-semibold text-slate-800 block">
            Metodologia Oficial de Consolidação (Lei Estadual nº 10.435/2024):
          </strong>
          <p className="leading-relaxed">
            A pontuação consolidada reflete a soma direta dos índices apurados para a rede estadual:
            o ciclo <strong>IDEB Regular</strong> totaliza os pontos de cumprimento de meta (14º Salário),
            crescimento pedagógico positivo (15º Salário), destaque regional por RI (16º Salário) e índice de fluxo;
            a <strong>Alfabetização</strong> consolida os fatores específicos do 1º e 2º ano; e as modalidades de{" "}
            <strong>EJA</strong> e <strong>AEE</strong> integram os pontos homologados nas matrizes de atendimento especializado.
          </p>
        </div>
      </footer>
    </div>
  );
}
