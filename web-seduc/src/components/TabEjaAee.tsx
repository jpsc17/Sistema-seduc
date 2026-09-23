"use client";

import { formatBonus } from "@/lib/utils";

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
}

export default function TabEjaAee({ data, loading, onClearFilters }: TabEjaAeeProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8">
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center space-y-3">
        <p className="text-[#1A1A1A] font-semibold text-lg">
          Nenhum registro de EJA/AEE encontrado com os filtros selecionados.
        </p>
        <p className="text-sm text-[#4A5568]">
          Verifique os filtros aplicados ou clique no botão abaixo para redefinir a busca.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9E0018] text-white text-sm font-semibold rounded-lg hover:bg-[#7A0012] transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0]">
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">Código INEP</th>
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">Nome da Escola</th>
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">Município</th>
              <th className="px-4 py-3 text-left font-semibold text-[#4A5568]">DRE / Regional</th>
              <th className="px-4 py-3 text-center font-semibold text-[#B45309] bg-amber-50">
                EJA Iniciais
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#B45309] bg-amber-50">
                EJA Finais
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#B45309] bg-amber-50">
                EJA Médio
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#9E0018] bg-red-50">
                AEE
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={`${row.codigo_escola}-${idx}`}
                className="border-b border-[#F1F3F5] hover:bg-[#FDF2F4] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-[#4A5568]">
                  {row.codigo_escola}
                </td>
                <td
                  className="px-4 py-3 font-medium text-[#1A1A1A] min-w-[300px] max-w-[420px] truncate"
                  title={row.nome_escola}
                >
                  {row.nome_escola}
                </td>
                <td className="px-4 py-3 text-[#4A5568] whitespace-nowrap">{row.municipio}</td>
                <td className="px-4 py-3 text-[#4A5568] whitespace-nowrap">{row.regional || "—"}</td>
                <td className="px-4 py-3 text-center font-bold text-[#B45309]">
                  {formatBonus(row.eja_fundamental_iniciais)}
                </td>
                <td className="px-4 py-3 text-center font-bold text-[#B45309]">
                  {formatBonus(row.eja_fundamental_finais)}
                </td>
                <td className="px-4 py-3 text-center font-bold text-[#B45309]">
                  {formatBonus(row.eja_medio)}
                </td>
                <td className="px-4 py-3 text-center font-bold text-[#9E0018]">
                  {formatBonus(row.atendimento_especializado_aee)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
