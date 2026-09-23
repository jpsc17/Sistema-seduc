"use client";

import { Search, Download, Filter, RotateCcw } from "lucide-react";
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
}: FilterBarProps) {
  // Se uma DRE estiver selecionada, filtra os municípios pertencentes a ela
  const availableMunicipios =
    dre && filtros?.dreMunicipios?.[dre] && filtros.dreMunicipios[dre].length > 0
      ? filtros.dreMunicipios[dre]
      : filtros?.municipios || [];

  const handleDreChange = (newDre: string) => {
    onDreChange(newDre);
    // Se o município atual não pertencer à nova DRE, reseta o município
    if (newDre && municipio && filtros?.dreMunicipios?.[newDre]) {
      if (!filtros.dreMunicipios[newDre].includes(municipio)) {
        onMunicipioChange("");
      }
    }
  };

  const hasActiveFilters = Boolean(
    search.trim() || dre || municipio || rede || localizacao
  );

  const handleReset = () => {
    onSearchChange("");
    onDreChange("");
    onMunicipioChange("");
    onRedeChange("");
    onLocalizacaoChange("");
    if (onClearFilters) onClearFilters();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-4">
      <div className="flex flex-wrap lg:flex-nowrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5568]" />
          <input
            type="text"
            placeholder="Buscar por Código INEP ou Nome da Escola..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9E0018]/20 focus:border-[#9E0018] transition-colors"
          />
        </div>

        {/* Dropdowns and Export */}
        <div className="flex flex-wrap lg:flex-nowrap gap-2 items-center">
          <div className="hidden xl:flex items-center text-[#4A5568] mr-1">
            <Filter className="w-4 h-4" />
          </div>

          {/* DRE Dropdown */}
          <select
            value={dre}
            onChange={(e) => handleDreChange(e.target.value)}
            className="px-2.5 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#9E0018]/20 focus:border-[#9E0018] min-w-[130px]"
          >
            <option value="">Todas as DREs</option>
            {filtros?.dres.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Município Dropdown (dinâmico com base na DRE) */}
          <select
            value={municipio}
            onChange={(e) => onMunicipioChange(e.target.value)}
            className="px-2.5 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#9E0018]/20 focus:border-[#9E0018] min-w-[140px]"
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

          {/* Rede Dropdown */}
          <select
            value={rede}
            onChange={(e) => onRedeChange(e.target.value)}
            className="px-2.5 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#9E0018]/20 focus:border-[#9E0018] min-w-[110px]"
          >
            <option value="">Todas as Redes</option>
            {filtros?.redes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Localização Dropdown */}
          <select
            value={localizacao}
            onChange={(e) => onLocalizacaoChange(e.target.value)}
            className="px-2.5 py-2 border border-[#E2E8F0] rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#9E0018]/20 focus:border-[#9E0018] min-w-[110px]"
          >
            <option value="">Localização</option>
            {filtros?.localizacoes.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          {/* Botão Limpar Filtros */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#9E0018] bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}

          {/* Export */}
          <button
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#9E0018] text-white text-sm font-semibold rounded-lg hover:bg-[#7A0012] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className={`w-4 h-4 ${exporting ? "animate-bounce" : ""}`} />
            {exporting ? "Baixando Base..." : "Exportar Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}
