"use client";

import type { Escola } from "@/lib/types";
import { formatBonus } from "@/lib/utils";
import { ChevronRight, AlertCircle, BookOpen, CheckCircle2, XCircle } from "lucide-react";
import TablePagination from "./TablePagination";

interface TabAlfabetizacaoProps {
  data: Escola[];
  loading: boolean;
  onSelectEscola: (codigo: string, etapa: string | null) => void;
  onClearFilters?: () => void;
  pagination?: {
    page: number;
    totalPages: number;
    totalRecords: number;
    pageSize: number;
    onPageChange: (p: number) => void;
    onPageSizeChange: (s: number) => void;
  };
}

/** Renderiza o badge escalonado de nível de atingimento da meta de alfabetização */
function renderNivelAtingimento(val: number) {
  if (val >= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Atingiu 100% da meta
      </span>
    );
  }
  if (val >= 2) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
        Atingiu 90% da meta
      </span>
    );
  }
  if (val >= 1) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
        Atingiu 75% da meta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
      <XCircle className="w-3.5 h-3.5 text-slate-400" />
      Não atingiu a meta
    </span>
  );
}

export default function TabAlfabetizacao({
  data,
  loading,
  onSelectEscola,
  onClearFilters,
  pagination,
}: TabAlfabetizacaoProps) {
  return (
    <div className="space-y-4">
      {/* Banner Explicativo do Ciclo de Alfabetização */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50/40 border border-teal-200/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-start gap-2.5">
          <BookOpen className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-teal-900 block text-sm">
              Ciclo de Alfabetização (1º e 2º Ano) &bull; Lei Estadual nº 10.435/2024
            </span>
            <p className="text-teal-700/90 mt-0.5 text-xs">
              Apuração isolada e exclusiva de 144 escolas mapeadas. Avaliação escalonada da meta pactuada do ciclo (75%, 90% ou 100%), sem cálculo de crescimento ou fluxo.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-300/60">
            {pagination?.totalRecords ?? data.length} unidades mapeadas
          </span>
        </div>
      </div>

      {/* Conteúdo da Tabela */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-slate-500 text-sm">
            Nenhuma escola com oferta de alfabetização encontrada para os filtros selecionados.
          </p>
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Visão Desktop: Tabela */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold tracking-wider select-none">
                  <th className="px-4 py-3 text-left w-32">CÓDIGO INEP</th>
                  <th className="px-4 py-3 text-left min-w-[240px]">NOME DA ESCOLA</th>
                  <th className="px-4 py-3 text-left">MUNICÍPIO / DRE</th>
                  <th className="px-4 py-3 text-left">REGIÃO DE INTEGRAÇÃO</th>
                  <th className="px-4 py-3 text-center">SITUAÇÃO DA META</th>
                  <th className="px-4 py-3 text-center">NÍVEL DE ATINGIMENTO</th>
                  <th className="px-4 py-3 text-right">FATOR DOCENTE ESPECÍFICO</th>
                  <th className="px-3 py-3 text-center w-12" aria-label="Ações"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((escola) => {
                  const valAlfa = Number(
                    escola.ponto_alfabetizacao ??
                    escola.atingiu_meta ??
                    escola.bonus_professor ??
                    0
                  );
                  const situacaoMeta = valAlfa > 0;
                  const fator =
                    escola.bonus_professor !== null && escola.bonus_professor !== undefined
                      ? Number(escola.bonus_professor)
                      : situacaoMeta
                      ? valAlfa
                      : 0.0;

                  return (
                    <tr
                      key={escola.codigo_escola}
                      onClick={() =>
                        onSelectEscola(escola.codigo_escola, "EF ALFABETIZAÇÃO (1º e 2º)")
                      }
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    >
                      {/* CÓDIGO INEP */}
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-600 group-hover:text-teal-700">
                        {escola.codigo_escola}
                      </td>

                      {/* NOME DA ESCOLA */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 group-hover:text-teal-900 leading-snug">
                          {escola.nome_escola}
                        </div>
                        {escola.escola_indigena && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 mt-0.5">
                            Indígena
                          </span>
                        )}
                      </td>

                      {/* MUNICÍPIO / DRE */}
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{escola.municipio}</div>
                        <div className="text-xs text-slate-400">
                          {escola.regional_dre ? `DRE ${escola.regional_dre}` : "—"}
                        </div>
                      </td>

                      {/* REGIÃO DE INTEGRAÇÃO */}
                      <td className="px-4 py-3 text-slate-700 text-xs font-medium">
                        {escola.regiao_integracao || "—"}
                      </td>

                      {/* SITUAÇÃO DA META: SIM (verde) se pontuação > 0, NÃO (neutro) se for 0 */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {situacaoMeta ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                            SIM
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            NÃO
                          </span>
                        )}
                      </td>

                      {/* NÍVEL DE ATINGIMENTO: Tradução escalonada */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {renderNivelAtingimento(valAlfa)}
                      </td>

                      {/* FATOR DOCENTE ESPECÍFICO */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end leading-tight">
                          <span
                            className={`text-sm font-extrabold tabular-nums ${
                              situacaoMeta ? "text-emerald-700" : "text-slate-500"
                            }`}
                          >
                            {formatBonus(fator)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {situacaoMeta ? "Meta Conquistada" : "Fator Zero"}
                          </span>
                        </div>
                      </td>

                      {/* AÇÃO / SETA */}
                      <td className="px-3 py-3 text-center text-slate-300 group-hover:text-teal-600 transition-colors">
                        <ChevronRight className="w-4 h-4 mx-auto" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Visão Mobile: Cards */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {data.map((escola) => {
              const valAlfa = Number(
                escola.ponto_alfabetizacao ??
                escola.atingiu_meta ??
                escola.bonus_professor ??
                0
              );
              const situacaoMeta = valAlfa > 0;
              const fator =
                escola.bonus_professor !== null && escola.bonus_professor !== undefined
                  ? Number(escola.bonus_professor)
                  : situacaoMeta
                  ? valAlfa
                  : 0.0;

              return (
                <div
                  key={`mob-alfa-${escola.codigo_escola}`}
                  onClick={() =>
                    onSelectEscola(escola.codigo_escola, "EF ALFABETIZAÇÃO (1º e 2º)")
                  }
                  className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono text-slate-400">
                        INEP: {escola.codigo_escola}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {escola.nome_escola}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {escola.municipio} &bull; {escola.regional_dre ? `DRE ${escola.regional_dre}` : "—"}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-xs text-slate-500 font-medium mr-1">Situação da Meta:</span>
                    {situacaoMeta ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        SIM
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        NÃO
                      </span>
                    )}
                    {renderNivelAtingimento(valAlfa)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <span>Região: <strong>{escola.regiao_integracao || "—"}</strong></span>
                    <span>
                      Fator Docente:{" "}
                      <strong className={situacaoMeta ? "text-emerald-700 font-bold" : "text-slate-600"}>
                        {formatBonus(fator)}
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação Integrada */}
          {pagination && <TablePagination {...pagination} />}
        </div>
      )}
    </div>
  );
}
