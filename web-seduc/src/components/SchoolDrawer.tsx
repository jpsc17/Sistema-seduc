"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Building2, GraduationCap, TrendingUp, Award, Star, XCircle, CheckCircle2 } from "lucide-react";
import { formatBonus, formatEtapaEnsino, calcularSalarios, normalizarBonus, LIMITE_BONUS } from "@/lib/utils";
import { EtapaBadge } from "./TabPublicadas";
import InfoTooltip, { TOOLTIP_FATOR_DOCENTE, TOOLTIP_FATOR_ADMIN } from "./InfoTooltip";

interface SchoolDetail {
  codigo_escola: string;
  nome_escola: string;
  municipio: string;
  regional_dre: string | null;
  regiao_integracao: string | null;
  localizacao: string | null;
  escola_indigena: boolean;
  rede: string;
  status_publicacao: string;
  bonus_professor: number | null;
  bonus_administrativo: number | null;
  bonus_eja_iniciais: number | null;
  bonus_eja_finais: number | null;
  bonus_eja_medio: number | null;
  bonus_aee: number | null;
  atingiu_meta: number | null;
  ponto_crescimento: number | null;
  fluxo: number | null;
  etapa_ensino: string | null;
  oferta_alfabetizacao?: boolean;
  meta_alfabetizacao_atingida?: boolean;
  ponto_regiao_integracao?: number | null;
  ponto_alfabetizacao?: number | null;
  elegivel_16_salario?: boolean;
  motivo_16_salario?: string | null;
  status_premiacao_ri?: string | null;
}

interface SchoolDrawerProps {
  codigoEscola: string | null;
  /** Etapa da linha clicada — garante contexto correto no drawer */
  etapa?: string | null;
  onClose: () => void;
}

function BonusBar({
  label,
  value,
  variant,
  tooltip,
  isAlfabetizacao,
}: {
  label: string;
  value: number | null;
  variant?: "docente" | "administrativo";
  tooltip?: string;
  isAlfabetizacao?: boolean;
}) {
  const numVal = Number(value) || 0;
  const { valorLimitado, percentualAtingido } = normalizarBonus(numVal);
  const isTeto = valorLimitado >= LIMITE_BONUS;

  // Tons avermelhados para ausência geral; para alfabetização avaliada com 0,0, tom neutro
  // Tons neutros/corporativos ou verde institucional para valores > 0
  const barColor =
    numVal === 0
      ? isAlfabetizacao
        ? "#94A3B8"
        : "#F43F5E"
      : isTeto
      ? "#D97706"
      : variant === "administrativo"
      ? "#334155"
      : "#059669";

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-800 flex items-center">
          {label}
          {tooltip && <InfoTooltip content={tooltip} align="left" />}
        </span>
        <div className="text-right">
          <span
            className={`text-xs font-bold ${
              numVal > 0 ? "text-slate-900" : isAlfabetizacao ? "text-slate-600" : "text-rose-600"
            }`}
          >
            {formatBonus(value)}
          </span>
          {numVal > 0 && (
            <span className="text-[10px] font-semibold text-slate-500 ml-1.5">
              {isTeto ? "(100% do teto)" : `(${percentualAtingido}% do teto)`}
            </span>
          )}
          {numVal === 0 && (
            <span className={`text-[10px] font-medium ml-1.5 ${isAlfabetizacao ? "text-slate-500" : "text-rose-500"}`}>
              {isAlfabetizacao ? "(Meta não atingida)" : "(Sem bonificação)"}
            </span>
          )}
        </div>
      </div>
      <div className="h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: numVal > 0 ? `${percentualAtingido}%` : isAlfabetizacao ? "0%" : "100%",
            backgroundColor: barColor,
            opacity: numVal === 0 && !isAlfabetizacao ? 0.35 : 1,
          }}
        />
      </div>
    </div>
  );
}

