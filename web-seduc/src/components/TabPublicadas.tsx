"use client";

import type { Escola } from "@/lib/types";
import { formatBonus } from "@/lib/utils";
import { Info, ChevronRight, School, Award, AlertCircle } from "lucide-react";

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
        <div className="w-12 h-12 rounded-full bg-[#FDF2F4] text-[#A71B2B] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1D1D1B]">
            Nenhuma escola encontrada com os filtros selecionados.
          </h3>
          <p className="text-sm text-[#6C757D] mt-1 max-w-md mx-auto">
            Verifique os termos de busca, selecione outra Diretoria Regional de Ensino (DRE) ou redefina os filtros.
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
    <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-xs">
      {/* 1. Visão Desktop: Tabela Institucional com Alta Legibilidade */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-[#1D1D1B] font-semibold text-xs uppercase tracking-wider">
              <th className="px-4 py-3.5">Código INEP</th>
              <th className="px-4 py-3.5">Nome da Escola</th>
              <th className="px-4 py-3.5">Município / DRE</th>
              <th className="px-4 py-3.5">Etapa</th>
              <th className="px-4 py-3.5 text-center">
                <span className="inline-flex items-center gap-1" title="Atingimento da meta estabelecida pelo IDEB/SEDUC">
                  Meta
                  <Info className="w-3 h-3 text-[#6C757D]" />
                </span>
              </th>
              <th className="px-4 py-3.5 text-center">
                <span className="inline-flex items-center gap-1" title="Ponto de crescimento apurado">
                  Crescimento
                </span>
              </th>
              <th className="px-4 py-3.5 text-center">
                <span className="inline-flex items-center gap-1" title="Taxa ponderada de fluxo de aprovação">
                  Fluxo
                </span>
              </th>
              <th className="px-4 py-3.5 text-center">
                <span className="inline-flex items-center gap-1" title="Índice de bonificação para o corpo docente">
                  Bônus Docente
                </span>
              </th>
              <th className="px-4 py-3.5 text-center">
                <span className="inline-flex items-center gap-1" title="Índice de bonificação para o corpo administrativo">
                  Bônus Admin.
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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
                  className="hover:bg-[#FDF2F4]/40 cursor-pointer transition-colors duration-150 focus-within:bg-[#FDF2F4]/60"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectEscola(escola.codigo_escola);
                    }
                  }}
                  aria-label={`Ver detalhes da escola ${escola.nome_escola}`}
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
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded bg-gray-100 text-[#1D1D1B]">
                      {etapaFormatada}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {escola.atingiu_meta !== null ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded ${
                          metaAtingida
                            ? "bg-green-100 text-[#15803D]"
                            : "bg-red-100 text-[#9E0018]"
                        }`}
                      >
                        {metaAtingida ? "SIM" : "NÃO"}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center font-medium text-[#1D1D1B]">
                    {formatBonus(escola.ponto_crescimento)}
                  </td>
                  <td className="px-4 py-3.5 text-center font-medium text-[#1D1D1B]">
                    {formatBonus(escola.fluxo)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`font-bold ${
                        isBonusZeroOuNao ? "text-[#9E0018]" : "text-[#1D1D1B]"
                      }`}
                    >
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

      {/* 2. Visão Mobile: Lista de Cards Empilhados (Mobile-first, sem scroll horizontal forçado) */}
      <div className="block md:hidden divide-y divide-gray-200">
        {data.map((escola, idx) => {
          const metaAtingida = escola.atingiu_meta !== null && Number(escola.atingiu_meta) >= 1;
          const etapaFormatada = escola.etapa_ensino
            ? escola.etapa_ensino
                .replace("ENSINO ", "")
                .replace("FUNDAMENTAL ", "EF ")
                .replace("MEDIO", "MÉDIO")
            : "—";

          return (
            <div
              key={`mob-${escola.codigo_escola}-${idx}`}
              onClick={() => onSelectEscola(escola.codigo_escola)}
              className="p-4 hover:bg-[#FDF2F4]/50 active:bg-gray-100 transition-colors cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-semibold text-[#A71B2B]">
                    INEP: {escola.codigo_escola}
                  </span>
                  <h4 className="text-sm font-bold text-[#1D1D1B] leading-tight mt-0.5">
                    {escola.nome_escola}
                  </h4>
                  <p className="text-xs text-[#6C757D]">
                    {escola.municipio} &bull; {escola.regional_dre || "—"}
                  </p>
                </div>
                {escola.atingiu_meta !== null && (
                  <span
                    className={`shrink-0 px-2 py-0.5 text-xs font-bold rounded ${
                      metaAtingida
                        ? "bg-green-100 text-[#15803D]"
                        : "bg-red-100 text-[#9E0018]"
                    }`}
                  >
                    Meta: {metaAtingida ? "SIM" : "NÃO"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded border border-gray-200">
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Etapa</span>
                  <span className="font-medium text-[#1D1D1B]">{etapaFormatada}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Fluxo</span>
                  <span className="font-medium text-[#1D1D1B]">{formatBonus(escola.fluxo)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] uppercase">Bônus Docente</span>
                  <span className="font-bold text-[#A71B2B]">{formatBonus(escola.bonus_professor)}</span>
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
  );
}
