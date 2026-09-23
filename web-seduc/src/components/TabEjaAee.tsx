"use client";

import { formatBonus } from "@/lib/utils";
import { BookOpen, Info, AlertCircle } from "lucide-react";

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
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-8 shadow-xs">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-12 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-[#B45309] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-[#1D1D1B]">
            Nenhum registro de EJA/AEE encontrado com os filtros selecionados.
          </h3>
          <p className="text-sm text-[#6C757D] mt-1 max-w-md mx-auto">
            Verifique se a regional ou município selecionado possui turmas cadastradas nestas modalidades.
          </p>
        </div>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#A71B2B] text-white text-sm font-semibold rounded-md hover:bg-[#881220] transition-colors cursor-pointer"
          >
            Redefinir Filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Banner Explicativo sobre EJA e AEE */}
      <div className="bg-[#FFFBEB] border-l-4 border-[#B45309] p-4 rounded-r-md text-xs text-[#92400E] flex items-start gap-2.5">
        <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-[#B45309]" />
        <div>
          <strong className="font-semibold block text-[#78350F]">
            Modalidades Especiais — EJA (Educação de Jovens e Adultos) &amp; AEE (Atendimento Educacional Especializado):
          </strong>
          <span>
            Os valores correspondem aos coeficientes apurados para turmas de EJA Fundamental (Anos Iniciais e Finais),
            EJA Ensino Médio e Atendimento Especializado, nos termos da resolução estadual de bonificação.
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] overflow-hidden shadow-xs">
        {/* Visão Desktop: Tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0] text-[#1D1D1B] font-semibold text-xs uppercase tracking-wider">
                <th className="px-4 py-3.5">Código INEP</th>
                <th className="px-4 py-3.5">Nome da Escola</th>
                <th className="px-4 py-3.5">Município / DRE</th>
                <th className="px-4 py-3.5 text-center bg-amber-50/50 text-[#B45309]">
                  <span className="inline-flex items-center gap-1" title="Educação de Jovens e Adultos - Ensino Fundamental Anos Iniciais">
                    EJA Iniciais
                    <Info className="w-3 h-3" />
                  </span>
                </th>
                <th className="px-4 py-3.5 text-center bg-amber-50/50 text-[#B45309]">
                  <span className="inline-flex items-center gap-1" title="Educação de Jovens e Adultos - Ensino Fundamental Anos Finais">
                    EJA Finais
                    <Info className="w-3 h-3" />
                  </span>
                </th>
                <th className="px-4 py-3.5 text-center bg-amber-50/50 text-[#B45309]">
                  <span className="inline-flex items-center gap-1" title="Educação de Jovens e Adultos - Ensino Médio">
                    EJA Médio
                    <Info className="w-3 h-3" />
                  </span>
                </th>
                <th className="px-4 py-3.5 text-center bg-red-50/50 text-[#A71B2B]">
                  <span className="inline-flex items-center gap-1" title="Atendimento Educacional Especializado (Educação Especial e Inclusiva)">
                    AEE
                    <Info className="w-3 h-3" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, idx) => (
                <tr
                  key={`${row.codigo_escola}-${idx}`}
                  className="hover:bg-[#FDF2F4]/40 transition-colors duration-150"
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-[#6C757D] font-medium">
                    {row.codigo_escola}
                  </td>
                  <td
                    className="px-4 py-3.5 font-semibold text-[#1D1D1B] max-w-[320px] truncate"
                    title={row.nome_escola}
                  >
                    {row.nome_escola}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#6C757D] whitespace-nowrap">
                    <span className="text-[#1D1D1B] font-medium block">{row.municipio}</span>
                    <span className="text-[11px] text-gray-500">{row.regional || "—"}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-[#B45309] bg-amber-50/20">
                    {formatBonus(row.eja_fundamental_iniciais)}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-[#B45309] bg-amber-50/20">
                    {formatBonus(row.eja_fundamental_finais)}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-[#B45309] bg-amber-50/20">
                    {formatBonus(row.eja_medio)}
                  </td>
                  <td className="px-4 py-3.5 text-center font-bold text-[#A71B2B] bg-red-50/20">
                    {formatBonus(row.atendimento_especializado_aee)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visão Mobile: Lista de Cards Empilhados */}
        <div className="block md:hidden divide-y divide-gray-200">
          {data.map((row, idx) => (
            <div key={`mob-eja-${row.codigo_escola}-${idx}`} className="p-4 space-y-2.5">
              <div>
                <span className="font-mono text-xs font-semibold text-[#6C757D]">
                  INEP: {row.codigo_escola}
                </span>
                <h4 className="text-sm font-bold text-[#1D1D1B] leading-tight mt-0.5">
                  {row.nome_escola}
                </h4>
                <p className="text-xs text-[#6C757D]">
                  {row.municipio} &bull; {row.regional || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-[#F8F9FA] p-2.5 rounded border border-gray-200">
                <div className="bg-amber-50/60 p-1.5 rounded border border-amber-200/50">
                  <span className="text-amber-800 block text-[10px] uppercase font-semibold">EJA Iniciais</span>
                  <span className="font-bold text-[#B45309]">{formatBonus(row.eja_fundamental_iniciais)}</span>
                </div>
                <div className="bg-amber-50/60 p-1.5 rounded border border-amber-200/50">
                  <span className="text-amber-800 block text-[10px] uppercase font-semibold">EJA Finais</span>
                  <span className="font-bold text-[#B45309]">{formatBonus(row.eja_fundamental_finais)}</span>
                </div>
                <div className="bg-amber-50/60 p-1.5 rounded border border-amber-200/50">
                  <span className="text-amber-800 block text-[10px] uppercase font-semibold">EJA Médio</span>
                  <span className="font-bold text-[#B45309]">{formatBonus(row.eja_medio)}</span>
                </div>
                <div className="bg-red-50/60 p-1.5 rounded border border-red-200/50">
                  <span className="text-red-800 block text-[10px] uppercase font-semibold">AEE Especial</span>
                  <span className="font-bold text-[#A71B2B]">{formatBonus(row.atendimento_especializado_aee)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
