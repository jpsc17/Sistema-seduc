"use client";

import type { Escola } from "@/lib/types";
import { formatBonus } from "@/lib/utils";
import { AlertTriangle, ChevronRight, Info, AlertOctagon } from "lucide-react";

interface TabNaoPublicadasProps {
  data: Escola[];
  loading: boolean;
  onSelectEscola: (codigo: string) => void;
  onClearFilters?: () => void;
}

function getEtapaInfo(raw: string | null | undefined): { label: string; className: string } {
  if (!raw) return { label: "—", className: "bg-gray-100 text-gray-700" };
  const upper = raw.toUpperCase();
  if (upper.includes("INICIAIS")) {
    return {
      label: "EF ANOS INICIAIS",
      className: "bg-sky-50 text-sky-800 border border-sky-200",
    };
  }
  if (upper.includes("FINAIS")) {
    return {
      label: "EF ANOS FINAIS",
      className: "bg-indigo-50 text-indigo-800 border border-indigo-200",
    };
  }
  if (upper.includes("MEDIO") || upper.includes("MÉDIO")) {
    return {
      label: "ENSINO MÉDIO",
      className: "bg-purple-50 text-purple-800 border border-purple-200",
    };
  }
  return {
    label: raw.replace(/^ENSINO\s+/i, ""),
    className: "bg-gray-100 text-gray-700",
  };
}

export default function TabNaoPublicadas({
  data,
  loading,
  onSelectEscola,
  onClearFilters,
}: TabNaoPublicadasProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 shadow-xs">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-green-50 text-[#15803D] flex items-center justify-center mx-auto">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1D1D1B]">
            Nenhuma escola com pendência encontrada para este filtro.
          </h3>
          <p className="text-sm text-[#6C757D] mt-1 max-w-md mx-auto">
            Todas as escolas do recorte consultado estão com publicação regular ou não atendem aos critérios filtrados.
          </p>
        </div>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A71B2B] text-white text-sm font-semibold rounded-md hover:bg-[#881220] transition-colors cursor-pointer"
          >
            Redefinir Filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Banner Informativo Institucional de Auditoria */}
      <div className="bg-[#FEF2F2] border-l-4 border-[#9E0018] p-4 rounded-r-md text-xs text-[#9E0018] flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold block">Critério de Publicação — Pendência de Fluxo Escolar:</strong>
          <span>
            As unidades listadas abaixo apresentam índice de fluxo inferior ao limite regulamentar ou pendência
            na homologação censitária de rendimento, ficando com status de publicação em auditoria.
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-xs">
        {/* Visão Desktop: Tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-[#1D1D1B] font-semibold text-xs uppercase tracking-wider">
                <th className="px-4 py-3.5">Código INEP</th>
                <th className="px-4 py-3.5">Nome da Escola</th>
                <th className="px-4 py-3.5">Município / DRE</th>
                <th className="px-4 py-3.5 text-center">Etapa</th>
                <th className="px-4 py-3.5 text-center">Localização</th>
                <th className="px-4 py-3.5 text-center">Rede</th>
                <th className="px-4 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1" title="Taxa apurada de fluxo">
                    Fluxo
                    <Info className="w-3 h-3 text-[#6C757D]" />
                  </span>
                </th>
                <th className="px-4 py-3.5 text-center">Bônus Docente</th>
                <th className="px-4 py-3.5 text-center">Bônus Admin.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((escola, idx) => {
                const etapaInfo = getEtapaInfo(escola.etapa_ensino);
                const bonusProfNum = Number(escola.bonus_professor);
                const isBonusZero = isNaN(bonusProfNum) || bonusProfNum === 0;

                return (
                  <tr
                    key={`${escola.codigo_escola}-${idx}`}
                    onClick={() => onSelectEscola(escola.codigo_escola)}
                    className="hover:bg-[#FDF2F4]/40 cursor-pointer transition-colors duration-150"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectEscola(escola.codigo_escola);
                      }
                    }}
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-[#6C757D] font-medium">
                      {escola.codigo_escola}
                    </td>
                    <td
                      className="px-4 py-3.5 font-semibold text-[#1D1D1B] max-w-[320px] truncate"
                      title={escola.nome_escola}
                    >
                      {escola.nome_escola}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#6C757D] whitespace-nowrap">
                      <span className="text-[#1D1D1B] font-medium block">{escola.municipio}</span>
                      <span className="text-[11px] text-gray-500">{escola.regional_dre || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${etapaInfo.className}`}>
                        {etapaInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-[#6C757D]">
                      {escola.localizacao || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center text-xs text-[#6C757D]">
                      {escola.rede || "REGULAR"}
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-[#9E0018]">
                      {formatBonus(escola.fluxo)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`font-bold ${isBonusZero ? "text-[#9E0018]" : "text-[#1D1D1B]"}`}>
                        {formatBonus(escola.bonus_professor)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center font-semibold text-[#6C757D]">
                      {formatBonus(escola.bonus_administrativo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visão Mobile: Lista de Cards Empilhados */}
        <div className="block md:hidden divide-y divide-gray-200">
          {data.map((escola, idx) => {
            const etapaInfo = getEtapaInfo(escola.etapa_ensino);
            return (
              <div
                key={`mob-np-${escola.codigo_escola}-${idx}`}
                onClick={() => onSelectEscola(escola.codigo_escola)}
                className="p-4 hover:bg-[#FDF2F4]/50 active:bg-gray-100 transition-colors cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#9E0018]">
                      INEP: {escola.codigo_escola}
                    </span>
                    <h4 className="text-sm font-bold text-[#1D1D1B] leading-tight mt-0.5">
                      {escola.nome_escola}
                    </h4>
                    <p className="text-xs text-[#6C757D]">
                      {escola.municipio} &bull; {escola.regional_dre || "—"}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 text-xs font-bold rounded bg-red-100 text-[#9E0018]">
                    Pendência Fluxo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded border border-gray-200">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Etapa</span>
                    <span className="font-medium text-[#1D1D1B]">{etapaInfo.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Fluxo</span>
                    <span className="font-bold text-[#9E0018]">{formatBonus(escola.fluxo)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Bônus Docente</span>
                    <span className="font-bold text-[#1D1D1B]">{formatBonus(escola.bonus_professor)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Bônus Admin</span>
                    <span className="font-semibold text-[#1D1D1B]">{formatBonus(escola.bonus_administrativo)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs font-semibold text-[#A71B2B] pt-1">
                  <span>Ver Ficha 360°</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
