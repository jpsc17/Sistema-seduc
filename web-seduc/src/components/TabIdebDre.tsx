"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { formatBonus } from "@/lib/utils";
import { AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface IdebDreRow {
  dre: string;
  etapa_ensino: string;
  desempenho_lingua_portuguesa: string | null;
  desempenho_matematica: string | null;
  nota_padronizada_media: string | null;
  fluxo_tempo_medio: string | null;
  ideb: string | number | null;
  ordem: number | null;
}

type EtapaKey =
  | "ENSINO FUNDAMENTAL ANOS INICIAIS"
  | "ENSINO FUNDAMENTAL ANOS FINAIS"
  | "ENSINO MEDIO";

const ETAPAS: { key: EtapaKey; label: string }[] = [
  { key: "ENSINO FUNDAMENTAL ANOS INICIAIS", label: "EF Anos Iniciais" },
  { key: "ENSINO FUNDAMENTAL ANOS FINAIS", label: "EF Anos Finais" },
  { key: "ENSINO MEDIO", label: "Ensino Médio" },
];

interface TabIdebDreProps {
  dre: string;
}

type SortField =
  | "dre"
  | "desempenho_lingua_portuguesa"
  | "desempenho_matematica"
  | "nota_padronizada_media"
  | "fluxo_tempo_medio"
  | "ideb";

type SortDirection = "asc" | "desc";

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

export default function TabIdebDre({ dre }: TabIdebDreProps) {
  const [activeEtapa, setActiveEtapa] = useState<EtapaKey>("ENSINO FUNDAMENTAL ANOS INICIAIS");
  const [rawData, setRawData] = useState<IdebDreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("ideb");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("etapa", activeEtapa);
      if (dre) params.set("dre", dre);

      const res = await fetch(`/api/ideb-dre?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRawData(json.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar IDEB DRE:", err);
    } finally {
      setLoading(false);
    }
  }, [activeEtapa, dre]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Default to descending for numeric values, ascending for text
      setSortDirection(field === "dre" ? "asc" : "desc");
    }
  };

  const sortedData = useMemo(() => {
    return [...rawData].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortField === "dre") {
        const valA = a.dre || "";
        const valB = b.dre || "";
        return dir * valA.localeCompare(valB, "pt-BR");
      }

      const numA = a[sortField] !== null && a[sortField] !== undefined && a[sortField] !== ""
        ? Number(a[sortField])
        : null;
      const numB = b[sortField] !== null && b[sortField] !== undefined && b[sortField] !== ""
        ? Number(b[sortField])
        : null;

      if (numA === null && numB === null) return 0;
      if (numA === null) return 1; // nulls last
      if (numB === null) return -1; // nulls last
      return dir * (numA - numB);
    });
  }, [rawData, sortField, sortDirection]);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 ml-1 inline-block" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-slate-800 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-slate-800 ml-1 inline-block" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Seletor de Etapas em Segmented Control Sutil */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
          {ETAPAS.map((et) => (
            <button
              key={et.key}
              onClick={() => setActiveEtapa(et.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeEtapa === et.key
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {et.label}
            </button>
          ))}
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
      ) : sortedData.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-slate-500 text-sm">
            Nenhum dado de IDEB encontrado para esta etapa
            {dre ? ` e Regional DRE "${dre}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Visão Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold tracking-wider select-none">
                  <th
                    onClick={() => handleSort("dre")}
                    className="px-4 py-3 text-left cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center">
                      <span>DIRETORIA REGIONAL DE ENSINO (DRE)</span>
                      {renderSortIndicator("dre")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("desempenho_lingua_portuguesa")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span>DESEMP. LP</span>
                      {renderSortIndicator("desempenho_lingua_portuguesa")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("desempenho_matematica")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span>DESEMP. MAT</span>
                      {renderSortIndicator("desempenho_matematica")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("nota_padronizada_media")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span>MÉDIA PADRONIZADA</span>
                      {renderSortIndicator("nota_padronizada_media")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("fluxo_tempo_medio")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span>TAXA DE FLUXO</span>
                      {renderSortIndicator("fluxo_tempo_medio")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("ideb")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors bg-slate-100/40"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span className="font-bold text-slate-900">NOTA IDEB</span>
                      {renderSortIndicator("ideb")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedData.map((row, idx) => (
                  <tr
                    key={`${row.dre}-${idx}`}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {row.dre || "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {renderValue(row.desempenho_lingua_portuguesa)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {renderValue(row.desempenho_matematica)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {renderValue(row.nota_padronizada_media)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {renderValue(row.fluxo_tempo_medio)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900 bg-slate-50/30">
                      {renderValue(row.ideb)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visão Mobile: Cards Empilhados */}
          <div className="block md:hidden divide-y divide-slate-100">
            {sortedData.map((row, idx) => (
              <div key={`mob-ideb-${row.dre}-${idx}`} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {row.dre || "—"}
                  </h4>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded font-bold text-xs text-slate-800 bg-slate-100">
                    IDEB: {renderValue(row.ideb)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Desemp. LP</span>
                    <span className="font-medium text-slate-800 tabular-nums">{renderValue(row.desempenho_lingua_portuguesa)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Desemp. Mat.</span>
                    <span className="font-medium text-slate-800 tabular-nums">{renderValue(row.desempenho_matematica)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Média Padronizada</span>
                    <span className="font-medium text-slate-800 tabular-nums">{renderValue(row.nota_padronizada_media)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Taxa de Fluxo</span>
                    <span className="font-medium text-slate-800 tabular-nums">{renderValue(row.fluxo_tempo_medio)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
