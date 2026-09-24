"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  loading?: boolean;
}

export default function TablePagination({
  page,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
}: TablePaginationProps) {
  const start = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalRecords);

  return (
    <div className="border-t border-slate-100 px-4 py-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      {/* Texto informativo de densidade */}
      <div className="flex items-center gap-4 flex-wrap">
        <span>
          Exibindo <strong className="font-semibold text-slate-700">{start}–{end}</strong> de{" "}
          <strong className="font-semibold text-slate-700">{totalRecords.toLocaleString("pt-BR")}</strong> resultados
        </span>

        {/* Seletor de densidade (15, 30 ou 50 itens por página) */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="select-page-size" className="text-slate-400">
            Itens por página:
          </label>
          <select
            id="select-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 cursor-pointer"
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Botões de navegação Anterior / Próximo */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>

        <span className="text-slate-400 font-medium px-1">
          {page} de {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Próxima página"
        >
          <span>Próximo</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
