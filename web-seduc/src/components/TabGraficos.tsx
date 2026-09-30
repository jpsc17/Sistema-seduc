"use client";

import { useEffect, useState, useMemo } from "react";
import {
  PieChart as PieIcon,
  BookOpen,
  Award,
  Users,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  Target,
  Star,
  Activity,
  ArrowRight,
} from "lucide-react";
import type { DashboardGraficosData, ModalidadeBonus } from "@/lib/types";

interface TabGraficosProps {
  dre?: string;
  municipio?: string;
  regiaoIntegracao?: string;
  etapa?: string;
  onClearFilters?: () => void;
  onSelectEscola?: (codigo: string, etapa?: string | null) => void;
}

// ─── Funções Matemáticas de SVG para Arcos do Donut ────────────────────────
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const safeEndAngle =
    endAngle - startAngle >= 359.999 ? startAngle + 359.999 : endAngle;
  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, safeEndAngle);
  const startInner = polarToCartesian(x, y, innerRadius, safeEndAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = safeEndAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    startOuter.x,
    startOuter.y,
    "A",
    outerRadius,
    outerRadius,
    0,
    largeArcFlag,
    1,
    endOuter.x,
    endOuter.y,
    "L",
    startInner.x,
    startInner.y,
    "A",
    innerRadius,
    innerRadius,
    0,
    largeArcFlag,
    0,
    endInner.x,
    endInner.y,
    "Z",
  ].join(" ");
}

const MODALIDADE_CONFIGS: Record<
  string,
  {
    icon: typeof Award;
    color: string;
    bgBadge: string;
    borderBadge: string;
    textBadge: string;
  }
