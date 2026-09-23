"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import HeaderBanner from "@/components/HeaderBanner";
import KpiCards from "@/components/KpiCards";
import FilterBar from "@/components/FilterBar";
import TabPublicadas from "@/components/TabPublicadas";
import TabNaoPublicadas from "@/components/TabNaoPublicadas";
import TabEjaAee from "@/components/TabEjaAee";
import TabIdebDre from "@/components/TabIdebDre";
import SchoolDrawer from "@/components/SchoolDrawer";
import type { Escola, KpiData, FiltrosData } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

type TabType = "publicadas" | "nao_publicadas" | "eja_aee" | "ideb_dre";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("publicadas");
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  const [filtros, setFiltros] = useState<FiltrosData | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [dre, setDre] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [rede, setRede] = useState("");
  const [localizacao, setLocalizacao] = useState("");

  // Table state
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [ejaData, setEjaData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Drawer
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch KPIs
  useEffect(() => {
    async function loadKpis() {
      try {
        setKpiLoading(true);
        const res = await fetch("/api/kpis");
        if (res.ok) {
          const data = await res.json();
          setKpiData(data);
        }
      } catch (err) {
        console.error("Erro ao carregar KPIs:", err);
      } finally {
        setKpiLoading(false);
      }
    }
    loadKpis();
  }, []);

  // Fetch Filters Options
  useEffect(() => {
    async function loadFiltros() {
      try {
        const res = await fetch("/api/filtros");
        if (res.ok) {
          const data = await res.json();
          setFiltros(data);
        }
      } catch (err) {
        console.error("Erro ao carregar filtros:", err);
      }
    }
    loadFiltros();
  }, []);

  // Fetch Escolas / EJA (IDEB tab gerencia seu próprio fetch)
  const fetchData = useCallback(async () => {
    if (activeTab === "ideb_dre") return;
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      if (search.trim()) params.set("search", search.trim());
      if (dre) params.set("dre", dre);
      if (municipio) params.set("municipio", municipio);
      if (rede) params.set("rede", rede);
      if (localizacao) params.set("localizacao", localizacao);

      if (activeTab === "eja_aee") {
        const res = await fetch(`/api/eja-aee?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setEjaData(json.data || []);
          setTotalPages(json.totalPages || 1);
          setTotalRecords(json.total || 0);
        }
      } else {
        params.set("tipo", activeTab);
        const res = await fetch(`/api/escolas?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setEscolas(json.data || []);
          setTotalPages(json.totalPages || 1);
          setTotalRecords(json.total || 0);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setTableLoading(false);
    }
  }, [activeTab, page, search, dre, municipio, rede, localizacao]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page when filters change
  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleDreChange = (v: string) => {
    setDre(v);
    setPage(1);
  };
  const handleMunicipioChange = (v: string) => {
    setMunicipio(v);
    setPage(1);
  };
  const handleRedeChange = (v: string) => {
    setRede(v);
    setPage(1);
  };
  const handleLocalizacaoChange = (v: string) => {
    setLocalizacao(v);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDre("");
    setMunicipio("");
    setRede("");
    setLocalizacao("");
    setPage(1);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Export to Excel (Baixa a base completa com os filtros ativos)
  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      params.set("export", "true");
      if (search.trim()) params.set("search", search.trim());
      if (dre) params.set("dre", dre);
      if (municipio) params.set("municipio", municipio);
      if (rede) params.set("rede", rede);
      if (localizacao) params.set("localizacao", localizacao);

      let rowsToExport: Record<string, any>[] = [];
      let sheetName = "Dados";

      if (activeTab === "eja_aee") {
        sheetName = "EJA e AEE";
        const res = await fetch(`/api/eja-aee?${params.toString()}`);
        if (!res.ok) throw new Error("Falha ao buscar base completa de EJA/AEE");
        const json = await res.json();
        const rawData = json.data || [];

        rowsToExport = rawData.map((r: any) => ({
          "Código INEP": r.codigo_escola,
          "Nome da Escola": r.nome_escola,
          "Município": r.municipio,
          "DRE / Regional": r.regional || "—",
          "Localização": r.localizacao || "—",
          "Escola Indígena": r.escola_indigena ? "Sim" : "Não",
          "Tem Publicação": r.tem_publicacao ? "Sim" : "Não",
          "EJA Fund. Iniciais": r.eja_fundamental_iniciais !== null ? Number(r.eja_fundamental_iniciais) : "—",
          "EJA Fund. Finais": r.eja_fundamental_finais !== null ? Number(r.eja_fundamental_finais) : "—",
          "EJA Médio": r.eja_medio !== null ? Number(r.eja_medio) : "—",
          "Atendimento Especializado (AEE)": r.atendimento_especializado_aee !== null ? Number(r.atendimento_especializado_aee) : "—",
        }));
      } else {
        params.set("tipo", activeTab);
        sheetName = activeTab === "publicadas" ? "Escolas Publicadas" : "Não Publicadas";
        const res = await fetch(`/api/escolas?${params.toString()}`);
        if (!res.ok) throw new Error("Falha ao buscar base completa de escolas");
        const json = await res.json();
        const rawData = json.data || [];

        rowsToExport = rawData.map((e: any) => {
          const metaAtingida = e.atingiu_meta !== null && Number(e.atingiu_meta) >= 1;
          return {
            "Código INEP": e.codigo_escola,
            "Nome da Escola": e.nome_escola,
            "Município": e.municipio,
            "DRE / Regional": e.regional_dre || "—",
            "Localização": e.localizacao || "—",
            "Rede": e.rede || "REGULAR",
            "Status": e.status_publicacao,
            "Etapa": e.etapa_ensino
              ? e.etapa_ensino.replace("ENSINO ", "").replace("FUNDAMENTAL ", "EF ").replace("MEDIO", "MÉDIO")
              : "—",
            "Meta Atingida": e.atingiu_meta !== null ? (metaAtingida ? "SIM" : "NÃO") : "—",
            "Ponto Crescimento": e.ponto_crescimento !== null ? Number(e.ponto_crescimento) : "—",
            "Fluxo": e.fluxo !== null ? Number(e.fluxo) : "—",
            "Bônus Professor": e.bonus_professor !== null ? Number(e.bonus_professor) : "—",
            "Bônus Administrativo": e.bonus_administrativo !== null ? Number(e.bonus_administrativo) : "—",
            "Bônus EJA Iniciais": e.bonus_eja_iniciais !== null ? Number(e.bonus_eja_iniciais) : "—",
            "Bônus EJA Finais": e.bonus_eja_finais !== null ? Number(e.bonus_eja_finais) : "—",
            "Bônus EJA Médio": e.bonus_eja_medio !== null ? Number(e.bonus_eja_medio) : "—",
            "Bônus AEE": e.bonus_aee !== null ? Number(e.bonus_aee) : "—",
          };
        });
      }

      if (rowsToExport.length === 0) {
        alert("Nenhum registro encontrado com os filtros selecionados para exportação.");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(rowsToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(
        wb,
        `SEDUC_${sheetName.replace(/\s+/g, "_")}_Completo_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
    } catch (err) {
      console.error("Erro na exportação para Excel:", err);
      alert("Ocorreu um erro ao gerar a planilha completa.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] text-[#1A1A1A] flex flex-col">
      {/* Header Banner Oficial */}
      <HeaderBanner />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* KPI Cards */}
        <KpiCards data={kpiData} loading={kpiLoading} />

        {/* Filter Bar */}
        <FilterBar
          filtros={filtros}
          search={search}
          onSearchChange={handleSearchChange}
          dre={dre}
          onDreChange={handleDreChange}
          municipio={municipio}
          onMunicipioChange={handleMunicipioChange}
          rede={rede}
          onRedeChange={handleRedeChange}
          localizacao={localizacao}
          onLocalizacaoChange={handleLocalizacaoChange}
          onExport={handleExport}
          exporting={exporting}
          onClearFilters={handleClearFilters}
        />

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] space-x-2">
          <button
            onClick={() => handleTabChange("publicadas")}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === "publicadas"
                ? "border-[#9E0018] text-[#9E0018] bg-white"
                : "border-transparent text-[#4A5568] hover:text-[#1A1A1A] hover:bg-white/50"
            }`}
          >
            Escolas Publicadas ({kpiData?.escolas_publicadas ?? "..."})
          </button>
          <button
            onClick={() => handleTabChange("nao_publicadas")}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === "nao_publicadas"
                ? "border-[#9E0018] text-[#9E0018] bg-white"
                : "border-transparent text-[#4A5568] hover:text-[#1A1A1A] hover:bg-white/50"
            }`}
          >
            Não Publicadas — Pendência de Fluxo ({kpiData?.escolas_nao_publicadas ?? "..."})
          </button>
          <button
            onClick={() => handleTabChange("eja_aee")}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === "eja_aee"
                ? "border-[#9E0018] text-[#9E0018] bg-white"
                : "border-transparent text-[#4A5568] hover:text-[#1A1A1A] hover:bg-white/50"
            }`}
          >
            Bônus EJA e AEE ({kpiData?.escolas_eja_aee ?? "..."})
          </button>
          <button
            onClick={() => handleTabChange("ideb_dre")}
            className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === "ideb_dre"
                ? "border-[#9E0018] text-[#9E0018] bg-white"
                : "border-transparent text-[#4A5568] hover:text-[#1A1A1A] hover:bg-white/50"
            }`}
          >
            IDEB por DRE
          </button>
        </div>

        {/* Tab Contents */}
        <div>
          {activeTab === "publicadas" && (
            <TabPublicadas
              data={escolas}
              loading={tableLoading}
              onSelectEscola={(cod) => setSelectedSchoolCode(cod)}
              onClearFilters={handleClearFilters}
            />
          )}

          {activeTab === "nao_publicadas" && (
            <TabNaoPublicadas
              data={escolas}
              loading={tableLoading}
              onSelectEscola={(cod) => setSelectedSchoolCode(cod)}
              onClearFilters={handleClearFilters}
            />
          )}

          {activeTab === "eja_aee" && (
            <TabEjaAee
              data={ejaData}
              loading={tableLoading}
              onClearFilters={handleClearFilters}
            />
          )}

          {activeTab === "ideb_dre" && (
            <TabIdebDre dre={dre} />
          )}
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && activeTab !== "ideb_dre" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-sm">
            <span className="text-sm text-[#4A5568]">
              Mostrando página <strong className="text-[#1A1A1A]">{page}</strong> de{" "}
              <strong className="text-[#1A1A1A]">{totalPages}</strong> ({totalRecords} registros encontrados)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || tableLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3.5 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#FDF2F4] hover:text-[#9E0018] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                disabled={page >= totalPages || tableLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3.5 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#1A1A1A] hover:bg-[#FDF2F4] hover:text-[#9E0018] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Drawer Lateral */}
      {selectedSchoolCode && (
        <SchoolDrawer
          codigoEscola={selectedSchoolCode}
          onClose={() => setSelectedSchoolCode(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#E2E8F0] py-6 text-center text-xs text-[#4A5568]">
        <p>SEDUC &mdash; Secretaria de Estado de Educação do Pará | SECTET | Exercício 2025</p>
      </footer>
    </div>
  );
}
