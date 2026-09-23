"use client";

import type { Escola } from "@/lib/types";
import { formatBonus } from "@/lib/utils";

interface TabPublicadasProps {
  data: Escola[];
  loading: boolean;
  onSelectEscola: (codigo: string) => void;
  onClearFilters?: () => void;
}

export default function TabPublicadas({
  data,
  loading,
  onSelectEscola,
  onClearFilters,
}: TabPublicadasProps) {
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
          Nenhuma escola encontrada com os filtros selecionados.
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
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">Etapa</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Meta</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Crescimento</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Fluxo</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Bônus Prof.</th>
              <th className="px-4 py-3 text-center font-semibold text-[#4A5568]">Bônus Admin.</th>
            </tr>
          </thead>
          <tbody>
            {data.map((escola, idx) => {
              const metaAtingida = escola.atingiu_meta !== null && Number(escola.atingiu_meta) >= 1;
              const bonusProfNum = Number(escola.bonus_professor);
              const isBonusZeroOuNao = isNaN(bonusProfNum) || bonusProfNum === 0 || !metaAtingida;

              const etapaFormatada = escola.etapa_ensino
                ? escola.etapa_ensino
                    .replace("ENSINO ", "")
                    .replace("FUNDAMENTAL ", "EF ")
                    .replace("MEDIO", "MÉDIO")
                : "—";

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
                    className="px-4 py-3 font-medium text-[#1A1A1A] min-w-[300px] max-w-[420px] truncate"
                    title={escola.nome_escola}
                  >
                    {escola.nome_escola}
                  </td>
                  <td className="px-4 py-3 text-[#4A5568] whitespace-nowrap">{escola.municipio}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-[#4A5568]">
                      {etapaFormatada}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {escola.atingiu_meta !== null ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${
                          metaAtingida
                            ? "bg-green-50 text-[#15803D]"
                            : "bg-red-50 text-[#9E0018]"
                        }`}
                      >
                        {metaAtingida ? "SIM" : "NÃO"}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-[#1A1A1A]">
                    {formatBonus(escola.ponto_crescimento)}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-[#1A1A1A]">
                    {formatBonus(escola.fluxo)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${
                        isBonusZeroOuNao ? "text-[#9E0018]" : "text-slate-800"
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
