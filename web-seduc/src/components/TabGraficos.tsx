"use client";

import { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from "recharts";
import {
  School,
  AlertCircle,
  Award,
  BookOpen,
  Layers,
  Building2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Filter,
} from "lucide-react";
import type { DashboardGraficosData } from "@/lib/types";

interface TabGraficosProps {
  dre?: string;
  regiaoIntegracao?: string;
  onSelectEscola?: (codigo: string, etapa?: string | null) => void;
}

type EtapaFiltroIdeb = "TODAS" | "ANOS_INICIAIS" | "ANOS_FINAIS" | "MEDIO";
type VisaoSaeb = "TOP10_MAIORES" | "TOP10_MENORES" | "TODAS";

export default function TabGraficos({
  dre = "",
  regiaoIntegracao = "",
  onSelectEscola,
}: TabGraficosProps) {
  const [data, setData] = useState<DashboardGraficosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bloco 2: Seletor de Etapa no gráfico horizontal de IDEB por DRE
  const [etapaFiltro, setEtapaFiltro] = useState<EtapaFiltroIdeb>("TODAS");

  // Bloco 2: Seletor de visualização SAEB (LP vs Matemática)
  const [visaoSaeb, setVisaoSaeb] = useState<VisaoSaeb>("TOP10_MAIORES");

  // Bloco 3: Filtro e Paginação do Painel de Destaques (16º Salário)
  const [filtroRiDestaque, setFiltroRiDestaque] = useState<string>("TODAS");
  const [paginaDestaques, setPaginaDestaques] = useState<number>(1);
  const ITENS_POR_PAGINA_DESTAQUES = 6;

  // Carregar dados agregados do PostgreSQL com consultas parametrizadas
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (dre.trim()) params.set("dre", dre.trim());
      if (regiaoIntegracao.trim()) params.set("regiao_integracao", regiaoIntegracao.trim());

      const url = params.toString() ? `/api/graficos?${params.toString()}` : "/api/graficos";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Falha ao carregar indicadores agregados do servidor.");
      }
      const json: DashboardGraficosData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("Erro ao buscar gráficos:", err);
      setError(err?.message || "Erro de conexão ao carregar painel.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setPaginaDestaques(1);
  }, [dre, regiaoIntegracao]);

  // BLOCO 2: Processamento dos dados de IDEB por DRE com o seletor de etapa
  const dadosIdebDreFiltrados = useMemo(() => {
    if (!data?.ideb?.porDre) return [];

    if (etapaFiltro === "TODAS") {
      const mapaDre = new Map<string, { soma: number; count: number; fluxo: number }>();
      data.ideb.porDre.forEach((item) => {
        const d = item.dre;
        const current = mapaDre.get(d) || { soma: 0, count: 0, fluxo: item.fluxo };
        mapaDre.set(d, {
          soma: current.soma + Number(item.mediaIdeb),
          count: current.count + 1,
          fluxo: item.fluxo || current.fluxo,
        });
      });

      return Array.from(mapaDre.entries())
        .map(([d, val]) => ({
          dre: d,
          mediaIdeb: Number((val.soma / (val.count || 1)).toFixed(2)),
          fluxo: val.fluxo,
        }))
        .sort((a, b) => b.mediaIdeb - a.mediaIdeb);
    }

    let etapaAlvo = "";
    if (etapaFiltro === "ANOS_INICIAIS") etapaAlvo = "ENSINO FUNDAMENTAL ANOS INICIAIS";
    if (etapaFiltro === "ANOS_FINAIS") etapaAlvo = "ENSINO FUNDAMENTAL ANOS FINAIS";
    if (etapaFiltro === "MEDIO") etapaAlvo = "ENSINO MEDIO";

    return data.ideb.porDre
      .filter((item) => !item.etapa || item.etapa === etapaAlvo)
      .map((item) => ({
        dre: item.dre,
        mediaIdeb: Number(item.mediaIdeb),
        fluxo: item.fluxo,
      }))
      .sort((a, b) => b.mediaIdeb - a.mediaIdeb);
  }, [data, etapaFiltro]);

  // BLOCO 2: Processamento dos dados de proficiência SAEB com o seletor Top 10 / Todas
  const dadosSaebFiltrados = useMemo(() => {
    if (!data?.ideb?.proficienciaDre) return [];
    const lista = [...data.ideb.proficienciaDre];

    if (visaoSaeb === "TOP10_MAIORES") {
      return lista
        .sort((a, b) => (b.lp + b.mat) / 2 - (a.lp + a.mat) / 2)
        .slice(0, 10);
    }

    if (visaoSaeb === "TOP10_MENORES") {
      return lista
        .sort((a, b) => (a.lp + a.mat) / 2 - (b.lp + b.mat) / 2)
        .slice(0, 10);
    }

    return lista.sort((a, b) => a.dre.localeCompare(b.dre));
  }, [data, visaoSaeb]);

  // BLOCO 3: RIs canônicas presentes para o filtro da tabela de destaques do 16º
  const listaRIs = useMemo(() => {
    if (!data?.regioesIntegracao?.destaques16) return [];
    return Array.from(
      new Set(data.regioesIntegracao.destaques16.map((d) => d.ri).filter(Boolean))
    ).sort();
  }, [data]);

  const destaquesFiltrados = useMemo(() => {
    if (!data?.regioesIntegracao?.destaques16) return [];
    if (filtroRiDestaque === "TODAS") return data.regioesIntegracao.destaques16;
    return data.regioesIntegracao.destaques16.filter((d) => d.ri === filtroRiDestaque);
  }, [data, filtroRiDestaque]);

  const totalPaginasDestaques = Math.ceil(
    (destaquesFiltrados.length || 1) / ITENS_POR_PAGINA_DESTAQUES
  );

  const destaquesPaginados = useMemo(() => {
    const inicio = (paginaDestaques - 1) * ITENS_POR_PAGINA_DESTAQUES;
    return destaquesFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA_DESTAQUES);
  }, [destaquesFiltrados, paginaDestaques]);

  // Escala dinâmica para o gráfico de Potencial de Bonificação Salarial
  const maxQtdBonificacao = useMemo(() => {
    if (!data?.metaCrescimento?.matriz?.length) return 400;
    const maxVal = Math.max(...data.metaCrescimento.matriz.map((m) => m.quantidade), 5);
    return Math.max(Math.ceil((maxVal * 1.15) / 5) * 5, 5);
  }, [data]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-slate-200/60 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-80 bg-slate-200/60 rounded-xl" />
          <div className="h-80 bg-slate-200/60 rounded-xl" />
        </div>
        <div className="h-96 bg-slate-200/60 rounded-xl" />
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-rose-900">Erro ao carregar indicadores</h3>
        <p className="text-sm text-rose-700 mt-1">{error || "Falha na conexão com o banco de dados."}</p>
        <button
          onClick={fetchData}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white text-rose-700 border border-rose-300 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Tentar Novamente</span>
        </button>
      </div>
    );
  }

  const { resumo, situacaoRede, metaCrescimento, ideb, regioesIntegracao, modalidadesEPontos } = data;
  const temFiltroAtivo = Boolean(dre || regiaoIntegracao);

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Indicador de Filtro Ativo quando aplicado no cabeçalho global */}
      {temFiltroAtivo && (
        <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200 rounded-xl px-4 py-2.5 text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold">Filtros Globais Ativos no Painel:</span>
            {dre && (
              <span className="bg-white border border-indigo-200 px-2 py-0.5 rounded font-medium text-indigo-800">
                DRE: {dre}
              </span>
            )}
            {regiaoIntegracao && (
              <span className="bg-white border border-indigo-200 px-2 py-0.5 rounded font-medium text-indigo-800">
                RI: {regiaoIntegracao}
              </span>
            )}
          </div>
          <span className="text-[11px] text-indigo-600">Indicadores recalculados em tempo real</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BLOCO 1: PANORÂMICA DA REDE & REGRAS DO 14º E 15º SALÁRIO */}
      {/* ========================================================================= */}
      <section aria-labelledby="bloco-1-titulo" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 id="bloco-1-titulo" className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Panorâmica da Rede & Regras do 14º e 15º Salário
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">SEDUC-PA / SECTET 2025</span>
        </div>

        {/* Única Fileira Limpa de Cards de KPI Minimalistas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Escolas
              </span>
              <School className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{resumo.totalEscolas.toLocaleString("pt-BR")}</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">100% da rede</span>
          </div>

          <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                Publicadas
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700">
              {resumo.publicadas.toLocaleString("pt-BR")}{" "}
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                {resumo.percentualPublicadas}%
              </span>
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Aptas para bonificação</span>
          </div>

          <div className="bg-white border border-rose-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-rose-600 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
                Não Publicadas
              </span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold text-rose-700">
              {resumo.naoPublicadas}{" "}
              <span className="text-xs font-medium text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded">
                {resumo.percentualNaoPublicadas}%
              </span>
            </p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Pendência de fluxo</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                EJA / AEE
              </span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{resumo.registrosEjaAee.toLocaleString("pt-BR")}</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Unidades com oferta</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Regiões (RI)
              </span>
              <Layers className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{resumo.totalRegioesIntegracao}</p>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Regiões integradas</span>
          </div>
        </div>

        {/* Grid de 2 Colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Esquerda: Donut Chart Minimalista (Composição da Rede) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Composição da Rede</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proporção de escolas publicadas versus sob pendência de fluxo
              </p>
            </div>

            <div className="h-60 my-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${Number(val).toLocaleString("pt-BR")} escolas`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Pie
                    data={situacaoRede}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={86}
                    paddingAngle={3}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  >
                    {situacaoRede.map((entry, idx) => (
                      <Cell
                        key={`donut-${idx}`}
                        fill={entry.nome === "Publicadas" ? "#059669" : "#E11D48"}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centro do donut: 92% Publicadas */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-slate-900">
                  {Math.round(resumo.percentualPublicadas)}%
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">
                  Publicadas
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="text-slate-700 font-medium">
                  Publicadas ({resumo.publicadas} - {resumo.percentualPublicadas}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span className="text-slate-700 font-medium">
                  Não Publicadas ({resumo.naoPublicadas} - {resumo.percentualNaoPublicadas}%)
                </span>
              </div>
            </div>
          </div>

          {/* Direita: Barras Horizontais / Matriz de Bonificação */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Potencial de Bonificação Salarial</h3>
                <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                  {resumo.publicadas.toLocaleString("pt-BR")} {resumo.publicadas === 1 ? "Escola" : "Escolas"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Classificação legal pelo cumprimento da Meta Pactuada e Crescimento de Aprendizagem
              </p>
            </div>

            <div className="h-60 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metaCrescimento.matriz}
                  layout="vertical"
                  margin={{ top: 8, right: 28, left: 10, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    domain={[0, maxQtdBonificacao]}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="impactoSalario"
                    type="category"
                    tick={{ fontSize: 10, fill: "#334155", fontWeight: 500 }}
                    width={130}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                    formatter={(val: any, _, item: any) => [
                      `${Number(val).toLocaleString("pt-BR")} escolas (${item?.payload?.percentual}%)`,
                      item?.payload?.categoria,
                    ]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#CBD5E1",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                    {metaCrescimento.matriz.map((entry, index) => {
                      let color = "#94A3B8";
                      if (entry.categoria.includes("14º e 15º")) color = "#059669";
                      else if (entry.categoria.includes("Apenas 15º")) color = "#334155";
                      else if (entry.categoria.includes("Apenas 14º")) color = "#0D9488";
                      return <Cell key={`bar-meta-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600 shrink-0" />
                <span className="text-slate-700 font-medium">
                  14º e 15º Salário (Meta + Crescimento):
                </span>
                <span className="text-slate-500 font-semibold ml-auto">
                  {(metaCrescimento.matriz[0]?.quantidade ?? 0).toLocaleString("pt-BR")} ({metaCrescimento.matriz[0]?.percentual ?? 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-700 shrink-0" />
                <span className="text-slate-700 font-medium">
                  Apenas 15º Salário (Crescimento sem bater Meta):
                </span>
                <span className="text-slate-500 font-semibold ml-auto">
                  {(metaCrescimento.matriz[1]?.quantidade ?? 0).toLocaleString("pt-BR")} ({metaCrescimento.matriz[1]?.percentual ?? 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-teal-600 shrink-0" />
                <span className="text-slate-700 font-medium">
                  Apenas 14º Salário (Meta batida com Crescimento nulo):
                </span>
                <span className="text-slate-500 font-semibold ml-auto">
                  {(metaCrescimento.matriz[2]?.quantidade ?? 0).toLocaleString("pt-BR")} ({metaCrescimento.matriz[2]?.percentual ?? 0}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-400 shrink-0" />
                <span className="text-slate-700 font-medium">
                  Sem Bonificação Extra:
                </span>
                <span className="text-slate-500 font-semibold ml-auto">
                  {(metaCrescimento.matriz[3]?.quantidade ?? 0).toLocaleString("pt-BR")} ({metaCrescimento.matriz[3]?.percentual ?? 0}%)
                </span>
              </div>
            </div>

            <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded text-[10.5px] text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Auditoria Pedagógica:</span>{" "}
              {temFiltroAtivo ? (
                <>
                  No recorte selecionado ({resumo.publicadas.toLocaleString("pt-BR")} escolas publicadas),{" "}
                  {((metaCrescimento.matriz[0]?.quantidade ?? 0) + (metaCrescimento.matriz[2]?.quantidade ?? 0)).toLocaleString("pt-BR")} alcançaram a meta pactuada (14º Salário), sendo {(metaCrescimento.matriz[0]?.quantidade ?? 0).toLocaleString("pt-BR")} cumulativas com evolução pedagógica (15º Salário).
                </>
              ) : (
                <>
                  Na rede, 271 escolas alcançaram a meta pactuada (14º); destas, 270 também evoluíram pedagogicamente (acumulando o 15º). Apenas 1 escola alcançou a meta com crescimento nulo.
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOCO 2: DIAGNÓSTICO PEDAGÓGICO DO IDEB */}
      {/* ========================================================================= */}
      <section aria-labelledby="bloco-2-titulo" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h2 id="bloco-2-titulo" className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Diagnóstico Pedagógico do IDEB
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Resultados Oficiais SAEB</span>
        </div>

        {/* 1. Gráfico de Barras Verticais: Média do IDEB por Etapa de Ensino (Escala 0 a 10, maxBarSize={48}) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Média do IDEB por Etapa de Ensino</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Índice de Desenvolvimento da Educação Básica por ciclo formativo (escala de 0 a 10)
              </p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
              Escala 0–10
            </span>
          </div>

          <div className="h-56 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ideb.porEtapa.map((e) => ({
                  ...e,
                  etapaFormatada: e.etapa
                    .replace("ENSINO FUNDAMENTAL ", "EF ")
                    .replace("ENSINO MEDIO", "Ensino Médio")
                    .replace("ANOS INICIAIS", "Anos Iniciais (3º ao 5º)")
                    .replace("ANOS FINAIS", "Anos Finais (6º ao 9º)"),
                }))}
                margin={{ top: 12, right: 16, left: -10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="etapaFormatada" tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: "#64748B" }} />
                <Tooltip
                  cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} pontos`, "IDEB Médio"]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar dataKey="mediaIdeb" fill="#1E293B" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {ideb.porEtapa.map((_, index) => (
                    <Cell key={`etapa-bar-${index}`} fill="#1E293B" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Gráfico de Barras Horizontais com Seletor de Etapa: IDEB Consolidado por DRE */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">IDEB Consolidado por DRE</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Desempenho por Diretoria Regional com ordenação decrescente e layout horizontal legível
              </p>
            </div>

            {/* Botões de alternância: [Todas | Anos Iniciais | Anos Finais | Ensino Médio] */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setEtapaFiltro("TODAS")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  etapaFiltro === "TODAS"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setEtapaFiltro("ANOS_INICIAIS")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  etapaFiltro === "ANOS_INICIAIS"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Anos Iniciais
              </button>
              <button
                type="button"
                onClick={() => setEtapaFiltro("ANOS_FINAIS")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  etapaFiltro === "ANOS_FINAIS"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Anos Finais
              </button>
              <button
                type="button"
                onClick={() => setEtapaFiltro("MEDIO")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  etapaFiltro === "MEDIO"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Ensino Médio
              </button>
            </div>
          </div>

          {/* Gráfico Horizontal com YAxis width={160} e tick fontSize 11 */}
          <div className="h-[460px] overflow-y-auto pr-2">
            <ResponsiveContainer width="100%" height={Math.max(420, dadosIdebDreFiltrados.length * 24)}>
              <BarChart
                data={dadosIdebDreFiltrados}
                layout="vertical"
                margin={{ top: 4, right: 32, left: 16, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{ fontSize: 10.5, fill: "#64748B" }}
                />
                <YAxis
                  dataKey="dre"
                  type="category"
                  tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
                  width={160}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                  formatter={(val: any, _, item: any) => [
                    `${Number(val).toFixed(2)} (Fluxo: ${item?.payload?.fluxo ?? "1.00"})`,
                    "IDEB",
                  ]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                />
                <ReferenceLine x={4.8} stroke="#E11D48" strokeDasharray="3 3" />
                <Bar dataKey="mediaIdeb" radius={[0, 3, 3, 0]}>
                  {dadosIdebDreFiltrados.map((entry, idx) => {
                    const isFiltrada = dre && entry.dre === dre.toUpperCase().trim();
                    return (
                      <Cell
                        key={`bar-dre-${idx}`}
                        fill={isFiltrada ? "#059669" : "#334155"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-2">
            <span>Linha pontilhada vermelha: referência estadual média (~4.80)</span>
            <span>Total: {dadosIdebDreFiltrados.length} Diretorias Regionais</span>
          </div>
        </div>

        {/* 3. Card Comparativo de Proficiência (LP vs Matemática) na Escala SAEB (200-300) com Seletor Top 10 / Todas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Comparativo de Proficiência SAEB (LP vs Matemática)
                </h3>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                  Eixo SAEB 200–300
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pontuação média padronizada por DRE (mantida isolada da nota de 0 a 10 do IDEB)
              </p>
            </div>

            {/* Seletor simples: [Top 10 Maiores | Top 10 Menores | Todas as DREs (Scroll Horizontal)] */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setVisaoSaeb("TOP10_MAIORES")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  visaoSaeb === "TOP10_MAIORES"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top 10 Maiores
              </button>
              <button
                type="button"
                onClick={() => setVisaoSaeb("TOP10_MENORES")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  visaoSaeb === "TOP10_MENORES"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top 10 Menores
              </button>
              <button
                type="button"
                onClick={() => setVisaoSaeb("TODAS")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  visaoSaeb === "TODAS"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Todas as DREs (Scroll Horizontal)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 text-xs mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-800" />
              <span className="text-slate-700 font-medium">Língua Portuguesa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-400" />
              <span className="text-slate-700 font-medium">Matemática</span>
            </div>
          </div>

          {/* Gráfico responsivo ou com scroll horizontal quando 'Todas' */}
          {visaoSaeb === "TODAS" ? (
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[1400px] h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosSaebFiltrados}
                    margin={{ top: 12, right: 16, left: -10, bottom: 42 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis
                      dataKey="dre"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 10, fill: "#475569" }}
                      height={55}
                    />
                    <YAxis domain={[200, 300]} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <Tooltip
                      cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                      formatter={(val: any, name: any) => [
                        `${Number(val).toFixed(1)} pontos`,
                        name === "lp" ? "Língua Portuguesa" : "Matemática",
                      ]}
                      contentStyle={{
                        backgroundColor: "#FFFFFF",
                        borderColor: "#E2E8F0",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar dataKey="lp" name="lp" fill="#1E293B" radius={[2, 2, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="mat" name="mat" fill="#94A3B8" radius={[2, 2, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosSaebFiltrados}
                  margin={{ top: 12, right: 16, left: -10, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="dre"
                    tick={{ fontSize: 10, fill: "#475569" }}
                    height={40}
                  />
                  <YAxis domain={[200, 300]} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                    formatter={(val: any, name: any) => [
                      `${Number(val).toFixed(1)} pontos`,
                      name === "lp" ? "Língua Portuguesa" : "Matemática",
                    ]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar dataKey="lp" name="lp" fill="#1E293B" radius={[2, 2, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="mat" name="mat" fill="#94A3B8" radius={[2, 2, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOCO 3: REGIÕES DE INTEGRAÇÃO & DESTAQUES DO 16º SALÁRIO */}
      {/* ========================================================================= */}
      <section aria-labelledby="bloco-3-titulo" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h2 id="bloco-3-titulo" className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Regiões de Integração & Destaques do 16º Salário
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">12 RIs do Pará</span>
        </div>

        {/* 1. Gráfico de Barras Horizontais: Média do IDEB por Região de Integração (12 RIs) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Média do IDEB por Região de Integração (12 RIs)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Classificação regional ponderada (barras monocromáticas institucionais em tom ardósia)
              </p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded font-medium">
              Linha: Média Estadual (~4.80)
            </span>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regioesIntegracao.porRi}
                layout="vertical"
                margin={{ top: 8, right: 28, left: 16, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[3.5, 6.0]}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                />
                <YAxis
                  dataKey="ri"
                  type="category"
                  tick={{ fontSize: 11, fill: "#334155", fontWeight: 500 }}
                  width={140}
                />
                <Tooltip
                  cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} pontos`, "IDEB Médio da Região"]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                  }}
                />
                <ReferenceLine x={4.8} stroke="#E11D48" strokeDasharray="3 3" />
                <Bar dataKey="mediaIdeb" fill="#334155" radius={[0, 4, 4, 0]}>
                  {regioesIntegracao.porRi.map((entry, index) => {
                    const isRiFiltrada =
                      regiaoIntegracao && entry.ri === regiaoIntegracao.toUpperCase().trim();
                    return (
                      <Cell
                        key={`ri-bar-${index}`}
                        fill={isRiFiltrada ? "#059669" : "#334155"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Painel de Destaques Regionais (Prêmio de Excelência - 16º Salário) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  Painel de Destaques Regionais (Prêmio de Excelência — 16º Salário)
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  16º Salário
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Escolas com Maior Desempenho e Maior Crescimento em cada Região de Integração e Etapa
              </p>
            </div>

            {/* Filtro por RI corrigido para as 12 Regiões */}
            <div className="flex items-center gap-2">
              <label htmlFor="select-ri-filtro" className="text-xs font-medium text-slate-600">
                Região:
              </label>
              <select
                id="select-ri-filtro"
                value={filtroRiDestaque}
                onChange={(e) => {
                  setFiltroRiDestaque(e.target.value);
                  setPaginaDestaques(1);
                }}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-slate-400 outline-none cursor-pointer"
              >
                <option value="TODAS">Todas as Regiões ({listaRIs.length})</option>
                {listaRIs.map((ri) => (
                  <option key={ri} value={ri}>
                    {ri}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela com Coluna 'Índice / Desempenho' corrigida */}
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Região de Integração</th>
                  <th className="py-2.5 px-3">Etapa</th>
                  <th className="py-2.5 px-3">Índice / Desempenho (Escola + Índice)</th>
                  <th className="py-2.5 px-3">Maior Crescimento (Escola + Taxa)</th>
                  <th className="py-2.5 px-3 text-center">Benefício</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {destaquesPaginados.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {item.ri}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.etapa
                          ? item.etapa
                              .replace("ENSINO FUNDAMENTAL ", "EF ")
                              .replace("ENSINO MEDIO", "MÉDIO")
                              .replace("ANOS INICIAIS", "INICIAIS")
                              .replace("ANOS FINAIS", "FINAIS")
                          : "Geral"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <p
                          className="font-medium text-slate-800 line-clamp-1 cursor-pointer hover:text-indigo-600"
                          onClick={() =>
                            item.escolaMaiorIdeb.inep &&
                            onSelectEscola?.(item.escolaMaiorIdeb.inep, item.etapa)
                          }
                          title={item.escolaMaiorIdeb.nome}
                        >
                          {item.escolaMaiorIdeb.nome || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>INEP: {item.escolaMaiorIdeb.inep || "—"}</span>
                          {item.escolaMaiorIdeb.valor > 0 && (
                            <span className="font-semibold text-emerald-700 bg-emerald-50 px-1 rounded">
                              Índice: {item.escolaMaiorIdeb.valor.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div>
                        <p
                          className="font-medium text-slate-800 line-clamp-1 cursor-pointer hover:text-indigo-600"
                          onClick={() =>
                            item.escolaMaiorCrescimento.inep &&
                            onSelectEscola?.(item.escolaMaiorCrescimento.inep, item.etapa)
                          }
                          title={item.escolaMaiorCrescimento.nome}
                        >
                          {item.escolaMaiorCrescimento.nome || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span>INEP: {item.escolaMaiorCrescimento.inep || "—"}</span>
                          {item.escolaMaiorCrescimento.valor > 0 && (
                            <span className="font-semibold text-slate-800 bg-slate-100 px-1 rounded">
                              +{item.escolaMaiorCrescimento.valor.toFixed(2)} pts
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <Award className="w-3 h-3 text-amber-600" />
                        16º Salário
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação da Tabela de Destaques */}
          {totalPaginasDestaques > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 text-xs text-slate-500">
              <span>
                Página {paginaDestaques} de {totalPaginasDestaques} ({destaquesFiltrados.length} destaques)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={paginaDestaques === 1}
                  onClick={() => setPaginaDestaques((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaDestaques >= totalPaginasDestaques}
                  onClick={() => setPaginaDestaques((p) => Math.min(totalPaginasDestaques, p + 1))}
                  className="px-2.5 py-1 border border-slate-200 rounded bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* BLOCO 4: MODALIDADES ESPECIAIS & PONTOS POR DRE */}
      {/* ========================================================================= */}
      <section aria-labelledby="bloco-4-titulo" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h2 id="bloco-4-titulo" className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Modalidades Especiais & Pontos por DRE
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Bônus Institucional e Inclusão</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. Gráfico de Barras: Distribuição de Unidades EJA e AEE por Regional */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Distribuição de Unidades EJA e AEE por Regional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Número de estabelecimentos de ensino com atendimento especializado ou EJA
                </p>
              </div>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={modalidadesEPontos.ejaAeePorDre.slice(0, 15)}
                  margin={{ top: 8, right: 16, left: -10, bottom: 42 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="dre"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 9.5, fill: "#475569" }}
                    height={55}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                    formatter={(val: any) => [`${val} unidades`, "Total EJA/AEE"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar dataKey="total" fill="#475569" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 text-right">
              Exibindo as 15 regionais com maior concentração
            </p>
          </div>

          {/* 2. Gráfico de Barras: Pontuação Acumulada por Diretoria Regional (DRE) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Pontuação Acumulada por Diretoria Regional (DRE)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pontuação total ponderada da equipe gestora da DRE para o bônus institucional
                </p>
              </div>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-72 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={modalidadesEPontos.pontosPorDre.slice(0, 15)}
                  margin={{ top: 8, right: 16, left: -10, bottom: 42 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="dre"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tick={{ fontSize: 9.5, fill: "#475569" }}
                    height={55}
                  />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
                    formatter={(val: any) => [`${Number(val).toFixed(2)} pontos`, "Bônus Total DRE"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar dataKey="totalPontos" fill="#1E293B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 text-right">
              Exibindo as 15 regionais líderes no índice de bonificação
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
