"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Award,
  Users,
  Target,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { PontosBonusDreRow } from "@/lib/types";

interface TabPontosBonusDreProps {
  dre: string;
}

type SortField =
  | "ordem"
  | "dre"
  | "matricula_total"
  | "bonus_ai"
  | "bonus_af"
  | "bonus_em"
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
  const [rawData, setRawData] = useState<PontosBonusDreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>("bonus_total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
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
  }, [dre]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "dre" || field === "ordem" ? "asc" : "desc");
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

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    if (rawData.length === 0) {
      return { totalDres: 0, totalMatricula: 0, comRi: 0, mediaBonus: 0, maxBonus: 0 };
    }
    const totalDres = rawData.length;
    let sumMatricula = 0;
    let countRi = 0;
    let sumBonus = 0;
    let maxBonus = 0;

    for (const r of rawData) {
      if (r.matricula_total) sumMatricula += r.matricula_total;
      if (r.bonus_ri && r.bonus_ri > 0) countRi += 1;
      if (r.bonus_total !== null && r.bonus_total !== undefined) {
        sumBonus += r.bonus_total;
        if (r.bonus_total > maxBonus) maxBonus = r.bonus_total;
      }
    }

    const mediaBonus = totalDres > 0 ? sumBonus / totalDres : 0;
    return { totalDres, totalMatricula: sumMatricula, comRi: countRi, mediaBonus, maxBonus };
  }, [rawData]);

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
      {/* Cards de Resumo Executivo das DREs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Total de Regionais DRE
            </p>
            <p className="text-xl font-black text-slate-900 tabular-nums">
              {stats.totalDres}
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Destaque Regional (RI)
            </p>
            <p className="text-xl font-black text-amber-700 tabular-nums">
              {stats.comRi} <span className="text-xs font-normal text-slate-500">DREs</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-700 rounded-lg shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Média Bônus DRE
            </p>
            <p className="text-xl font-black text-slate-900 tabular-nums">
              {renderNumber(stats.mediaBonus, 1)}
            </p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Maior Bônus Apurado
            </p>
            <p className="text-xl font-black text-emerald-700 tabular-nums">
              {renderNumber(stats.maxBonus, 1)}
            </p>
          </div>
        </div>
      </div>

      {/* Faixa Informativa Oficial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs text-slate-700 font-semibold">
            Pontos de Bônus DRE 2025 — Visão Consolidada por Diretoria Regional de Ensino
          </span>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Ordenação padrão: <strong>Bônus Total DRE (Decrescente)</strong>
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
      ) : sortedData.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-slate-500 text-sm">
            Nenhum dado de pontos de bônus encontrado
            {dre ? ` para a Regional DRE "${dre}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-xs">
          {/* Visão Desktop: Tabela Oficial Direta */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold tracking-wider select-none">
                  <th
                    onClick={() => handleSort("ordem")}
                    className="px-4 py-3 text-center w-14 cursor-pointer hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="inline-flex items-center justify-center">
                      <span>#</span>
                      {renderSortIndicator("ordem")}
                    </div>
                  </th>
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
                    onClick={() => handleSort("matricula_total")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors text-slate-500"
                  >
                    <div className="inline-flex items-center justify-end">
                      <span>MATRÍCULA TOTAL</span>
                      {renderSortIndicator("matricula_total")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bonus_ai")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors bg-blue-50/40"
                  >
                    <div className="inline-flex items-center justify-end font-semibold text-blue-900">
                      <span>BÔNUS AI</span>
                      {renderSortIndicator("bonus_ai")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bonus_af")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors bg-indigo-50/40"
                  >
                    <div className="inline-flex items-center justify-end font-semibold text-indigo-900">
                      <span>BÔNUS AF</span>
                      {renderSortIndicator("bonus_af")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bonus_em")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors bg-purple-50/40"
                  >
                    <div className="inline-flex items-center justify-end font-semibold text-purple-900">
                      <span>BÔNUS EM</span>
                      {renderSortIndicator("bonus_em")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bonus_ri")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors bg-amber-50/50"
                  >
                    <div className="inline-flex items-center justify-end font-bold text-amber-900">
                      <span>BÔNUS RI</span>
                      {renderSortIndicator("bonus_ri")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bonus_total")}
                    className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100/70 transition-colors bg-emerald-50/60"
                  >
                    <div className="inline-flex items-center justify-end font-black text-emerald-950">
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
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 text-center text-xs font-semibold text-slate-400 tabular-nums">
                        {idx + 1}º
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{row.dre || "—"}</span>
                          {hasBonusRi && (
                            <span
                              title="Destaque na Região de Integração"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/70"
                            >
                              ★ RI
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500 font-normal">
                        {renderMatricula(row.matricula_total)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700 bg-blue-50/10">
                        {renderNumber(row.bonus_ai, 1)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700 bg-indigo-50/10">
                        {renderNumber(row.bonus_af, 1)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700 bg-purple-50/10">
                        {renderNumber(row.bonus_em, 1)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums bg-amber-50/20">
                        {hasBonusRi ? (
                          <span className="font-bold text-amber-800">
                            {renderNumber(row.bonus_ri, 1)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-black text-slate-900 bg-emerald-50/25">
                        <span className="text-base text-emerald-900">
                          {renderNumber(row.bonus_total, 1)}
                        </span>
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
                <div key={`mob-dre-${row.dre}-${idx}`} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 tabular-nums">#{idx + 1}</span>
                      <h4 className="text-sm font-bold text-slate-900">{row.dre || "—"}</h4>
                      {hasBonusRi && (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70">
                          ★ RI
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">Total DRE</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-black text-sm bg-emerald-50 text-emerald-800 border border-emerald-200/70 tabular-nums">
                        {renderNumber(row.bonus_total, 1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bônus AI</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {renderNumber(row.bonus_ai, 1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bônus AF</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {renderNumber(row.bonus_af, 1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bônus EM</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {renderNumber(row.bonus_em, 1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Bônus RI</span>
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {hasBonusRi ? (
                          <span className="text-amber-800 font-bold">{renderNumber(row.bonus_ri, 1)}</span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Matrícula Total:</span>
                      <span className="font-semibold text-slate-700 tabular-nums">
                        {renderMatricula(row.matricula_total)}
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
