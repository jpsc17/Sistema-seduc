"use client";

import type { Escola } from "@/lib/types";
import { formatBonus } from "@/lib/utils";

interface TabNaoPublicadasProps {
  data: Escola[];
  loading: boolean;
  onSelectEscola: (codigo: string) => void;
  onClearFilters?: () => void;
}

function getEtapaInfo(raw: string | null | undefined): { label: string; className: string } {
  if (!raw) return { label: "—", className: "bg-gray-100 text-gray-500" };
  const upper = raw.toUpperCase();
  if (upper.includes("INICIAIS")) {
    return {
      label: "EF ANOS INICIAIS",
      className: "bg-sky-50 text-sky-700 border border-sky-200",
    };
  }
  if (upper.includes("FINAIS")) {
    return {
      label: "EF ANOS FINAIS",
      className: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    };
  }
  if (upper.includes("MEDIO") || upper.includes("MÉDIO")) {
    return {
      label: "MÉDIO",
      className: "bg-purple-50 text-purple-700 border border-purple-200",
    };
  }
  return {
    label: raw.replace(/^ENSINO\s+/i, ""),
    className: "bg-gray-100 text-gray-600",
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
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-3">
        <p className="text-[#1A1A1A] font-semibold text-lg">
          Nenhuma escola não publicada encontrada com os filtros selecionados.
        </p>
        <p className="text-sm text-[#4A5568]">
          Verifique os filtros aplicados ou clique no botão abaixo para redefinir a busca.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9E0018] text-white text-sm font-semibold rounded-lg hover:bg-[#7A0012] transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0]">
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">Código INEP</th>
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">Nome da Escola</th>
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">Município</th>
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">DRE / Regional</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Etapa</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Localização</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Rede</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Fluxo</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Bônus Prof.</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Bônus Admin.</th>
            </tr>
          </thead>
          <tbody>
            {data.map((escola, idx) => {
              const bonusProfNum = Number(escola.bonus_professor);
              const isBonusZero = isNaN(bonusProfNum) || bonusProfNum === 0;
              const etapaInfo = getEtapaInfo(escola.etapa || escola.etapa_ensino);

              return (
                <tr
                  key={`${escola.codigo_escola}-${idx}`}
                  onClick={() => onSelectEscola(escola.codigo_escola)}
                  className="border-b border-[#F1F3F5] hover:bg-[#FDF2F4] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#4A5568]">
                    {escola.codigo_escola}
                  </td>
                  <td
                    className="px-4 py-3 font-medium text-[#1A1A1A] min-w-[280px] max-w-[400px] truncate"
                    title={escola.nome_escola}
                  >
                    {escola.nome_escola}
                  </td>
                  <td className="px-4 py-3 text-[#4A5568] whitespace-nowrap">{escola.municipio}</td>
                  <td className="px-4 py-3 text-[#4A5568] whitespace-nowrap">{escola.regional_dre || "—"}</td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${etapaInfo.className}`}
                    >
                      {etapaInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-[#4A5568]">
                      {escola.localizacao || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        escola.rede === "SECTET"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {escola.rede}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-[#1A1A1A]">
                    {formatBonus(escola.fluxo)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${
                        isBonusZero ? "text-[#9E0018]" : "text-slate-800"
                      }`}
                    >
                      {formatBonus(escola.bonus_professor)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-[#4A5568]">
                      {formatBonus(escola.bonus_administrativo)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
