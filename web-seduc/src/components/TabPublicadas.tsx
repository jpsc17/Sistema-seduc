"use client";

import type { Escola } from "@/lib/types";
import { formatBonus, formatEtapaEnsino, calcularSalarios, normalizarBonus, LIMITE_BONUS } from "@/lib/utils";
import { ChevronRight, AlertCircle, Star } from "lucide-react";
import TablePagination from "./TablePagination";

interface TabPublicadasProps {
  data: Escola[];
  loading: boolean;
  onSelectEscola: (codigo: string) => void;
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

function renderValue(val: number | string | null | undefined) {
  if (val === null || val === undefined || val === "") {
    return <span className="text-slate-300 font-normal">—</span>;
  }
  const formatted = formatBonus(val);
  if (formatted === "—") {
    return <span className="text-slate-300 font-normal">—</span>;
  }
  return formatted;
}

/** Renderiza célula de bônus financeiro com destaque percentual do teto (3,5) */
function renderBonusCell(val: number | null | undefined) {
  if (val === null || val === undefined) {
    return <span className="text-slate-300 font-normal">—</span>;
  }
  const num = Number(val);
  if (isNaN(num) || num === 0) {
    return <span className="text-slate-300 font-normal">—</span>;
  }
  const { valorLimitado, percentualAtingido } = normalizarBonus(num);
  const formatted = valorLimitado.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  const isTeto = valorLimitado >= LIMITE_BONUS;
  const barColor = isTeto
    ? "bg-amber-500"
    : percentualAtingido >= 70
    ? "bg-emerald-500"
    : "bg-slate-400";

  return (
    <div className="flex flex-col items-end leading-tight gap-1 min-w-[80px]">
      <span className="font-semibold text-slate-900">{formatted}</span>
      {/* Mini barra de progresso em relação ao teto de 3,5 */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentualAtingido}%` }}
        />
      </div>
      <span className="text-[9px] font-medium text-amber-700 dark:text-amber-400 leading-none">
        {isTeto ? "100% do teto" : `${percentualAtingido}% do teto`}
      </span>
    </div>
  );
}

/** Badge pedagógico para etapa de ensino */
export function EtapaBadge({ etapa }: { etapa: string }) {
  if (!etapa || etapa === "—") {
    return <span className="text-slate-300 font-normal">—</span>;
  }

  if (etapa.includes("ALFABETIZAÇÃO") || etapa.includes("1º e 2º")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 whitespace-nowrap">
        {etapa}
      </span>
    );
  }

  if (etapa.includes("INICIAIS") || etapa.includes("3º ao 5º")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/70 whitespace-nowrap">
        {etapa}
      </span>
    );
  }

  if (etapa.includes("FINAIS")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/70 whitespace-nowrap">
        {etapa}
      </span>
    );
  }

  if (etapa.includes("MÉDIO") || etapa.includes("MEDIO")) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/70 whitespace-nowrap">
        {etapa}
      </span>
    );
  }

  return (
    <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
      {etapa}
    </span>
  );
}

/** Badge do 16º Salário - Destaque Regional por RI */
export function Badge16Salario({
  elegivel,
  motivo,
  ri,
}: {
  elegivel: boolean;
  motivo?: string | null;
  ri?: string | null;
}) {
  if (!elegivel) return null;
  const label = ri ? `★ 16º • ${ri}` : "★ 16º Salário";
  const title = motivo
    ? `${motivo}${ri ? ` — ${ri}` : ""}`
    : "Destaque Regional";

  return (
    <span
      title={title}
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300/70 whitespace-nowrap shadow-sm"
    >
      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
      {label}
    </span>
  );
}

export default function TabPublicadas({
  data,
  loading,
  onSelectEscola,
  onClearFilters,
  pagination,
}: TabPublicadasProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-xs">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">
            Nenhuma escola encontrada com os filtros selecionados.
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Verifique os termos de busca, selecione outra Diretoria Regional de Ensino (DRE) ou redefina os filtros.
          </p>
        </div>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Redefinir Filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
      {/* 1. Visão Desktop: Tabela de Máximo Data-Ink Ratio */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold tracking-wider">
              <th className="px-4 py-3 text-left">CÓDIGO INEP</th>
              <th className="px-4 py-3 text-left">NOME DA ESCOLA</th>
              <th className="px-4 py-3 text-left">MUNICÍPIO / DRE</th>
              <th className="px-4 py-3 text-left">ETAPA</th>
              <th className="px-4 py-3 text-center">
                <div className="flex flex-col items-center">
                  <span>META</span>
                  <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 tracking-normal">14º Salário</span>
                </div>
              </th>
              <th className="px-4 py-3 text-right">
                <div className="flex flex-col items-end">
                  <span>CRESCIMENTO</span>
                  <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400 tracking-normal">15º Salário (&gt; 0)</span>
                </div>
              </th>
              <th className="px-4 py-3 text-right">FLUXO</th>
              <th className="px-4 py-3 text-right bg-amber-50/50 dark:bg-amber-950/20 border-l border-slate-200 tabular-nums font-semibold">
                <div className="flex flex-col items-end">
                  <span>BÔNUS DOCENTE</span>
                  <span className="text-[9px] font-normal text-amber-700/70 tracking-normal">Teto: 3,5 salários</span>
                </div>
              </th>
              <th className="px-4 py-3 text-right bg-amber-50/50 dark:bg-amber-950/20 border-l border-slate-200 tabular-nums font-semibold">
                <div className="flex flex-col items-end">
                  <span>BÔNUS ADMIN.</span>
                  <span className="text-[9px] font-normal text-amber-700/70 tracking-normal">Teto: 3,5 salários</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((escola, idx) => {
              const metaAtingida =
                escola.atingiu_meta !== null && Number(escola.atingiu_meta) >= 1;

              const etapaFormatada = formatEtapaEnsino(escola.etapa_ensino);

              const salarios = calcularSalarios(escola);

              return (
                <tr
                  key={`${escola.codigo_escola}-${idx}`}
                  onClick={() => onSelectEscola(escola.codigo_escola)}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectEscola(escola.codigo_escola);
                    }
                  }}
                  aria-label={`Ver detalhes da escola ${escola.nome_escola}`}
                >
                  {/* CÓDIGO INEP: text-left */}
                  <td className="px-4 py-3 text-left font-mono text-xs text-slate-500 font-medium">
                    {escola.codigo_escola}
                  </td>

                  {/* NOME DA ESCOLA: text-left — com badge 16º se aplicável */}
                  <td
                    className="px-4 py-3 text-left font-medium text-slate-900 max-w-[280px]"
                    title={escola.nome_escola}
                  >
                    <div className="truncate">{escola.nome_escola}</div>
                    {salarios.tem16 && (
                      <div className="mt-0.5">
                        <Badge16Salario
                          elegivel={salarios.tem16}
                          motivo={escola.motivo_16_salario}
                          ri={escola.regiao_integracao}
                        />
                      </div>
                    )}
                  </td>

                  {/* MUNICÍPIO / DRE: text-left */}
                  <td className="px-4 py-3 text-left text-xs whitespace-nowrap">
                    <span className="text-slate-800 font-medium block">
                      {escola.municipio}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {escola.regional_dre || "—"}
                    </span>
                    {escola.regiao_integracao && (
                      <span className="text-[10px] text-indigo-500 font-medium block">
                        RI: {escola.regiao_integracao}
                      </span>
                    )}
                  </td>

                  {/* ETAPA: text-left, badge de distinção pedagógica */}
                  <td className="px-4 py-3 text-left whitespace-nowrap">
                    <EtapaBadge etapa={etapaFormatada} />
                  </td>

                  {/* META: text-center, badge + 14º Salário */}
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-0.5">
                      {escola.atingiu_meta !== null ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                            metaAtingida
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                              : "bg-rose-50 text-rose-700 border border-rose-200/50"
                          }`}
                        >
                          {metaAtingida ? "SIM" : "NÃO"}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">—</span>
                      )}
                      {metaAtingida && (
                        <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                          14º Salário
                        </span>
                      )}
                    </div>
                  </td>

                  {/* CRESCIMENTO: text-right tabular-nums + 15º Salário */}
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    <div className="flex flex-col items-end gap-0.5">
                      <span>{renderValue(escola.ponto_crescimento)}</span>
                      {salarios.tem15 && (
                        <span className="text-[9px] font-semibold text-blue-700 dark:text-blue-400">
                          15º Salário
                        </span>
                      )}
                    </div>
                  </td>

                  {/* FLUXO: text-right tabular-nums */}
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {renderValue(escola.fluxo)}
                  </td>

                  {/* BÔNUS DOCENTE: text-right tabular-nums font-semibold — coluna destacada */}
                  <td className="px-4 py-3 text-right tabular-nums font-semibold bg-amber-50/50 dark:bg-amber-950/20 border-l border-slate-200">
                    {renderBonusCell(escola.bonus_professor)}
                  </td>

                  {/* BÔNUS ADMIN: text-right tabular-nums font-semibold — coluna destacada */}
                  <td className="px-4 py-3 text-right tabular-nums font-semibold bg-amber-50/50 dark:bg-amber-950/20 border-l border-slate-200">
                    {renderBonusCell(escola.bonus_administrativo)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Visão Mobile: Cards simplificados com estética limpa */}
      <div className="block md:hidden divide-y divide-slate-100">
        {data.map((escola, idx) => {
          const metaAtingida =
            escola.atingiu_meta !== null && Number(escola.atingiu_meta) >= 1;
          const etapaFormatada = formatEtapaEnsino(escola.etapa_ensino);
          const salarios = calcularSalarios(escola);

          return (
            <div
              key={`mob-${escola.codigo_escola}-${idx}`}
              onClick={() => onSelectEscola(escola.codigo_escola)}
              className="p-4 hover:bg-slate-50/60 active:bg-slate-100 transition-colors cursor-pointer space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-slate-400 font-medium">
                    INEP {escola.codigo_escola}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-900 leading-tight mt-0.5">
                    {escola.nome_escola}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {escola.municipio} &bull; {escola.regional_dre || "—"}
                  </p>
                  {escola.regiao_integracao && (
                    <p className="text-[10px] text-indigo-500 font-medium mt-0.5">
                      RI: {escola.regiao_integracao}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {escola.atingiu_meta !== null && (
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        metaAtingida
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                          : "bg-rose-50 text-rose-700 border border-rose-200/50"
                      }`}
                    >
                      Meta: {metaAtingida ? "SIM" : "NÃO"}
                    </span>
                  )}
                  {metaAtingida && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                      14º Salário
                    </span>
                  )}
                  {salarios.tem15 && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/50">
                      15º Salário
                    </span>
                  )}
                  {salarios.tem16 && (
                    <Badge16Salario
                      elegivel={salarios.tem16}
                      motivo={escola.motivo_16_salario}
                      ri={escola.regiao_integracao}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase mb-0.5">Etapa</span>
                  <EtapaBadge etapa={etapaFormatada} />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Fluxo</span>
                  <span className="text-slate-700 font-medium tabular-nums">{renderValue(escola.fluxo)}</span>
                </div>
                <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded p-1.5 -m-0.5 border border-amber-200/40">
                  <span className="text-amber-800 dark:text-amber-300 block text-[10px] uppercase font-semibold">Bônus Docente</span>
                  <span className="tabular-nums font-semibold text-slate-900">{renderBonusCell(escola.bonus_professor)}</span>
                </div>
                <div className="bg-amber-50/60 dark:bg-amber-950/20 rounded p-1.5 -m-0.5 border border-amber-200/40">
                  <span className="text-amber-800 dark:text-amber-300 block text-[10px] uppercase font-semibold">Bônus Admin.</span>
                  <span className="tabular-nums font-semibold text-slate-900">{renderBonusCell(escola.bonus_administrativo)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end text-xs font-medium text-slate-600 pt-1">
                <span>Ver Ficha 360°</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginação Integrada no Rodapé da Tabela */}
      {pagination && (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalRecords={pagination.totalRecords}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          loading={loading}
        />
      )}
    </div>
  );
}
