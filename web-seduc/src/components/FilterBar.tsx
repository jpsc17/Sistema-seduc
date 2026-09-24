"use client";

import { useState } from "react";
import { Search, Download, SlidersHorizontal, RotateCcw, Loader2 } from "lucide-react";
import type { FiltrosData } from "@/lib/types";

interface FilterBarProps {
  filtros: FiltrosData | null;
  search: string;
  onSearchChange: (v: string) => void;
  dre: string;
  onDreChange: (v: string) => void;
  municipio: string;
  onMunicipioChange: (v: string) => void;
  rede: string;
  onRedeChange: (v: string) => void;
  localizacao: string;
  onLocalizacaoChange: (v: string) => void;
  onExport: () => void;
  exporting?: boolean;
  onClearFilters?: () => void;
  totalFilteredRecords?: number;
}

export default function FilterBar({
  filtros,
  search,
  onSearchChange,
  dre,
  onDreChange,
  municipio,
  onMunicipioChange,
  rede,
  onRedeChange,
  localizacao,
  onLocalizacaoChange,
  onExport,
  exporting = false,
  onClearFilters,
  totalFilteredRecords,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Se uma DRE estiver selecionada, filtra os municípios pertencentes a ela
  const availableMunicipios =
    dre && filtros?.dreMunicipios?.[dre] && filtros.dreMunicipios[dre].length > 0
      ? filtros.dreMunicipios[dre]
      : filtros?.municipios || [];

  const handleDreChange = (newDre: string) => {
    onDreChange(newDre);
    if (newDre && municipio && filtros?.dreMunicipios?.[newDre]) {
      if (!filtros.dreMunicipios[newDre].includes(municipio)) {
        onMunicipioChange("");
      }
    }
  };

  const hasActiveFilters = Boolean(
    search.trim() || dre || municipio || rede || localizacao
  );

  const extraFiltersCount = [
    Boolean(municipio),
    Boolean(rede),
    Boolean(localizacao),
  ].filter(Boolean).length;

  const handleReset = () => {
    onSearchChange("");
    onDreChange("");
    onMunicipioChange("");
    onRedeChange("");
    onLocalizacaoChange("");
    if (onClearFilters) onClearFilters();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 space-y-3">
      {/* Barra Principal de Filtros — Apenas 3 elementos em linha flex */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* 1. Campo de busca unificada (INEP ou Nome) com ícone de lupa */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="search"
            aria-label="Buscar por Código INEP ou Nome da Escola"
            placeholder="Buscar por INEP ou Nome da Escola..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors"
          />
        </div>

        {/* 2. Seletor de DRE (Todas as DREs) */}
        <div className="w-full md:w-56 shrink-0">
          <select
            id="select-dre"
            aria-label="Selecionar Diretoria Regional de Ensino"
            value={dre}
            onChange={(e) => handleDreChange(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-colors cursor-pointer"
          >
            <option value="">Todas as DREs</option>
            {filtros?.dres.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Grupo de ações à direita */}
        <div className="flex items-center gap-2 shrink-0 justify-end flex-wrap sm:flex-nowrap">
          {/* Botão colapsável Filtros (+) */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              showAdvanced || extraFiltersCount > 0
                ? "bg-slate-100 border-slate-300 text-slate-900"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
            aria-expanded={showAdvanced}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtros {showAdvanced ? "(-)" : "(+)"}</span>
            {extraFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[11px] font-semibold flex items-center justify-center">
                {extraFiltersCount}
              </span>
            )}
          </button>

          {/* Botão Limpar Filtros (apenas visível se houver filtros ativos) */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Redefinir filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}

          {/* Botão Exportar Excel — Botão secundário outline neutro */}
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
            title="Exportar base de dados para planilha Excel"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <Download className="w-4 h-4 text-slate-500" />
            )}
            <span>{exporting ? "Gerando..." : "Exportar Excel"}</span>
          </button>
        </div>
      </div>

      {/* Accordion / Drawer sutil de filtros adicionais (Município, Rede, Localização) */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
          {/* Município */}
          <div>
            <label htmlFor="select-municipio" className="block text-xs font-medium text-slate-500 mb-1">
              Município
            </label>
            <select
              id="select-municipio"
              value={municipio}
              onChange={(e) => onMunicipioChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">
                {dre ? `Municípios de ${dre}` : "Todos os Municípios"}
              </option>
              {availableMunicipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Rede */}
          <div>
            <label htmlFor="select-rede" className="block text-xs font-medium text-slate-500 mb-1">
              Rede de Ensino
            </label>
            <select
              id="select-rede"
              value={rede}
              onChange={(e) => onRedeChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">Todas as Redes</option>
              {filtros?.redes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Localização */}
          <div>
            <label htmlFor="select-localizacao" className="block text-xs font-medium text-slate-500 mb-1">
              Localização
            </label>
            <select
              id="select-localizacao"
              value={localizacao}
              onChange={(e) => onLocalizacaoChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">Todas as Localizações</option>
              {filtros?.localizacoes.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Resumo sutil de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-slate-600">Filtros:</span>
            {search && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Busca: &ldquo;{search}&rdquo;</span>}
            {dre && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">DRE: {dre}</span>}
            {municipio && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Município: {municipio}</span>}
            {rede && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">Rede: {rede}</span>}
            {localizacao && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">{localizacao}</span>}
          </div>
          {totalFilteredRecords !== undefined && (
            <span className="text-slate-400">
              {totalFilteredRecords.toLocaleString("pt-BR")} encontrados
            </span>
          )}
        </div>
      )}
    </div>
  );
}
