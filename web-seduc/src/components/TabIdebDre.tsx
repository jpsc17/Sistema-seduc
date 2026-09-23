"use client";

import { useEffect, useState, useCallback } from "react";
import { formatBonus } from "@/lib/utils";
import { BarChart3, Info, AlertCircle } from "lucide-react";

interface IdebDreRow {
  dre: string;
  etapa_ensino: string;
  desempenho_lingua_portuguesa: string | null;
  desempenho_matematica: string | null;
  nota_padronizada_media: string | null;
  fluxo_tempo_medio: string | null;
  ideb: string | null;
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

export default function TabIdebDre({ dre }: TabIdebDreProps) {
  const [activeEtapa, setActiveEtapa] = useState<EtapaKey>("ENSINO FUNDAMENTAL ANOS INICIAIS");
  const [data, setData] = useState<IdebDreRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("etapa", activeEtapa);
      if (dre) params.set("dre", dre);

      const res = await fetch(`/api/ideb-dre?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
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

  return (
    <div className="space-y-4">
      {/* Seletor de Etapas com estilo .gov sóbrio */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-xs">
        <span className="text-xs font-semibold text-[#6C757D] uppercase tracking-wider mr-1">
          Etapa do IDEB:
        </span>
        {ETAPAS.map((et) => (
          <button
            key={et.key}
            onClick={() => setActiveEtapa(et.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeEtapa === et.key
                ? "bg-[#A71B2B] text-white shadow-xs"
                : "bg-[#F8F9FA] text-[#1D1D1B] hover:bg-gray-100 border border-[#E2E8F0]"
            }`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da Tabela */}
      {loading ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 shadow-xs">
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
          <p className="text-[#6C757D] text-sm">
            Nenhum dado de IDEB encontrado para esta etapa
            {dre ? ` e Regional DRE "${dre}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-xs">
          {/* Visão Desktop: Tabela */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-[#1D1D1B] font-semibold text-xs uppercase tracking-wider">
                  <th className="px-4 py-3.5">Diretoria Regional de Ensino (DRE)</th>
                  <th className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1" title="Desempenho em Língua Portuguesa (SAEB)">
                      Desemp. LP
                      <Info className="w-3 h-3 text-[#6C757D]" />
                    </span>
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1" title="Desempenho em Matemática (SAEB)">
                      Desemp. Mat.
                      <Info className="w-3 h-3 text-[#6C757D]" />
                    </span>
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1" title="Nota Padronizada Média">
                      Média Padronizada
                    </span>
                  </th>
                  <th className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1" title="Taxa média de fluxo e rendimento escolar">
                      Taxa de Fluxo
                    </span>
                  </th>
                  <th className="px-4 py-3.5 text-center bg-red-50/50 text-[#A71B2B]">
                    <span className="inline-flex items-center gap-1" title="Índice de Desenvolvimento da Educação Básica (IDEB)">
                      Nota IDEB
                      <Info className="w-3 h-3" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.map((row, idx) => (
                  <tr
                    key={`${row.dre}-${idx}`}
                    className="hover:bg-[#FDF2F4]/40 transition-colors duration-150"
                  >
                    <td className="px-4 py-3.5 font-bold text-[#1D1D1B]">
                      {row.dre || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#6C757D]">
                      {formatBonus(row.desempenho_lingua_portuguesa)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#6C757D]">
                      {formatBonus(row.desempenho_matematica)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#6C757D]">
                      {formatBonus(row.nota_padronizada_media)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-[#6C757D]">
                      {formatBonus(row.fluxo_tempo_medio)}
                    </td>
                    <td className="px-4 py-3.5 text-center bg-red-50/20">
                      <span className="inline-flex items-center justify-center min-w-[50px] px-2.5 py-0.5 rounded font-extrabold text-sm text-[#A71B2B] bg-[#FDF2F4] border border-[#FAD2D8]">
                        {formatBonus(row.ideb)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Visão Mobile: Cards Empilhados */}
          <div className="block md:hidden divide-y divide-gray-200">
            {data.map((row, idx) => (
              <div key={`mob-ideb-${row.dre}-${idx}`} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#1D1D1B]">
                    {row.dre || "—"}
                  </h4>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded font-extrabold text-xs text-[#A71B2B] bg-[#FDF2F4] border border-[#FAD2D8]">
                    IDEB: {formatBonus(row.ideb)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded border border-gray-200">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Desemp. Português</span>
                    <span className="font-medium text-[#1D1D1B]">{formatBonus(row.desempenho_lingua_portuguesa)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Desemp. Matemática</span>
                    <span className="font-medium text-[#1D1D1B]">{formatBonus(row.desempenho_matematica)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Média Padronizada</span>
                    <span className="font-medium text-[#1D1D1B]">{formatBonus(row.nota_padronizada_media)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Taxa de Fluxo</span>
                    <span className="font-medium text-[#1D1D1B]">{formatBonus(row.fluxo_tempo_medio)}</span>
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
