"use client";

import { formatBonus } from "@/lib/utils";
import { Info, AlertCircle } from "lucide-react";
import TablePagination from "./TablePagination";

interface EjaRow {
  regional: string | null;
  municipio: string | null;
  localizacao: string | null;
  escola_indigena: boolean;
  codigo_escola: string;
  tem_publicacao: boolean;
  nome_escola: string;
  eja_fundamental_iniciais: number | null;
  eja_fundamental_finais: number | null;
  eja_medio: number | null;
  atendimento_especializado_aee: number | null;
}

interface TabEjaAeeProps {
  data: EjaRow[];
  loading: boolean;
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

export default function TabEjaAee({
  data,
  loading,
  onClearFilters,
  pagination,
}: TabEjaAeeProps) {
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
            Nenhum registro de EJA/AEE encontrado com os filtros selecionados.
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Verifique se a regional ou município selecionado possui turmas cadastradas nestas modalidades.
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
      {/* Nota Explicativa Discreta */}
      <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-medium text-slate-800 block">
            Modalidades Especiais — EJA &amp; AEE:
          </strong>
          <span>
            Coeficientes apurados para turmas de EJA Fundamental (Iniciais e Finais), Ensino Médio e Atendimento
            Educacional Especializado (AEE).
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
                <th className="px-4 py-3 text-right">EJA INICIAIS</th>
                <th className="px-4 py-3 text-right">EJA FINAIS</th>
                <th className="px-4 py-3 text-right">EJA MÉDIO</th>
                <th className="px-4 py-3 text-right">AEE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, idx) => (
                <tr
                  key={`${row.codigo_escola}-${idx}`}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* CÓDIGO INEP: text-left */}
                  <td className="px-4 py-3 text-left font-mono text-xs text-slate-500 font-medium">
                    {row.codigo_escola}
                  </td>

                  {/* NOME DA ESCOLA: text-left */}
                  <td
                    className="px-4 py-3 text-left font-medium text-slate-900 max-w-[280px] truncate"
                    title={row.nome_escola}
                  >
                    {row.nome_escola}
                  </td>

                  {/* MUNICÍPIO / DRE: text-left */}
                  <td className="px-4 py-3 text-left text-xs whitespace-nowrap">
                    <span className="text-slate-800 font-medium block">
                      {row.municipio}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {row.regional || "—"}
                    </span>
                  </td>

                  {/* EJA INICIAIS: text-right tabular-nums */}
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {renderValue(row.eja_fundamental_iniciais)}
                  </td>

                  {/* EJA FINAIS: text-right tabular-nums */}
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {renderValue(row.eja_fundamental_finais)}
                  </td>

                  {/* EJA MÉDIO: text-right tabular-nums */}
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {renderValue(row.eja_medio)}
                  </td>

                  {/* AEE: text-right tabular-nums */}
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">
                    {renderValue(row.atendimento_especializado_aee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visão Mobile: Cards simplificados */}
        <div className="block md:hidden divide-y divide-slate-100">
          {data.map((row, idx) => (
            <div key={`mob-eja-${row.codigo_escola}-${idx}`} className="p-4 space-y-2.5">
              <div>
                <span className="font-mono text-xs text-slate-400 font-medium">
                  INEP {row.codigo_escola}
                </span>
                <h4 className="text-sm font-semibold text-slate-900 leading-tight mt-0.5">
                  {row.nome_escola}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {row.municipio} &bull; {row.regional || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">EJA Iniciais</span>
                  <span className="text-slate-700 font-medium tabular-nums">{renderValue(row.eja_fundamental_iniciais)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">EJA Finais</span>
                  <span className="text-slate-700 font-medium tabular-nums">{renderValue(row.eja_fundamental_finais)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">EJA Médio</span>
                  <span className="text-slate-700 font-medium tabular-nums">{renderValue(row.eja_medio)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">AEE Especial</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{renderValue(row.atendimento_especializado_aee)}</span>
                </div>
              </div>
            </div>
          ))}
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
