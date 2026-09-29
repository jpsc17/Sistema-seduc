"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { formatBonus } from "@/lib/utils";
import { AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Award, Users, Target } from "lucide-react";
import type { PontosBonusDreRow } from "@/lib/types";

interface TabPontosBonusDreProps {
  dre: string;
}

type EtapaKey = "iniciais" | "finais" | "medio";

const ETAPAS: { key: EtapaKey; label: string; fullLabel: string }[] = [
  { key: "iniciais", label: "EF Anos Iniciais", fullLabel: "Ensino Fundamental — Anos Iniciais" },
  { key: "finais", label: "EF Anos Finais", fullLabel: "Ensino Fundamental — Anos Finais" },
  { key: "medio", label: "Ensino Médio", fullLabel: "Ensino Médio Regular e Integrado" },
];

type SortField =
  | "dre"
  | "pontos_bonus"
  | "matricula"
  | "bonus_etapa"
  | "bonus_ri"
  | "bonus_total";

type SortDirection = "asc" | "desc";

function renderNumber(val: number | null | undefined, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) {
    return <span className="text-slate-300 font-normal">—</span>;
  }
  return val.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function renderMatricula(val: number | null | undefined) {
  if (val === null || val === undefined || isNaN(val)) {
    return <span className="text-slate-300 font-normal">—</span>;
  }
  return val.toLocaleString("pt-BR");
}

export default function TabPontosBonusDre({ dre }: TabPontosBonusDreProps) {
  const [activeEtapa, setActiveEtapa] = useState<EtapaKey>("iniciais");
  const [rawData, setRawData] = useState<PontosBonusDreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("pontos_bonus");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("etapa", activeEtapa);
      if (dre) params.set("dre", dre);

      const res = await fetch(`/api/pontos-bonus-dre?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRawData(json.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar Pontos de Bônus DRE:", err);
    } finally {
      setLoading(false);
    }
  }, [activeEtapa, dre]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ao mudar de etapa, restaura a ordenação padrão por pontos_bonus decrescente
  const handleEtapaChange = (newEtapa: EtapaKey) => {
    setActiveEtapa(newEtapa);
    setSortField("pontos_bonus");
    setSortDirection("desc");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
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

      const numA =
        a[sortField] !== null && a[sortField] !== undefined ? Number(a[sortField]) : null;
      const numB =
        b[sortField] !== null && b[sortField] !== undefined ? Number(b[sortField]) : null;

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
      <ArrowUp className="w-3.5 h-3.5 text-emerald-700 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-700 ml-1 inline-block" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Topo: Sub-abas de Etapa e Descrição Oficial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
            {ETAPAS.map((et) => (
              <button
                key={et.key}
                onClick={() => handleEtapaChange(et.key)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
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

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Ordenação padrão: <strong>Pontos de Bônus (Decrescente)</strong></span>
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
            Nenhum dado de pontos de bônus encontrado para esta etapa
            {dre ? ` e Regional DRE "${dre}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Visão Desktop: Tabela Oficial */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold tracking-wider select-none">
                  <th className="px-4 py-3 text-center w-14">#</th>
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
                    onClick={() => handleSort("pontos_bonus")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors bg-emerald-50/40"
                  >
                    <div className="inline-flex items-center justify-end font-bold text-emerald-900">
                      <span>PONTOS DE BÔNUS</span>
                      {renderSortIndicator("pontos_bonus")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("matricula")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span>MATRÍCULA ETAPA</span>
                      {renderSortIndicator("matricula")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bonus_etapa")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span>BÔNUS ETAPA</span>
                      {renderSortIndicator("bonus_etapa")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bonus_ri")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span>BÔNUS RI</span>
                      {renderSortIndicator("bonus_ri")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bonus_total")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors bg-slate-100/40"
                  >
                    <div className="inline-flex items-center justify-end font-bold text-slate-900">
                      <span>BÔNUS TOTAL DRE</span>
                      {renderSortIndicator("bonus_total")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedData.map((row, idx) => {
                  const hasBonusRi = row.bonus_ri !== null && Number(row.bonus_ri) > 0;
                  return (
                    <tr
                      key={`${row.dre}-${idx}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-4 py-3 text-center text-xs font-medium text-slate-400">
                        {idx + 1}º
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{row.dre || "—"}</span>
                          {hasBonusRi && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              Destaque RI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-700 bg-emerald-50/20">
                        {renderNumber(row.pontos_bonus, 1)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {renderMatricula(row.matricula)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {row.bonus_etapa !== null ? `${renderNumber(row.bonus_etapa, 1)}x` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                        {hasBonusRi ? (
                          <span className="font-semibold text-amber-700">+{renderNumber(row.bonus_ri, 1)}x</span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-extrabold text-slate-900 bg-slate-50/40">
                        {row.bonus_total !== null ? `${renderNumber(row.bonus_total, 1)}x` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Visão Mobile: Cards Empilhados */}
          <div className="block md:hidden divide-y divide-slate-100">
            {sortedData.map((row, idx) => {
              const hasBonusRi = row.bonus_ri !== null && Number(row.bonus_ri) > 0;
              return (
                <div key={`mob-dre-${row.dre}-${idx}`} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                      <h4 className="text-sm font-semibold text-slate-900">{row.dre || "—"}</h4>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded font-bold text-xs bg-emerald-100 text-emerald-800">
                      {renderNumber(row.pontos_bonus, 1)} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Matrícula Etapa</span>
                      <span className="font-medium text-slate-800 tabular-nums">{renderMatricula(row.matricula)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Bônus Etapa</span>
                      <span className="font-medium text-slate-800 tabular-nums">
                        {row.bonus_etapa !== null ? `${renderNumber(row.bonus_etapa, 1)}x` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Bônus Regional (RI)</span>
                      <span className="font-medium text-slate-800 tabular-nums">
                        {hasBonusRi ? `+${renderNumber(row.bonus_ri, 1)}x` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold text-slate-700">Bônus Total DRE</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {row.bonus_total !== null ? `${renderNumber(row.bonus_total, 1)}x` : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