function SalarioCard({
  numero,
  ativo,
  descricao,
  motivo,
  ri,
}: {
  numero: "14" | "15" | "16";
  ativo: boolean;
  descricao: string;
  motivo?: string | null;
  ri?: string | null;
}) {
  const configs = {
    "14": {
      icon: ativo ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-slate-300" />,
      bg: ativo ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200",
      labelColor: ativo ? "text-emerald-700" : "text-slate-400",
      badge: "Componente 14º Salário (Cumprimento de Meta)",
    },
    "15": {
      icon: ativo ? <TrendingUp className="w-4 h-4 text-blue-600" /> : <XCircle className="w-4 h-4 text-slate-300" />,
      bg: ativo ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-200",
      labelColor: ativo ? "text-blue-700" : "text-slate-400",
      badge: "Componente 15º Salário (Evolução Pedagógica)",
    },
    "16": {
      icon: ativo ? <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> : <XCircle className="w-4 h-4 text-slate-300" />,
      bg: ativo ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200",
      labelColor: ativo ? "text-amber-700" : "text-slate-400",
      badge: ativo ? "16º Salário (Destaque RI: +1,0x)" : "16º Salário (Destaque RI)",
    },
  };

  const c = configs[numero];
  return (
    <div className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${c.bg}`}>
      <div className="mt-0.5 shrink-0">{c.icon}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold ${c.labelColor}`}>{c.badge}</p>
        <p className={`text-[11px] ${ativo ? "text-slate-700" : "text-slate-400"}`}>
          {descricao}
        </p>
        {numero === "16" && ativo && motivo && (
          <p className="text-[10px] font-semibold text-amber-700 mt-0.5">
            Critério: {motivo}{ri ? ` — ${ri}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SchoolDrawer({ codigoEscola, etapa, onClose }: SchoolDrawerProps) {
  const [escola, setEscola] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!codigoEscola) {
      setEscola(null);
      return;
    }
    setLoading(true);
    // Passa etapa como query param para obter os dados corretos da etapa clicada
    const params = new URLSearchParams();
    if (etapa) params.set("etapa", etapa);
    const url = `/api/escolas/${codigoEscola}${params.toString() ? `?${params.toString()}` : ""}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setEscola(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [codigoEscola, etapa]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!codigoEscola) return null;

  const isAlfabetizacao =
    escola?.oferta_alfabetizacao === true ||
    escola?.etapa_ensino?.includes("ALFABETIZA") ||
    escola?.etapa_ensino?.includes("1º e 2º");
  const metaAtingida = escola?.atingiu_meta !== null && Number(escola?.atingiu_meta) >= 1;
  const etapaFormatada = formatEtapaEnsino(escola?.etapa_ensino);
  const salarios = escola ? calcularSalarios(escola) : { tem14: false, tem15: false, tem16: false };

  const totalAcumulado = Math.min(
    Math.max(Number(escola?.bonus_professor) || 0, Number(escola?.bonus_administrativo) || 0),
    LIMITE_BONUS
  );
  const pctTotal = Math.round((totalAcumulado / LIMITE_BONUS) * 100);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto border-l border-[#E2E8F0] animate-in slide-in-from-right duration-200">
        {/* Header (#A71B2B) */}
        <div className="sticky top-0 bg-[#A71B2B] text-white p-5 z-10 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-100 block mb-0.5">
                SEDUC-PA &bull; Ficha da Unidade
              </span>
              {loading ? (
                <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
              ) : (
                <h2 id="drawer-title" className="text-base sm:text-lg font-bold leading-snug">
                  {escola?.nome_escola || "Carregando..."}
                </h2>
              )}
              {/* Etapa e RI como sub-contexto */}
              {!loading && escola && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {escola.etapa_ensino && (
                    <span className="text-[11px] bg-white/20 text-white px-2 py-0.5 rounded font-medium">
                      {etapaFormatada}
                    </span>
                  )}
                  {escola.regiao_integracao && (
                    <span className="text-[11px] text-red-200 font-medium">
                      RI: {escola.regiao_integracao}
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors cursor-pointer"
              aria-label="Fechar ficha da escola"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : escola ? (
          <div className="p-5 space-y-6">
            {/* Cadastro Geral */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C757D] mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#A71B2B]" />
                Identificação e Localização
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <InfoItem label="CÓDIGO INEP" value={escola.codigo_escola} mono />
                <InfoItem
                  label="STATUS"
                  badge
                  value={escola.status_publicacao === "PUBLICADA" ? "Publicada" : "Não Publicada"}
                  badgeColor={escola.status_publicacao === "PUBLICADA" ? "green" : "red"}
                />
                <InfoItem label="MUNICÍPIO" value={escola.municipio} icon={<MapPin className="w-3 h-3 text-[#A71B2B]" />} />
                <InfoItem label="DRE / REGIONAL" value={escola.regional_dre || "—"} />
                <InfoItem
                  label="REGIÃO DE INTEGRAÇÃO (RI)"
                  value={escola.regiao_integracao || "—"}
                  highlight={!!escola.regiao_integracao}
                />
                <InfoItem label="LOCALIZAÇÃO" value={escola.localizacao || "—"} />
                <InfoItem label="REDE" value={escola.rede} />
                <InfoItem label="ESCOLA INDÍGENA" value={escola.escola_indigena ? "Sim" : "Não"} />
                <InfoItem
                  label="ETAPA REGULAR"
                  customContent={<EtapaBadge etapa={etapaFormatada} ofertaAlfabetizacao={isAlfabetizacao} />}
                />
              </div>
            </section>

            {/* Metas e Desempenho */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C757D] mb-2.5 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#A71B2B]" />
                Auditoria de Metas e Rendimento
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <MetricCard
                  label="META IDEB"
                  value={escola.atingiu_meta !== null ? (metaAtingida ? "SIM" : "NÃO") : "—"}
                  highlight={metaAtingida}
                  danger={escola.atingiu_meta !== null && !metaAtingida}
                  subtitle={salarios.tem14 ? "14º Salário" : undefined}
                />
                <MetricCard
                  label="CRESCIMENTO"
                  value={formatBonus(escola.ponto_crescimento)}
                  subtitle={salarios.tem15 ? "15º Salário" : undefined}
                />
                <MetricCard
                  label="16º SALÁRIO"
                  value={salarios.tem16 ? "+1,0x" : "—"}
                  highlight={salarios.tem16}
                  subtitle={salarios.tem16 ? "Destaque RI" : undefined}
                />
                <MetricCard label="TAXA FLUXO" value={formatBonus(escola.fluxo)} />

                {isAlfabetizacao && (
                  <div className="col-span-2 sm:col-span-4 p-2.5 rounded-lg border bg-teal-50/60 border-teal-200/60 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-teal-900 block">Ciclo de Alfabetização (1º e 2º ano):</span>
                      <span className="text-teal-700 text-[11px]">
                        {escola.meta_alfabetizacao_atingida
                          ? "Meta e pontuação pactuada atingida"
                          : "Possui oferta de turmas, mas meta/pontuação pactuada não atingida"}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      escola.meta_alfabetizacao_atingida
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}>
                      {escola.meta_alfabetizacao_atingida ? "Meta Atingida" : "Não Atingida (0,0)"}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* Bloco de Bonificações */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C757D] mb-2.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#A71B2B]" />
                Gratificações — Escola que Transforma
              </h3>
              <div className="space-y-2 p-3 bg-[#F8F9FA] rounded-md border border-[#E2E8F0]">
                <SalarioCard
                  numero="14"
                  ativo={salarios.tem14}
                  descricao={
                    salarios.tem14
                      ? "Meta pactuada alcançada — Habilitado à fração do 14º"
                      : "Meta pactuada não atingida"
                  }
                />
                <SalarioCard
                  numero="15"
                  ativo={salarios.tem15}
                  descricao={
                    salarios.tem15
                      ? "Registrou evolução de aprendizagem positiva"
                      : "Sem apuração de crescimento positivo"
                  }
                />
                <SalarioCard
                  numero="16"
                  ativo={salarios.tem16}
                  descricao={
                    salarios.tem16
                      ? `16º Salário (Destaque RI: +1,0x) — Contemplada e Homologada como Destaque na Região de Integração ${escola.regiao_integracao || ""}. Soma +1,0x ao Fator Docente até o teto legal de 3,5x.`
                      : escola.status_premiacao_ri === "NÃO PREMIADA - CRITÉRIO DE DESEMPATE"
                      ? "Escola empatada na Região de Integração, mas não contemplada conforme critérios oficiais de desempate da SEDUC."
                      : "Sem destaque apurado na Região de Integração"
                  }
                  motivo={escola.motivo_16_salario}
                  ri={escola.regiao_integracao}
                />

                {/* Barra total acumulado */}
                <div className="mt-3 pt-2.5 border-t border-[#E2E8F0]">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center">
                      Fator Acumulado (Docente):
                      <InfoTooltip content={TOOLTIP_FATOR_DOCENTE} align="left" />
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        totalAcumulado > 0
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-rose-700"
                      }`}
                    >
                      {totalAcumulado.toLocaleString("pt-BR", {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 2,
                      })}{" "}
                      de 3,5x ({pctTotal}% do teto legal)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pctTotal}%`,
                        backgroundColor:
                          pctTotal >= 100
                            ? "#D97706"
                            : pctTotal > 0
                            ? "#059669"
                            : "#CBD5E1",
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 text-right">
                    Teto legal: até 3,5x o vencimento-base (Lei Estadual nº 10.435/2024)
                  </p>
                </div>

                {/* Nota de Fundamentação Oficial */}
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-600 leading-relaxed mt-2">
                  <span className="font-semibold text-slate-800">
                    Fundamentação (Lei Estadual nº 10.435/2024):
                  </span>{" "}
                  As bonificações do Programa Escola que Transforma são apuradas a partir de três componentes: cumprimento da meta pactuada (14º), crescimento pedagógico positivo (15º) e prêmio por destaque na Região de Integração (16º). A consolidação final respeita os fatores multiplicadores de cada categoria e o teto legal máximo de 3,5x o vencimento-base anual.
                </div>
              </div>
            </section>

            {/* Fatores Multiplicadores Apurados */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C757D] mb-2.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#A71B2B]" />
                Fatores Multiplicadores Apurados
                <span className="text-[10px] font-medium text-amber-600 tracking-normal ml-auto">
                  Teto: 3,5x
                </span>
              </h3>
              <div className="space-y-3.5 p-4 bg-[#F8F9FA] rounded-md border border-[#E2E8F0]">
                <BonusBar
                  label="Fator Multiplicador Docente"
                  tooltip={TOOLTIP_FATOR_DOCENTE}
                  value={escola.bonus_professor}
                  variant="docente"
                  isAlfabetizacao={isAlfabetizacao}
                />
                <BonusBar
                  label="Fator Multiplicador Administrativo"
                  tooltip={TOOLTIP_FATOR_ADMIN}
                  value={escola.bonus_administrativo}
                  variant="administrativo"
                />
              </div>
            </section>

            {/* EJA / AEE — apenas se houver dados */}
            {(escola.bonus_eja_iniciais !== null ||
              escola.bonus_eja_finais !== null ||
              escola.bonus_eja_medio !== null ||
              escola.bonus_aee !== null) && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C757D] mb-2.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#B45309]" />
                  Modalidades Especiais (EJA / AEE)
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <MetricCard label="EJA INICIAIS" value={formatBonus(escola.bonus_eja_iniciais)} amber />
                  <MetricCard label="EJA FINAIS" value={formatBonus(escola.bonus_eja_finais)} amber />
                  <MetricCard label="EJA MÉDIO" value={formatBonus(escola.bonus_eja_medio)} amber />
                  <MetricCard label="AEE ESPECIAL" value={formatBonus(escola.bonus_aee)} amber />
                </div>
              </section>
            )}

            {/* Rodapé */}
            <div className="pt-2 text-[11px] text-[#6C757D] border-t border-gray-100 flex items-center justify-between">
              <span>Fonte: Base de Dados SEDUC-PA</span>
              <span>Exercício 2025</span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-[#6C757D] text-sm">
            Nenhuma informação encontrada para esta escola.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

function InfoItem({
  label, value, mono, badge, badgeColor, icon, customContent, highlight,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  badge?: boolean;
  badgeColor?: "green" | "red";
  icon?: React.ReactNode;
  customContent?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-md p-2.5 border ${highlight ? "bg-indigo-50 border-indigo-200" : "bg-[#F8F9FA] border-[#E2E8F0]"}`}>
      <p className="text-[10px] uppercase font-semibold text-[#6C757D] mb-0.5">{label}</p>
      {customContent ? (
        <div className="mt-0.5">{customContent}</div>
      ) : badge ? (
        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded ${
          badgeColor === "green" ? "bg-green-100 text-[#15803D]" : "bg-red-100 text-[#9E0018]"
        }`}>
          {value}
        </span>
      ) : (
        <p className={`text-xs font-semibold flex items-center gap-1 ${highlight ? "text-indigo-700" : "text-[#1D1D1B]"} ${mono ? "font-mono" : ""}`}>
          {icon}
          <span className="truncate">{value}</span>
        </p>
      )}
    </div>
  );
}

function MetricCard({
  label, value, highlight, danger, amber, subtitle,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
  amber?: boolean;
  subtitle?: string;
}) {
  return (
    <div className={`rounded-md p-2.5 text-center border ${
      highlight ? "bg-green-50 border-green-200"
      : danger ? "bg-red-50 border-red-200"
      : amber ? "bg-amber-50 border-amber-200"
      : "bg-[#F8F9FA] border-[#E2E8F0]"
    }`}>
      <p className="text-[10px] uppercase font-semibold text-[#6C757D] mb-0.5">{label}</p>
      <p className={`text-lg font-extrabold ${
        highlight ? "text-[#15803D]"
        : danger ? "text-[#9E0018]"
        : amber ? "text-[#B45309]"
        : "text-[#1D1D1B]"
      }`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px] font-semibold text-emerald-600 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
