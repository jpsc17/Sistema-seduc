"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Building2, GraduationCap, TrendingUp, Award } from "lucide-react";
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
        <span className="text-xs font-medium text-[#4A5568]">{label}</span>
        <span className="text-xs font-bold text-[#1A1A1A]">{formatBonus(value)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: numVal > 0 ? "#9E0018" : "#E2E8F0",
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

  if (!codigoEscola) return null;

  const metaAtingida = escola?.atingiu_meta !== null && Number(escola?.atingiu_meta) >= 1;

  const etapaFormatada = escola?.etapa_ensino
    ? escola.etapa_ensino
        .replace("ENSINO ", "")
        .replace("FUNDAMENTAL ", "EF ")
        .replace("MEDIO", "MÉDIO")
    : "—";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-[#9E0018] text-white p-5 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-3">
              <p className="text-xs font-medium opacity-80 mb-1">Ficha 360° da Escola</p>
              {loading ? (
                <div className="h-6 w-48 bg-white/20 rounded animate-pulse" />
              ) : (
                <h2 className="text-lg font-bold leading-snug">
                  {escola?.nome_escola || "Carregando..."}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : escola ? (
          <div className="p-5 space-y-6">
            {/* Cadastro */}
            <section>
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#9E0018]" />
                Dados Cadastrais
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="CÓDIGO INEP" value={escola.codigo_escola} mono />
                <InfoItem
                  label="STATUS"
                  badge
                  value={escola.status_publicacao === "PUBLICADA" ? "Publicada" : "Não Publicada"}
                  badgeColor={escola.status_publicacao === "PUBLICADA" ? "green" : "red"}
                />
                <InfoItem label="MUNICÍPIO" value={escola.municipio} icon={<MapPin className="w-3 h-3" />} />
                <InfoItem label="DRE / REGIONAL" value={escola.regional_dre || "—"} />
                <InfoItem label="LOCALIZAÇÃO" value={escola.localizacao || "—"} />
                <InfoItem label="REDE" value={escola.rede} />
                <InfoItem
                  label="ESCOLA INDÍGENA"
                  value={escola.escola_indigena ? "Sim" : "Não"}
                />
                <InfoItem
                  label="ETAPA"
                  value={etapaFormatada}
                  icon={<GraduationCap className="w-3 h-3" />}
                />
              </div>
            </section>

            {/* Desempenho */}
            <section>
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#9E0018]" />
                Desempenho e Metas
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="META PACTUADA"
                  value={escola.atingiu_meta !== null ? (metaAtingida ? "SIM" : "NÃO") : "—"}
                  highlight={metaAtingida}
                  danger={escola.atingiu_meta !== null && !metaAtingida}
                />
                <MetricCard label="PONTO CRESCIMENTO" value={formatBonus(escola.ponto_crescimento)} />
                <MetricCard label="FLUXO" value={formatBonus(escola.fluxo)} />
              </div>
            </section>

            {/* Bônus Comparativo */}
            <section>
              <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#9E0018]" />
                Comparativo de Bônus
              </h3>
              <div className="space-y-3 p-4 bg-[#FDF2F4] rounded-lg">
                <BonusBar label="Bônus Professor" value={escola.bonus_professor} max={5} />
                <BonusBar label="Bônus Administrativo" value={escola.bonus_administrativo} max={5} />
              </div>
            </section>

            {/* EJA / AEE */}
            {(escola.bonus_eja_iniciais !== null ||
              escola.bonus_eja_finais !== null ||
              escola.bonus_eja_medio !== null ||
              escola.bonus_aee !== null) && (
              <section>
                <h3 className="text-sm font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#B45309]" />
                  EJA e AEE
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <MetricCard label="EJA INICIAIS" value={formatBonus(escola.bonus_eja_iniciais)} amber />
                  <MetricCard label="EJA FINAIS" value={formatBonus(escola.bonus_eja_finais)} amber />
                  <MetricCard label="EJA MÉDIO" value={formatBonus(escola.bonus_eja_medio)} amber />
                  <MetricCard label="AEE" value={formatBonus(escola.bonus_aee)} amber />
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="p-5 text-center text-[#4A5568]">Escola não encontrada.</div>
        )}
      </div>
    </>
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
    <div className="bg-[#F8F9FA] rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-wider text-[#4A5568] mb-1">{label}</p>
      {badge ? (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ${
            badgeColor === "green" ? "bg-green-100 text-[#15803D]" : "bg-red-100 text-[#9E0018]"
          }`}
        >
          {value}
        </span>
      ) : (
        <p className={`text-sm font-semibold text-[#1A1A1A] flex items-center gap-1 ${mono ? "font-mono" : ""}`}>
          {icon}
          {value}
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
      className={`rounded-lg p-3 text-center border ${
        highlight
          ? "bg-green-50 border-green-200"
          : danger
          ? "bg-red-50 border-red-200"
          : amber
          ? "bg-amber-50 border-amber-200"
          : "bg-[#F8F9FA] border-[#E2E8F0]"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[#4A5568] mb-1">{label}</p>
      <p
        className={`text-xl font-extrabold ${
          highlight
            ? "text-[#15803D]"
            : danger
            ? "text-[#9E0018]"
            : amber
            ? "text-[#B45309]"
            : "text-[#1A1A1A]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