> = {
  ideb: {
    icon: Award,
    color: "#0284c7",
    bgBadge: "bg-sky-50",
    borderBadge: "border-sky-200",
    textBadge: "text-sky-700",
  },
  aee: {
    icon: HeartHandshake,
    color: "#8b5cf6",
    bgBadge: "bg-purple-50",
    borderBadge: "border-purple-200",
    textBadge: "text-purple-700",
  },
  eja: {
    icon: Users,
    color: "#f59e0b",
    bgBadge: "bg-amber-50",
    borderBadge: "border-amber-200",
    textBadge: "text-amber-700",
  },
  alfabetizacao: {
    icon: BookOpen,
    color: "#10b981",
    bgBadge: "bg-emerald-50",
    borderBadge: "border-emerald-200",
    textBadge: "text-emerald-700",
  },
};

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

  // Estado interativo do Donut SVG
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  // Estado expansível do micrográfico do IDEB
  const [idebExpanded, setIdebExpanded] = useState<boolean>(true);

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

  const modalidades = useMemo(() => data?.modalidades || [], [data]);
  const totalRede = useMemo(() => data?.total_rede ?? 0, [data]);

  // Cálculo matemático dos ângulos SVG para cada fatia
  const slicesWithAngles = useMemo(() => {
    if (!modalidades.length || totalRede === 0) return [];

    let currentAngle = 0;
    const gapAngle = modalidades.length > 1 ? 1.5 : 0;
    const totalGaps = gapAngle * modalidades.length;
    const availableDegrees = Math.max(0, 360 - totalGaps);

    return modalidades.map((mod) => {
      const share = mod.valor / totalRede;
      const sliceDegrees = share * availableDegrees;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceDegrees;
      currentAngle = endAngle + gapAngle;

      const percentCalc = Number((share * 100).toFixed(1));
      const config = MODALIDADE_CONFIGS[mod.id] || {
        icon: Award,
        color: mod.color || "#0284c7",
        bgBadge: "bg-slate-50",
        borderBadge: "border-slate-200",
        textBadge: "text-slate-700",
      };

      return {
        ...mod,
        percent: mod.percent ?? percentCalc,
        startAngle,
        endAngle,
        config,
      };
    });
  }, [modalidades, totalRede]);

  const activeSlice = useMemo(() => {
    if (!hoveredSliceId) return null;
    return slicesWithAngles.find((s) => s.id === hoveredSliceId) || null;
  }, [hoveredSliceId, slicesWithAngles]);

  const idebItem = useMemo(() => {
    return modalidades.find((m) => m.id === "ideb");
  }, [modalidades]);

  const idebDetalhes = idebItem?.detalhes;

  // Cálculos do micrográfico de composição do IDEB
  const idebSubComponents = useMemo(() => {
    if (!idebDetalhes || !idebItem || idebItem.valor === 0) return [];
    const idebTotal = idebItem.valor;

    const components = [
      {
        id: "meta",
        label: "14º Salário (Meta Pactuada)",
        shortLabel: "14º Meta",
        subtext: "Cumprimento integral ou parcial da meta oficial pactuada",
        value: idebDetalhes.meta,
        pctOfIdeb: Number(((idebDetalhes.meta / idebTotal) * 100).toFixed(1)),
        pctOfRede: totalRede > 0 ? Number(((idebDetalhes.meta / totalRede) * 100).toFixed(1)) : 0,
        color: "#059669", // Emerald
        icon: Target,
        badgeText: "+1,0 ponto",
      },
      {
        id: "crescimento",
        label: "15º Salário (Crescimento Pedagógico)",
        shortLabel: "15º Crescimento",
        subtext: "Avanço no indicador em relação ao ciclo anterior (> 0)",
        value: idebDetalhes.crescimento,
        pctOfIdeb: Number(((idebDetalhes.crescimento / idebTotal) * 100).toFixed(1)),
        pctOfRede: totalRede > 0 ? Number(((idebDetalhes.crescimento / totalRede) * 100).toFixed(1)) : 0,
        color: "#2563eb", // Blue
        icon: TrendingUp,
        badgeText: "Taxa apurada",
      },
      {
        id: "destaque_ri",
        label: "16º Salário (Destaque Regional por RI)",
        shortLabel: "16º Destaque RI",
        subtext: "Prêmio de excelência regional por Região de Integração",
        value: idebDetalhes.destaque_ri,
        pctOfIdeb: Number(((idebDetalhes.destaque_ri / idebTotal) * 100).toFixed(1)),
        pctOfRede: totalRede > 0 ? Number(((idebDetalhes.destaque_ri / totalRede) * 100).toFixed(1)) : 0,
        color: "#d97706", // Amber
        icon: Star,
        badgeText: "+1,0 bônus",
      },
      {
        id: "fluxo",
        label: "Rendimento Escolar (Fluxo)",
        shortLabel: "Fluxo",
        subtext: "Componente de aprovação e permanência escolar da unidade",
        value: idebDetalhes.fluxo,
        pctOfIdeb: Number(((idebDetalhes.fluxo / idebTotal) * 100).toFixed(1)),
        pctOfRede: totalRede > 0 ? Number(((idebDetalhes.fluxo / totalRede) * 100).toFixed(1)) : 0,
        color: "#475569", // Slate
        icon: Activity,
        badgeText: "Índice censitário",
      },
    ];

    return components;
  }, [idebDetalhes, idebItem, totalRede]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-32 bg-slate-100 rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-xl border border-slate-200" />
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
            Falha ao carregar consolidação analítica da bonificação
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Recarregar dados
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── 1. Header Card Institucional ────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 text-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-48 bottom-0 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-sky-300 border border-white/10 backdrop-blur-xs">
              <PieIcon className="w-3.5 h-3.5" />
              <span>Exercício {data?.exercicio || "2025"} • Relatório Executivo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Distribuição Global da Bonificação
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consolidação analítica do volume total de pontos apurados na rede estadual por
              modalidade, em estrita conformidade com a{" "}
              <strong className="text-white font-semibold">
                {data?.base_legal || "Lei Estadual nº 10.435/2024"}
              </strong>
              .
            </p>
          </div>

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
                <span>Visão Integral da Rede Estadual (100%)</span>
              </div>
            )}

            <div className="text-xs text-slate-400 sm:text-right">
              Volume total:{" "}
              <strong className="text-white font-mono font-bold text-sm">
                {totalRede.toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 2,
                })}
              </strong>{" "}
              pontos homologados
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. Quatro Cards Executivos de Síntese ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {slicesWithAngles.map((item) => {
          const Icon = item.config.icon;
          const isHovered = hoveredSliceId === item.id;

          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredSliceId(item.id)}
              onMouseLeave={() => setHoveredSliceId(null)}
              onClick={() => {
                if (item.id === "ideb") setIdebExpanded((prev) => !prev);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (item.id === "ideb") setIdebExpanded((prev) => !prev);
                }
              }}
              title={
                item.id === "ideb"
                  ? "Clique para alternar o micrográfico do IDEB"
                  : item.descricao
              }
              className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                isHovered
                  ? "ring-2 shadow-md translate-y-[-1px]"
                  : "border-slate-200/80 shadow-xs hover:border-slate-300"
              }`}
              style={{
                borderColor: isHovered ? item.config.color : undefined,
                boxShadow: isHovered
                  ? `0 4px 12px ${item.config.color}20`
                  : undefined,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold tracking-wider uppercase"
                  style={{ color: item.config.color }}
                >
                  {item.nome}
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.config.bgBadge}`}
                  style={{ color: item.config.color }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="my-3 flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                  {item.valor.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border tabular-nums ${item.config.bgBadge} ${item.config.borderBadge}`}
                  style={{ color: item.config.color }}
                >
                  {item.percent}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{item.descricao}</span>
                {item.id === "ideb" && (
                  <span className="shrink-0 font-semibold text-sky-700 ml-1">
                    {idebExpanded ? "▲" : "▼"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 3. Bloco Principal: Donut SVG + Painel Analítico ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Coluna Esquerda: Donut SVG Matemático */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-sky-600" />
                <span>Donut Analítico da Rede</span>
              </h3>
              <p className="text-xs text-slate-500">
                Proporção ponderada de cada modalidade no teto apurado
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              SVG Nativo
            </span>
          </div>

          {/* Área do SVG Matemático */}
          <div className="relative my-4 flex items-center justify-center min-h-[300px]">
            {totalRede > 0 ? (
              <svg
                viewBox="0 0 320 320"
                className="w-full max-w-[300px] h-auto overflow-visible select-none"
              >
                <defs>
                  <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow
                      dx="0"
                      dy="4"
                      stdDeviation="5"
                      floodColor="#0f172a"
                      floodOpacity="0.18"
                    />
                  </filter>
                </defs>

                {/* Segmentos de Arco do Donut SVG */}
                <g>
                  {slicesWithAngles.map((slice) => {
                    const isHovered = hoveredSliceId === slice.id;
                    const innerRadius = isHovered ? 82 : 86;
                    const outerRadius = isHovered ? 138 : 132;
                    const pathData = describeArc(
                      160,
                      160,
                      innerRadius,
                      outerRadius,
                      slice.startAngle,
                      slice.endAngle
                    );

                    return (
                      <path
                        key={slice.id}
                        d={pathData}
                        fill={slice.config.color}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        filter={isHovered ? "url(#donut-shadow)" : undefined}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredSliceId(slice.id)}
                        onMouseLeave={() => setHoveredSliceId(null)}
                        onClick={() => {
                          if (slice.id === "ideb") setIdebExpanded((prev) => !prev);
                        }}
                        style={{
                          opacity:
                            hoveredSliceId === null || isHovered ? 1 : 0.45,
                          transformOrigin: "160px 160px",
                        }}
                      />
                    );
                  })}
                </g>

                {/* Centro do Donut: Métricas e Indicador */}
                <circle cx="160" cy="160" r="76" fill="#ffffff" />
                <text
                  x="160"
                  y="138"
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-400 uppercase tracking-wider"
                >
                  {activeSlice ? activeSlice.nome : "TOTAL DA REDE"}
                </text>
                <text
                  x="160"
                  y="166"
                  textAnchor="middle"
                  className="text-2xl font-bold font-mono fill-slate-900 tabular-nums"
                >
                  {activeSlice
                    ? activeSlice.valor.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })
                    : totalRede.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })}
                </text>
                <text
                  x="160"
                  y="186"
                  textAnchor="middle"
                  className="text-xs font-semibold fill-slate-500 tabular-nums"
                >
                  {activeSlice ? `${activeSlice.percent}% da rede` : "pontos apurados"}
                </text>
              </svg>
            ) : (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-medium">Nenhum ponto apurado no recorte</p>
              </div>
            )}
          </div>

          {/* Legenda Horizontal com Seletor Interativo */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
            {slicesWithAngles.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setHoveredSliceId(item.id)}
                onMouseLeave={() => setHoveredSliceId(null)}
                onClick={() => {
                  if (item.id === "ideb") setIdebExpanded((prev) => !prev);
                }}
                className={`flex items-center justify-between text-xs p-2 rounded-lg transition-colors cursor-pointer border ${
                  hoveredSliceId === item.id
                    ? "bg-slate-50 border-slate-300 font-semibold"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.config.color }}
                  />
                  <span className="text-slate-700 truncate">{item.nome}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 ml-1 shrink-0">
                  {item.percent}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Coluna Direita: Detalhamento Analítico + Micrográfico Expansível do IDEB */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-600" />
                <span>Discriminação das Modalidades</span>
              </h3>
              <p className="text-xs text-slate-500">
                Detalhamento dos valores e micrográfico de desdobramento do IDEB
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded">
              Base: 100,0%
            </span>
          </div>

          <div className="space-y-3.5">
            {slicesWithAngles.map((item) => {
              const isHovered = hoveredSliceId === item.id;
              const isIdeb = item.id === "ideb";

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredSliceId(item.id)}
                  onMouseLeave={() => setHoveredSliceId(null)}
                  className={`p-3.5 rounded-xl border transition-all duration-150 ${
                    isHovered
                      ? "bg-slate-50/90 border-slate-300 shadow-2xs"
                      : "bg-white border-slate-150 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-md shrink-0"
                        style={{ backgroundColor: item.config.color }}
                      />
                      <span className="text-sm font-bold text-slate-900">
                        {item.nome}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {item.valor.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border tabular-nums ${item.config.bgBadge} ${item.config.borderBadge}`}
                        style={{ color: item.config.color }}
                      >
                        {item.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Barra Proporcional */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, item.percent))}%`,
                        backgroundColor: item.config.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.descricao}</span>
                    {isIdeb && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIdebExpanded((prev) => !prev);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900 transition-colors ml-2 shrink-0 cursor-pointer text-xs"
                      >
                        <span>{idebExpanded ? "Ocultar 4 pilares" : "Ver 4 pilares"}</span>
                        {idebExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* ─── MICROGRÁFICO EXPANSÍVEL DO IDEB (REGULAR) ────────────── */}
                  {isIdeb && idebExpanded && idebSubComponents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-bold flex items-center gap-1 text-slate-800">
                          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                          <span>Micrográfico de Desdobramento dos 4 Pilares do IDEB</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Total IDEB:{" "}
                          <strong className="font-mono font-semibold text-slate-800">
                            {item.valor.toLocaleString("pt-BR")} pts
                          </strong>
                        </span>
                      </div>

                      {/* Barra Segmentada de Composição do IDEB */}
                      <div className="w-full h-3 bg-slate-100 rounded-md overflow-hidden flex shadow-2xs">
                        {idebSubComponents.map((sub) => (
                          <div
                            key={sub.id}
                            title={`${sub.label}: ${sub.value.toLocaleString("pt-BR")} pts (${sub.pctOfIdeb}% do IDEB)`}
                            style={{
                              width: `${sub.pctOfIdeb}%`,
                              backgroundColor: sub.color,
                            }}
                            className="h-full transition-all duration-300 hover:brightness-110"
                          />
                        ))}
                      </div>

                      {/* 4 Cards de Detalhamento dos Pilares */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {idebSubComponents.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <div
                              key={sub.id}
                              className="bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-2xs"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: sub.color }}
                                  />
                                  <strong className="text-slate-800 truncate text-[11px]">
                                    {sub.shortLabel}
                                  </strong>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                                  {sub.badgeText}
                                </span>
                              </div>

                              <div className="my-1.5 flex items-baseline justify-between">
                                <span className="font-mono font-bold text-slate-900 text-sm">
                                  {sub.value.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 1,
                                    maximumFractionDigits: 2,
                                  })}
                                </span>
                                <div className="flex items-center gap-1 text-[11px]">
                                  <span className="font-bold text-slate-700">
                                    {sub.pctOfIdeb}%
                                  </span>
                                  <span className="text-slate-400">do IDEB</span>
                                </div>
                              </div>

                              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${sub.pctOfIdeb}%`,
                                    backgroundColor: sub.color,
                                  }}
                                />
                              </div>

                              <p className="text-[10px] text-slate-400 truncate" title={sub.subtext}>
                                {sub.subtext}
                              </p>
                            </div>
                          );
                        })}
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
            Base Normativa e Regras Oficiais de Apuração ({data?.base_legal || "Lei Estadual nº 10.435/2024"}):
          </strong>
          <p className="leading-relaxed">
            O volume total de bonificação ({totalRede.toLocaleString("pt-BR")} pts) é apurado a partir
            do ciclo <strong>IDEB Regular</strong> (meta pactuada de +1,0 ponto, avanço pedagógico positivo,
            destaque regional homologado de +1,0 e fluxo censitário), dos fatores concedidos à{" "}
            <strong>Alfabetização</strong> (1º e 2º ano) e das modalidades especiais de{" "}
            <strong>EJA</strong> (Iniciais, Finais e Médio) e <strong>AEE</strong> (Atendimento Educacional Especializado).
          </p>
        </div>
      </footer>
    </div>
  );
}
