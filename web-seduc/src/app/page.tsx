"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import TopBar from "@/components/TopBar";
import HeaderGov from "@/components/HeaderGov";
import NavBar from "@/components/NavBar";
import Breadcrumb from "@/components/Breadcrumb";
import HeaderBanner from "@/components/HeaderBanner";
import KpiCards from "@/components/KpiCards";
import FilterBar from "@/components/FilterBar";
import TabPublicadas from "@/components/TabPublicadas";
import TabNaoPublicadas from "@/components/TabNaoPublicadas";
import TabEjaAee from "@/components/TabEjaAee";
import TabIdebDre from "@/components/TabIdebDre";
import SchoolDrawer from "@/components/SchoolDrawer";
import FooterGov from "@/components/FooterGov";
import type { Escola, KpiData, FiltrosData } from "@/lib/types";
import { School, AlertCircle, BookOpen, BarChart3 } from "lucide-react";

type TabType = "publicadas" | "nao_publicadas" | "eja_aee" | "ideb_dre";

const TAB_LABELS: Record<TabType, string> = {
  publicadas: "Escolas Publicadas",
  nao_publicadas: "Não Publicadas — Pendência de Fluxo",
  eja_aee: "Bônus EJA e AEE",
  ideb_dre: "IDEB por Regional DRE",
};

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

  // Table & pagination state
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [ejaData, setEjaData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
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
      params.set("limit", pageSize.toString());
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
  }, [activeTab, page, pageSize, search, dre, municipio, rede, localizacao]);

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

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
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

  const paginationProps = {
    page,
    totalPages,
    totalRecords,
    pageSize,
    onPageChange: setPage,
    onPageSizeChange: handlePageSizeChange,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans">
      {/* 1. Barra Superior Governamental */}
      <TopBar />

      {/* 2. Header Oficial da Instituição */}
      <HeaderGov />

      {/* 3. Barra de Navegação Unificada */}
      <NavBar activeTab={activeTab} onSelectTab={handleTabChange} />

      {/* 4. Cabeçalho e Hero Section Despoluído */}
      <HeaderBanner />

      {/* 5. Área de Conteúdo Principal */}
      <main
        id="conteudo-principal"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
      >
        {/* Breadcrumb Indicador de Localização */}
        <Breadcrumb currentTabName={TAB_LABELS[activeTab]} />

        {/* Cards de KPI Minimalistas */}
        <KpiCards data={kpiData} loading={kpiLoading} />

        {/* Barra de Filtros e Ações (Lei de Hick) */}
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
          totalFilteredRecords={totalRecords}
        />

        {/* Seletor de Abas — Padrão Segmented Control Neutro */}
        <section aria-label="Tabelas de Resultados" className="space-y-4">
          <div className="flex items-center overflow-x-auto no-scrollbar py-1">
            <div
              role="tablist"
              aria-label="Seleção de Visualização"
              className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 max-w-full overflow-x-auto"
            >
              <button
                role="tab"
                aria-selected={activeTab === "publicadas"}
                onClick={() => handleTabChange("publicadas")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "publicadas"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <School className="w-4 h-4 text-slate-400" />
                <span>Escolas Publicadas</span>
                {kpiData?.escolas_publicadas !== undefined && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                      activeTab === "publicadas"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-200/50 text-slate-500"
                    }`}
                  >
                    {kpiData.escolas_publicadas.toLocaleString("pt-BR")}
                  </span>
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "nao_publicadas"}
                onClick={() => handleTabChange("nao_publicadas")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "nao_publicadas"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>Não Publicadas</span>
                {kpiData?.escolas_nao_publicadas !== undefined && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                      activeTab === "nao_publicadas"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-200/50 text-slate-500"
                    }`}
                  >
                    {kpiData.escolas_nao_publicadas.toLocaleString("pt-BR")}
                  </span>
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "eja_aee"}
                onClick={() => handleTabChange("eja_aee")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "eja_aee"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>Bônus EJA e AEE</span>
                {kpiData?.escolas_eja_aee !== undefined && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                      activeTab === "eja_aee"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-200/50 text-slate-500"
                    }`}
                  >
                    {kpiData.escolas_eja_aee.toLocaleString("pt-BR")}
                  </span>
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === "ideb_dre"}
                onClick={() => handleTabChange("ideb_dre")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "ideb_dre"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>IDEB por DRE</span>
              </button>
            </div>
          </div>

          {/* Conteúdo das Abas com Paginação Integrada */}
          <div>
            {activeTab === "publicadas" && (
              <TabPublicadas
                data={escolas}
                loading={tableLoading}
                onSelectEscola={(cod) => setSelectedSchoolCode(cod)}
                onClearFilters={handleClearFilters}
                pagination={paginationProps}
              />
            )}

            {activeTab === "nao_publicadas" && (
              <TabNaoPublicadas
                data={escolas}
                loading={tableLoading}
                onSelectEscola={(cod) => setSelectedSchoolCode(cod)}
                onClearFilters={handleClearFilters}
                pagination={paginationProps}
              />
            )}

            {activeTab === "eja_aee" && (
              <TabEjaAee
                data={ejaData}
                loading={tableLoading}
                onClearFilters={handleClearFilters}
                pagination={paginationProps}
              />
            )}

            {activeTab === "ideb_dre" && (
              <TabIdebDre dre={dre} />
            )}
          </div>
        </section>
      </main>

      {/* Ficha 360° da Escola no Drawer Lateral */}
      {selectedSchoolCode && (
        <SchoolDrawer
          codigoEscola={selectedSchoolCode}
          onClose={() => setSelectedSchoolCode(null)}
        />
      )}

      {/* 6. Rodapé Institucional */}
      <FooterGov />
    </div>
  );
}
