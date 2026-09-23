"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Building2, GraduationCap, TrendingUp, Award, CheckCircle2, AlertCircle } from "lucide-react";
import { formatBonus } from "@/lib/utils";

interface SchoolDetail {
  codigo_escola: string;
  nome_escola: string;
  municipio: string;
  regional_dre: string | null;
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
}

interface SchoolDrawerProps {
  codigoEscola: string | null;
  onClose: () => void;
}

function BonusBar({ label, value, max }: { label: string; value: number | null; max: number }) {
  const numVal = Number(value) || 0;
  const pct = Math.min((numVal / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold text-[#1D1D1B]">{label}</span>
        <span className="text-xs font-bold text-[#A71B2B]">{formatBonus(value)}</span>
      </div>
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: numVal > 0 ? "#A71B2B" : "#CBD5E1",
          }}
        />
      </div>
    </div>
  );
}

export default function SchoolDrawer({ codigoEscola, onClose }: SchoolDrawerProps) {
  const [escola, setEscola] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!codigoEscola) {
      setEscola(null);
      return;
    }

    setLoading(true);
    fetch(`/api/escolas/${codigoEscola}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setEscola(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [codigoEscola]);

  // Fechar com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!codigoEscola) return null;

  const metaAtingida = escola?.atingiu_meta !== null && Number(escola?.atingiu_meta) >= 1;

  const etapaFormatada = escola?.etapa_ensino
    ? escola.etapa_ensino
        .replace("ENSINO ", "")
        .replace("FUNDAMENTAL ", "EF ")
        .replace("MEDIO", "MÉDIO")
    : "—";

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto border-l border-[#E2E8F0] animate-in slide-in-from-right duration-200">
        {/* Header do Drawer Institucional (#A71B2B) */}
        <div className="sticky top-0 bg-[#A71B2B] text-white p-5 z-10 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-100 block mb-0.5">
                SEDUC-PA &bull; Ficha Detalhada da Unidade
              </span>
              {loading ? (
                <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
              ) : (
                <h2 id="drawer-title" className="text-base sm:text-lg font-bold leading-snug">
                  {escola?.nome_escola || "Carregando..."}
                </h2>
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
                <InfoItem label="LOCALIZAÇÃO" value={escola.localizacao || "—"} />
                <InfoItem label="REDE" value={escola.rede} />
                <InfoItem
                  label="ESCOLA INDÍGENA"
                  value={escola.escola_indigena ? "Sim" : "Não"}
                />
                <InfoItem
                  label="ETAPA REGULAR"
                  value={etapaFormatada}
                  icon={<GraduationCap className="w-3 h-3 text-[#A71B2B]" />}
                />
              </div>
            </section>

            {/* Metas e Desempenho */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C757D] mb-2.5 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#A71B2B]" />
                Auditoria de Metas e Rendimento
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                <MetricCard
                  label="META IDEB"
                  value={escola.atingiu_meta !== null ? (metaAtingida ? "SIM" : "NÃO") : "—"}
                  highlight={metaAtingida}
                  danger={escola.atingiu_meta !== null && !metaAtingida}
                />
                <MetricCard label="CRESCIMENTO" value={formatBonus(escola.ponto_crescimento)} />
                <MetricCard label="TAXA FLUXO" value={formatBonus(escola.fluxo)} />
              </div>
            </section>

            {/* Bônus Apurado */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6C757D] mb-2.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#A71B2B]" />
                Índices de Bonificação Apurados
              </h3>
              <div className="space-y-3.5 p-4 bg-[#F8F9FA] rounded-md border border-[#E2E8F0]">
                <BonusBar label="Bônus Corpo Docente" value={escola.bonus_professor} max={5} />
                <BonusBar label="Bônus Administrativo" value={escola.bonus_administrativo} max={5} />
              </div>
            </section>

            {/* EJA / AEE */}
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

            {/* Rodapé da Ficha */}
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

function InfoItem({
  label,
  value,
  mono,
  badge,
  badgeColor,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: boolean;
  badgeColor?: "green" | "red";
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-[#F8F9FA] rounded-md p-2.5 border border-[#E2E8F0]">
      <p className="text-[10px] uppercase font-semibold text-[#6C757D] mb-0.5">{label}</p>
      {badge ? (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded ${
            badgeColor === "green" ? "bg-green-100 text-[#15803D]" : "bg-red-100 text-[#9E0018]"
          }`}
        >
          {value}
        </span>
      ) : (
        <p className={`text-xs font-semibold text-[#1D1D1B] flex items-center gap-1 ${mono ? "font-mono" : ""}`}>
          {icon}
          <span className="truncate">{value}</span>
        </p>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
  danger,
  amber,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
  amber?: boolean;
}) {
  return (
    <div
      className={`rounded-md p-2.5 text-center border ${
        highlight
          ? "bg-green-50 border-green-200"
          : danger
          ? "bg-red-50 border-red-200"
          : amber
          ? "bg-amber-50 border-amber-200"
          : "bg-[#F8F9FA] border-[#E2E8F0]"
      }`}
    >
      <p className="text-[10px] uppercase font-semibold text-[#6C757D] mb-0.5">{label}</p>
      <p
        className={`text-lg font-extrabold ${
          highlight
            ? "text-[#15803D]"
            : danger
            ? "text-[#9E0018]"
            : amber
            ? "text-[#B45309]"
            : "text-[#1D1D1B]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
