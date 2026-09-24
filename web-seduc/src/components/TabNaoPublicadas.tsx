"use client";

import type { Escola } from "@/lib/types";
import { formatBonus } from "@/lib/utils";
import { ChevronRight, AlertCircle, Info } from "lucide-react";
import TablePagination from "./TablePagination";

interface TabNaoPublicadasProps {
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

function formatEtapa(raw: string | null | undefined): string {
  if (!raw) return "—";
  return raw
    .replace(/^ENSINO\s+/i, "")
    .replace(/^FUNDAMENTAL\s+/i, "EF ")
    .replace(/MEDIO/i, "MÉDIO");
}

export default function TabNaoPublicadas({
  data,
  loading,
  onSelectEscola,
  onClearFilters,
  pagination,
}: TabNaoPublicadasProps) {
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
            Nenhuma escola com pendência encontrada para este filtro.
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Todas as escolas do recorte consultado estão com publicação regular ou não atendem aos critérios filtrados.
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
    <div className="space-y-3">
      {/* Nota Informativa Discreta de Auditoria */}
      <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-medium text-slate-800 block">Critério de Publicação — Pendência de Fluxo:</strong>
          <span>
            As unidades listadas apresentam índice de fluxo inferior ao limite regulamentar ou pendência na
            homologação de rendimento censitário.
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
        {/* Visão Desktop: Tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold tracking-wider">
                <th className="px-4 py-3 text-left">CÓDIGO INEP</th>
                <th className="px-4 py-3 text-left">NOME DA ESCOLA</th>
                <th className="px-4 py-3 text-left">MUNICÍPIO / DRE</th>
                <th className="px-4 py-3 text-left">ETAPA</th>
                <th className="px-4 py-3 text-left">LOCALIZAÇÃO</th>
                <th className="px-4 py-3 text-left">REDE</th>
                <th className="px-4 py-3 text-right">FLUXO</th>
                <th className="px-4 py-3 text-right">BÔNUS DOCENTE</th>
                <th className="px-4 py-3 text-right">BÔNUS ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((escola, idx) => {
                const etapaFormatada = formatEtapa(escola.etapa_ensino);

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
                  >
                    {/* CÓDIGO INEP: text-left */}
                    <td className="px-4 py-3 text-left font-mono text-xs text-slate-500 font-medium">
                      {escola.codigo_escola}
                    </td>

                    {/* NOME DA ESCOLA: text-left */}
                    <td
                      className="px-4 py-3 text-left font-medium text-slate-900 max-w-[280px] truncate"
                      title={escola.nome_escola}
                    >
                      {escola.nome_escola}
                    </td>

                    {/* MUNICÍPIO / DRE: text-left */}
                    <td className="px-4 py-3 text-left text-xs whitespace-nowrap">
                      <span className="text-slate-800 font-medium block">
                        {escola.municipio}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {escola.regional_dre || "—"}
                      </span>
                    </td>

                    {/* ETAPA: text-left, texto puro em cinza escuro */}
                    <td className="px-4 py-3 text-left whitespace-nowrap">
                      <span className="text-xs text-slate-600 font-medium">
                        {etapaFormatada}
                      </span>
                    </td>

                    {/* LOCALIZAÇÃO: text-left */}
                    <td className="px-4 py-3 text-left text-xs text-slate-600">
                      {escola.localizacao || "—"}
                    </td>

                    {/* REDE: text-left */}
                    <td className="px-4 py-3 text-left text-xs text-slate-600">
                      {escola.rede || "REGULAR"}
                    </td>

                    {/* FLUXO: text-right tabular-nums */}
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-700">
                      {renderValue(escola.fluxo)}
                    </td>

                    {/* BÔNUS DOCENTE: text-right tabular-nums */}
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                      {renderValue(escola.bonus_professor)}
                    </td>

                    {/* BÔNUS ADMIN: text-right tabular-nums */}
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-600">
                      {renderValue(escola.bonus_administrativo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Visão Mobile: Cards simplificados */}
        <div className="block md:hidden divide-y divide-slate-100">
          {data.map((escola, idx) => {
            const etapaFormatada = formatEtapa(escola.etapa_ensino);

            return (
              <div
                key={`mob-np-${escola.codigo_escola}-${idx}`}
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
                  </div>
                  <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded bg-amber-50 text-amber-700 border border-amber-200/50">
                    Pendência Fluxo
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Etapa</span>
                    <span className="text-slate-700 font-medium">{etapaFormatada}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Fluxo</span>
                    <span className="text-slate-700 font-medium tabular-nums">{renderValue(escola.fluxo)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Bônus Docente</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{renderValue(escola.bonus_professor)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Bônus Admin</span>
                    <span className="font-medium text-slate-700 tabular-nums">{renderValue(escola.bonus_administrativo)}</span>
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
    </div>
  );
}
