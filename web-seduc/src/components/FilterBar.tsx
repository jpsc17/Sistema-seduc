"use client";

import { useState } from "react";
import { Search, Download, Filter, RotateCcw, ChevronDown, ChevronUp, Loader2, Info } from "lucide-react";
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
  const [mobileExpanded, setMobileExpanded] = useState(false);

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

  const activeFiltersCount = [
    Boolean(search.trim()),
    Boolean(dre),
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
    <div className="bg-white rounded-lg shadow-xs border border-[#E2E8F0] p-4 space-y-3">
      {/* Linha Principal de Filtros */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Campo de Busca por Nome ou Código INEP */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6C757D]" />
          <input
            type="search"
            aria-label="Buscar por Código INEP ou Nome da Escola"
            placeholder="Buscar por Código INEP ou Nome da Escola..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F8F9FA] border border-[#E2E8F0] rounded-md text-sm text-[#1D1D1B] placeholder:text-[#6C757D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A71B2B]/20 focus:border-[#A71B2B] transition-colors"
          />
        </div>

        {/* Botão de Toggle para Mobile (< 1024px) */}
        <div className="flex lg:hidden items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#F6F6F6] border border-[#E2E8F0] rounded-md text-sm font-semibold text-[#1D1D1B] hover:bg-gray-100 transition-colors"
            aria-expanded={mobileExpanded}
          >
            <Filter className="w-4 h-4 text-[#A71B2B]" />
            <span>Filtros Regionais</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#A71B2B] text-white text-xs flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
            {mobileExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Exportar no mobile */}
          <button
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#A71B2B] text-white text-sm font-semibold rounded-md hover:bg-[#881220] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Exportar base completa para Excel"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{exporting ? "Gerando..." : "Exportar"}</span>
          </button>
        </div>

        {/* Dropdowns Desktop (sempre visíveis em telas grandes) e Drawer/Acordeon em telas pequenas */}
        <div
          className={`${
            mobileExpanded ? "flex" : "hidden"
          } lg:flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100`}
        >
          {/* DRE Dropdown com Tooltip */}
          <div className="flex flex-col sm:flex-row lg:flex-row gap-1 lg:items-center">
            <label htmlFor="select-dre" className="sr-only">
              Diretoria Regional de Ensino (DRE)
            </label>
            <select
              id="select-dre"
              value={dre}
              onChange={(e) => handleDreChange(e.target.value)}
              title="Diretoria Regional de Ensino (DRE)"
              className="px-2.5 py-2 border border-[#E2E8F0] rounded-md text-sm text-[#1D1D1B] bg-white focus:outline-none focus:ring-2 focus:ring-[#A71B2B]/20 focus:border-[#A71B2B] min-w-[140px]"
            >
              <option value="">Todas as DREs (Regionais)</option>
              {filtros?.dres.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Município Dropdown */}
          <div className="flex flex-col sm:flex-row lg:flex-row gap-1 lg:items-center">
            <label htmlFor="select-municipio" className="sr-only">
              Município
            </label>
            <select
              id="select-municipio"
              value={municipio}
              onChange={(e) => onMunicipioChange(e.target.value)}
              className="px-2.5 py-2 border border-[#E2E8F0] rounded-md text-sm text-[#1D1D1B] bg-white focus:outline-none focus:ring-2 focus:ring-[#A71B2B]/20 focus:border-[#A71B2B] min-w-[140px]"
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

          {/* Rede Dropdown */}
          <div className="flex flex-col sm:flex-row lg:flex-row gap-1 lg:items-center">
            <label htmlFor="select-rede" className="sr-only">
              Rede de Ensino
            </label>
            <select
              id="select-rede"
              value={rede}
              onChange={(e) => onRedeChange(e.target.value)}
              className="px-2.5 py-2 border border-[#E2E8F0] rounded-md text-sm text-[#1D1D1B] bg-white focus:outline-none focus:ring-2 focus:ring-[#A71B2B]/20 focus:border-[#A71B2B] min-w-[110px]"
            >
              <option value="">Todas as Redes</option>
              {filtros?.redes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Localização Dropdown */}
          <div className="flex flex-col sm:flex-row lg:flex-row gap-1 lg:items-center">
            <label htmlFor="select-localizacao" className="sr-only">
              Localização (Urbana / Rural)
            </label>
            <select
              id="select-localizacao"
              value={localizacao}
              onChange={(e) => onLocalizacaoChange(e.target.value)}
              className="px-2.5 py-2 border border-[#E2E8F0] rounded-md text-sm text-[#1D1D1B] bg-white focus:outline-none focus:ring-2 focus:ring-[#A71B2B]/20 focus:border-[#A71B2B] min-w-[120px]"
            >
              <option value="">Localização</option>
              {filtros?.localizacoes.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#A71B2B] bg-[#FDF2F4] hover:bg-[#FAD2D8] border border-[#FAD2D8] rounded-md transition-colors cursor-pointer shrink-0"
              title="Redefinir e limpar todos os filtros aplicados"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}

          {/* Botão Exportar Excel Desktop */}
          <div className="hidden lg:block shrink-0 pl-1">
            <button
              onClick={onExport}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#A71B2B] text-white text-sm font-semibold rounded-md hover:bg-[#881220] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              title="Baixar planilha consolidada em formato Excel (.xlsx)"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{exporting ? "Gerando Excel..." : "Exportar Excel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Linha Informativa de Filtros e Resumo com Contraste Adequado */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs text-[#6C757D]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1D1D1B]">Filtros aplicados:</span>
            {search && <span className="bg-gray-100 px-2 py-0.5 rounded text-[#1D1D1B]">Busca: &ldquo;{search}&rdquo;</span>}
            {dre && <span className="bg-gray-100 px-2 py-0.5 rounded text-[#1D1D1B]">DRE: {dre}</span>}
            {municipio && <span className="bg-gray-100 px-2 py-0.5 rounded text-[#1D1D1B]">Município: {municipio}</span>}
            {rede && <span className="bg-gray-100 px-2 py-0.5 rounded text-[#1D1D1B]">Rede: {rede}</span>}
            {localizacao && <span className="bg-gray-100 px-2 py-0.5 rounded text-[#1D1D1B]">{localizacao}</span>}
          </div>
          {totalFilteredRecords !== undefined && (
            <span className="font-medium text-[#1D1D1B]">
              Total filtrado: <strong>{totalFilteredRecords.toLocaleString("pt-BR")}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
