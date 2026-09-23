"use client";

import { useEffect, useState, useCallback } from "react";
import { formatBonus } from "@/lib/utils";

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
  { key: "ENSINO FUNDAMENTAL ANOS INICIAIS", label: "Ensino Fundamental Anos Iniciais" },
  { key: "ENSINO FUNDAMENTAL ANOS FINAIS", label: "Ensino Fundamental Anos Finais" },
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
      {/* Submenu de pílulas para alternar etapa */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
        {ETAPAS.map((et) => (
          <button
            key={et.key}
            onClick={() => setActiveEtapa(et.key)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer ${
              activeEtapa === et.key
                ? "bg-[#9E0018] text-white shadow-md shadow-[#9E0018]/25"
                : "bg-[#F8F9FA] text-[#4A5568] hover:bg-[#FDF2F4] hover:text-[#9E0018] border border-[#E2E8F0]"
            }`}
          >
            {et.label}
          </button>
        ))}
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-8">
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
          <p className="text-[#4A5568] text-lg">
            Nenhum dado de IDEB encontrado para esta etapa
            {dre ? ` e DRE "${dre}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#9E0018] to-[#7A0012] text-white">
                  <th className="px-4 py-3.5 text-left font-semibold">DRE / Regional</th>
                  <th className="px-4 py-3.5 text-center font-semibold">Desempenho LP</th>
                  <th className="px-4 py-3.5 text-center font-semibold">Desempenho Mat</th>
                  <th className="px-4 py-3.5 text-center font-semibold">Média Padronizada</th>
                  <th className="px-4 py-3.5 text-center font-semibold">Taxa de Fluxo</th>
                  <th className="px-4 py-3.5 text-center font-semibold">Nota IDEB</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr
                    key={`${row.dre}-${idx}`}
                    className="border-b border-[#F1F3F5] hover:bg-[#FDF2F4] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#1A1A1A] whitespace-nowrap">
                      {row.dre || "—"}
                    </td>
                    <td className="px-4 py-3 text-center text-[#4A5568]">
                      {formatBonus(row.desempenho_lingua_portuguesa)}
                    </td>
                    <td className="px-4 py-3 text-center text-[#4A5568]">
                      {formatBonus(row.desempenho_matematica)}
                    </td>
                    <td className="px-4 py-3 text-center text-[#4A5568]">
                      {formatBonus(row.nota_padronizada_media)}
                    </td>
                    <td className="px-4 py-3 text-center text-[#4A5568]">
                      {formatBonus(row.fluxo_tempo_medio)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[52px] px-3 py-1 rounded-full bg-[#9E0018] text-white font-bold text-sm shadow-sm">
                        {formatBonus(row.ideb)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
