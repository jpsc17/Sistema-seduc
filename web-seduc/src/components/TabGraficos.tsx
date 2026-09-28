"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { GraficoResumo, GraficosResponse, SituacaoRedeItem, IdebEtapa, IdebDre, IdebRi, DestaqueRi, EjaAeeItem, PontosDre } from "@/lib/types";

// Card component reutilizado para exibir valores resumidos
function ResumoCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200/80 text-center">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

export default function TabGraficos() {
  const [data, setData] = useState<GraficosResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/graficos");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          console.error("Erro ao buscar dados de gráficos");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-center text-slate-600">Carregando gráficos…</p>;
  }
  if (!data) {
    return <p className="text-center text-red-600">Falha ao carregar os dados.</p>;
  }

  const { resumo, situacaoRede, meta, crescimento, idebPorEtapa, idebPorDre, idebPorRi, destaquesRi, ejaAee, pontosDre } = data;

  // Cores para donut
  const COLORS = ["#34A853", "#EA4335"]; // verde institucional, vermelho suave

  return (
    <section className="space-y-8">
      {/* Bloco 1 – Cards resumidos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <ResumoCard label="Total de escolas" value={resumo.totalEscolas} />
        <ResumoCard label="Escolas publicadas" value={resumo.publicadas} />
        <ResumoCard label="Escolas não publicadas" value={resumo.naoPublicadas} />
        <ResumoCard label="% publicadas" value={`${resumo.percentualPublicadas.toFixed(1)}%`} />
        <ResumoCard label="% não publicadas" value={`${resumo.percentualNaoPublicadas.toFixed(1)}%`} />
        <ResumoCard label="Registros EJA/AEE" value={resumo.registrosEjaAee} />
        <ResumoCard label="Regiões de integração" value={resumo.regioesIntegracao} />
      </div>

      {/* Bloco 2 – Gráfico de Situação da Rede (donut) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80">
        <h2 className="text-lg font-medium text-slate-800 mb-4">Situação da Rede</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={situacaoRede}
              dataKey="quantidade"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              label={({ percent, name }: any) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
            >
              {situacaoRede.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [value, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bloco 3 – Gráfico de Cumprimento da Meta (barra) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80">
        <h2 className="text-lg font-medium text-slate-800 mb-4">Cumprimento da Meta</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{ label: "SIM", value: meta.sim }, { label: "NÃO", value: meta.nao }]}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#34A853" name="Meta" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bloco 4 – Gráfico de Crescimento (barra empilhada) */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80">
        <h2 className="text-lg font-medium text-slate-800 mb-4">Distribuição do Crescimento</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[
            { label: "Positivo", value: crescimento.positivo },
            { label: "Zero", value: crescimento.zero },
            { label: "Negativo", value: crescimento.negativo },
          ]}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#34A853" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Demais blocos podem ser adicionados seguindo o mesmo padrão – IDEB por Etapa, IDEB por DRE, etc. */}
    </section>
  );
}
