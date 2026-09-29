"use client";

import { useEffect, useState, useCallback } from "react";
import * as XLSX from "xlsx";
import TopBar from "@/components/TopBar";
import HeaderGov from "@/components/HeaderGov";
import NavBar from "@/components/NavBar";
import Breadcrumb from "@/components/Breadcrumb";
import HeaderBanner from "@/components/HeaderBanner";
import KpiCards, { CardFilterType } from "@/components/KpiCards";
import FilterBar from "@/components/FilterBar";
import TabTodas from "@/components/TabTodas";
import TabPublicadas from "@/components/TabPublicadas";
import TabNaoPublicadas from "@/components/TabNaoPublicadas";
import TabAlfabetizacao from "@/components/TabAlfabetizacao";
import TabEjaAee from "@/components/TabEjaAee";
import TabPontosBonusDre from "@/components/TabPontosBonusDre";
import TabGraficos from "@/components/TabGraficos";
import SchoolDrawer from "@/components/SchoolDrawer";
import FooterGov from "@/components/FooterGov";
import type { Escola, KpiData, FiltrosData, TabType } from "@/lib/types";
import { School, AlertCircle, BookOpen, BarChart3, Award, GraduationCap, LayoutGrid } from "lucide-react";

const TAB_LABELS: Record<TabType, string> = {
  todas: "Todas as Escolas",
  publicadas: "Escolas Publicadas",
  nao_publicadas: "Não Publicadas — Pendência de Fluxo",
  alfabetizacao: "Alfabetização (1º e 2º Ano)",
  eja_aee: "Bônus EJA e AEE",
  pontos_bonus_dre: "Pontos de Bônus — DRE",
  graficos: "Painel Analítico — Gráficos",
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("publicadas");
  const [kpiData, setKpiData] = useState<KpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  const [filtros, setFiltros] = useState<FiltrosData | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [dre, setDre] = useState("");
  const [etapa, setEtapa] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [rede, setRede] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [regiaoIntegracao, setRegiaoIntegracao] = useState("");
  const [destaqueRi, setDestaqueRi] = useState("");

  // Card Interactive Filter state (Supervisão / Relatório Executivo)
  const [cardFilter, setCardFilter] = useState<CardFilterType>(null);

  // Table & pagination state
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [ejaData, setEjaData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Drawer — armazena código E etapa da linha clicada para contexto correto
  const [selectedSchool, setSelectedSchool] = useState<{ codigo: string; etapa: string | null } | null>(null);
  const [exporting, setExporting] = useState(false);

  // 1. Fetch KPIs com Reatividade Imediata aos Filtros do Topo
  const loadKpis = useCallback(async () => {
    try {
      setKpiLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (dre) params.set("dre", dre);
      if (etapa) params.set("etapa", etapa);
      if (municipio) params.set("municipio", municipio);
      if (rede) params.set("rede", rede);
      if (localizacao) params.set("localizacao", localizacao);
      if (regiaoIntegracao) params.set("regiao_integracao", regiaoIntegracao);
      if (destaqueRi) params.set("destaque_ri", destaqueRi);

      const res = await fetch(`/api/kpis?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKpiData(data);
      }
    } catch (err) {
      console.error("Erro ao carregar KPIs:", err);
    } finally {
      setKpiLoading(false);
    }
  }, [search, dre, etapa, municipio, rede, localizacao, regiaoIntegracao, destaqueRi]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  // 2. Fetch Filters Options
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

  // 3. Fetch Escolas / EJA / Alfabetização (DRE e Gráficos gerenciam suas próprias buscas)
  const fetchData = useCallback(async () => {
    if (activeTab === "pontos_bonus_dre" || activeTab === "graficos") return;
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", pageSize.toString());
      if (search.trim()) params.set("search", search.trim());
      if (dre) params.set("dre", dre);
      if (etapa) params.set("etapa", etapa);
      if (municipio) params.set("municipio", municipio);
      if (rede) params.set("rede", rede);
      if (localizacao) params.set("localizacao", localizacao);
      if (regiaoIntegracao) params.set("regiao_integracao", regiaoIntegracao);
      if (destaqueRi) params.set("destaque_ri", destaqueRi);
      if (cardFilter) params.set("card_filter", cardFilter);

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
  }, [
    activeTab,
    page,
    pageSize,
    search,
    dre,
    etapa,
    municipio,
    rede,
    localizacao,
    regiaoIntegracao,
    destaqueRi,
    cardFilter,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers para Filtros com Reset de Paginação
  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleDreChange = (v: string) => {
    setDre(v);
    setPage(1);
  };
  const handleEtapaChange = (v: string) => {
    setEtapa(v);
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
  const handleRegiaoIntegracaoChange = (v: string) => {
    setRegiaoIntegracao(v);
    setPage(1);
  };
  const handleDestaqueRiChange = (v: string) => {
    setDestaqueRi(v);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setDre("");
    setEtapa("");
    setMunicipio("");
    setRede("");
    setLocalizacao("");
    setRegiaoIntegracao("");
    setDestaqueRi("");
    setCardFilter(null);
    setPage(1);
  };

  const handleReset = () => {
    handleClearFilters();
    setActiveTab("publicadas");
    setSelectedSchool(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler para Mini-Cards Analíticos como Filtro Rápido
  const handleCardFilterChange = (filter: CardFilterType) => {
    setCardFilter(filter);
    setPage(1);
    // Se o usuário estiver em DRE ou Gráficos, muda para escolas publicadas para visualizar o relatório
    if (activeTab === "pontos_bonus_dre" || activeTab === "graficos") {
      setActiveTab("publicadas");
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Export to Excel (Respeita filtros de busca e o filtro do card analítico ativo)
  const handleExport = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      params.set("export", "true");
      if (search.trim()) params.set("search", search.trim());
      if (dre) params.set("dre", dre);
      if (etapa) params.set("etapa", etapa);
      if (municipio) params.set("municipio", municipio);
      if (rede) params.set("rede", rede);
      if (localizacao) params.set("localizacao", localizacao);
      if (regiaoIntegracao) params.set("regiao_integracao", regiaoIntegracao);
      if (destaqueRi) params.set("destaque_ri", destaqueRi);
      if (cardFilter) params.set("card_filter", cardFilter);

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
      } else if (activeTab === "alfabetizacao") {
        sheetName = "Alfabetização 1º e 2º";
        params.set("tipo", "alfabetizacao");
        const res = await fetch(`/api/escolas?${params.toString()}`);
        if (!res.ok) throw new Error("Falha ao buscar base de alfabetização");
        const json = await res.json();
        const rawData = json.data || [];

        rowsToExport = rawData.map((e: any) => {
          const metaAtingida =
            e.meta_alfabetizacao_atingida ||
            (e.atingiu_meta !== null && Number(e.atingiu_meta) >= 1) ||
            (e.bonus_professor !== null && Number(e.bonus_professor) >= 1);
          const fator = e.bonus_professor !== null ? Number(e.bonus_professor) : metaAtingida ? 1.0 : 0.0;

          return {
            "Código INEP": e.codigo_escola,
            "Nome da Escola": e.nome_escola,
            "Município": e.municipio,
            "DRE / Regional": e.regional_dre || "—",
            "Região de Integração (RI)": e.regiao_integracao || "—",
            "Oferta de Alfabetização": "Sim (1º e 2º)",
            "Situação da Meta": metaAtingida ? "Atingida (1,0)" : "Não Atingida (0,0)",
            "Fator Docente Específico": fator,
          };
        });
      } else if (activeTab === "pontos_bonus_dre") {
        sheetName = "Pontos de Bônus DRE";
        const res = await fetch(`/api/pontos-bonus-dre?${params.toString()}`);
        if (!res.ok) throw new Error("Falha ao buscar pontos de bônus DRE");
        const json = await res.json();
        const rawData = json.data || [];

        rowsToExport = rawData.map((r: any, idx: number) => ({
          "Posição": `${idx + 1}º`,
          "Diretoria Regional de Ensino (DRE)": r.dre,
          "Pontos de Bônus": r.pontos_bonus !== null ? Number(r.pontos_bonus) : "—",
          "Matrícula Etapa": r.matricula !== null ? Number(r.matricula) : "—",
          "Bônus Etapa": r.bonus_etapa !== null ? Number(r.bonus_etapa) : "—",
          "Bônus Regional (RI)": r.bonus_ri !== null ? Number(r.bonus_ri) : "—",
          "Bônus Total DRE": r.bonus_total !== null ? Number(r.bonus_total) : "—",
          "Matrícula Total": r.matricula_total !== null ? Number(r.matricula_total) : "—",
        }));
      } else {
        params.set("tipo", activeTab);
        sheetName =
          activeTab === "todas"
            ? "Todas as Escolas"
            : activeTab === "publicadas"
            ? "Escolas Publicadas"
            : "Não Publicadas";
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
            "Fator Multiplicador Docente": e.bonus_professor !== null ? Number(e.bonus_professor) : "—",
            "Fator Multiplicador Administrativo": e.bonus_administrativo !== null ? Number(e.bonus_administrativo) : "—",
            "Oferta Alfabetização": e.oferta_alfabetizacao ? "SIM" : "NÃO",
            "Meta Alfabetização Atingida": e.oferta_alfabetizacao ? (e.meta_alfabetizacao_atingida ? "SIM" : "NÃO") : "—",
            "Região de Integração (RI)": e.regiao_integracao || "—",
            "14º Salário (Meta)": e.atingiu_meta !== null ? (metaAtingida ? "SIM" : "NÃO") : "—",
            "15º Salário (Crescimento)": (Number(e.ponto_crescimento) || 0) > 0 ? "SIM" : "NÃO",
            "16º Salário (Destaque RI)": e.elegivel_16_salario ? "SIM" : "NÃO",
            "Situação Premiação RI": e.status_premiacao_ri || "NÃO ELEGÍVEL",
            "Motivo 16º Salário": e.motivo_16_salario || "—",
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
      const suffix = cardFilter ? `_${cardFilter.toUpperCase()}` : "";
      XLSX.writeFile(
        wb,
        `SEDUC_${sheetName.replace(/\s+/g, "_")}${suffix}_Completo_${new Date().toISOString().slice(0, 10)}.xlsx`
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
      <HeaderGov onReset={handleReset} />

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
        <Breadcrumb currentTabName={TAB_LABELS[activeTab]} onReset={handleReset} />

        {/* 1. FILTROS NO TOPO ABSOLUTO (Acima de todas as fileiras de cards de KPI) */}
        <FilterBar
          filtros={filtros}
          search={search}
          onSearchChange={handleSearchChange}
          dre={dre}
          onDreChange={handleDreChange}
          etapa={etapa}
          onEtapaChange={handleEtapaChange}
          municipio={municipio}
          onMunicipioChange={handleMunicipioChange}
          rede={rede}
          onRedeChange={handleRedeChange}
          localizacao={localizacao}
          onLocalizacaoChange={handleLocalizacaoChange}
          regiaoIntegracao={regiaoIntegracao}
          onRegiaoIntegracaoChange={handleRegiaoIntegracaoChange}
          destaqueRi={destaqueRi}
          onDestaqueRiChange={handleDestaqueRiChange}
          onExport={handleExport}
          exporting={exporting}
          onClearFilters={handleClearFilters}
          totalFilteredRecords={totalRecords}
        />

        {/* 2. CARDS DE KPI (Reativos ao filtro do topo + Interativos como Filtros Rápidos / Relatório Executivo) */}
        {activeTab !== "graficos" && (
          <KpiCards
            data={kpiData}
            loading={kpiLoading}
            activeCardFilter={cardFilter}
            onCardFilterChange={handleCardFilterChange}
          />
        )}

        {/* 3. Seletor de Abas — Segmented Control Institucional */}
        <section aria-label="Tabelas de Resultados" className="space-y-4">
          <div className="flex items-center overflow-x-auto no-scrollbar py-1">
            <div
              role="tablist"
              aria-label="Seleção de Visualização"
              className="inline-flex p-1 bg-slate-100 rounded-xl gap-1 max-w-full overflow-x-auto"
            >
              {/* Nova Aba: Todas as Escolas */}
              <button
                role="tab"
                aria-selected={activeTab === "todas"}
                onClick={() => handleTabChange("todas")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "todas"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <LayoutGrid className="w-4 h-4 text-slate-400" />
                <span>Todas as Escolas</span>
                {kpiData?.total_escolas !== undefined && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                      activeTab === "todas"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-200/50 text-slate-500"
                    }`}
                  >
                    {kpiData.total_escolas.toLocaleString("pt-BR")}
                  </span>
                )}
              </button>

              {/* Aba: Escolas Publicadas */}
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

              {/* Aba: Não Publicadas */}
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

              {/* Nova Aba: Alfabetização (1º e 2º Ano) */}
              <button
                role="tab"
                aria-selected={activeTab === "alfabetizacao"}
                onClick={() => handleTabChange("alfabetizacao")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "alfabetizacao"
                    ? "bg-white text-teal-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${activeTab === "alfabetizacao" ? "text-teal-600" : "text-slate-400"}`} />
                <span>Alfabetização (1º e 2º)</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                    activeTab === "alfabetizacao"
                      ? "bg-teal-50 text-teal-800 border border-teal-200"
                      : "bg-slate-200/50 text-slate-500"
                  }`}
                >
                  {kpiData?.total_alfabetizacao ?? 144}
                </span>
              </button>

              {/* Aba: Bônus EJA e AEE */}
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

              {/* Aba Renomeada: Pontos de Bônus — DRE */}
              <button
                role="tab"
                aria-selected={activeTab === "pontos_bonus_dre"}
                onClick={() => handleTabChange("pontos_bonus_dre")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "pontos_bonus_dre"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <Award className={`w-4 h-4 ${activeTab === "pontos_bonus_dre" ? "text-amber-600" : "text-slate-400"}`} />
                <span>Pontos de Bônus — DRE</span>
              </button>

              {/* Aba: Gráficos Executivos */}
              <button
                role="tab"
                aria-selected={activeTab === "graficos"}
                onClick={() => handleTabChange("graficos")}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "graficos"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Gráficos</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                    activeTab === "graficos"
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-slate-200/50 text-slate-500"
                  }`}
                >
                  Executivo
                </span>
              </button>
            </div>
          </div>

          {/* Conteúdo das Abas com Paginação Integrada */}
          <div>
            {activeTab === "todas" && (
              <TabTodas
                data={escolas}
                loading={tableLoading}
                onSelectEscola={(cod, etapa) => setSelectedSchool({ codigo: cod, etapa: etapa ?? null })}
                onClearFilters={handleClearFilters}
                pagination={paginationProps}
              />
            )}

            {activeTab === "publicadas" && (
              <TabPublicadas
                data={escolas}
                loading={tableLoading}
                onSelectEscola={(cod, etapa) => setSelectedSchool({ codigo: cod, etapa: etapa ?? null })}
                onClearFilters={handleClearFilters}
                pagination={paginationProps}
              />
            )}

            {activeTab === "nao_publicadas" && (
              <TabNaoPublicadas
                data={escolas}
                loading={tableLoading}
                onSelectEscola={(cod, etapa) => setSelectedSchool({ codigo: cod, etapa: etapa ?? null })}
                onClearFilters={handleClearFilters}
                pagination={paginationProps}
              />
            )}

            {activeTab === "alfabetizacao" && (
              <TabAlfabetizacao
                data={escolas}
                loading={tableLoading}
                onSelectEscola={(cod, etapa) => setSelectedSchool({ codigo: cod, etapa: etapa ?? null })}
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

            {activeTab === "pontos_bonus_dre" && (
              <TabPontosBonusDre dre={dre} />
            )}

            {activeTab === "graficos" && (
              <TabGraficos
                dre={dre}
                regiaoIntegracao={regiaoIntegracao}
                etapa={etapa}
                onSelectEscola={(cod, etapa) => setSelectedSchool({ codigo: cod, etapa: etapa ?? null })}
              />
            )}
          </div>
        </section>
      </main>

      {/* Ficha 360° da Escola no Drawer Lateral */}
      {selectedSchool && (
        <SchoolDrawer
          codigoEscola={selectedSchool.codigo}
          etapa={selectedSchool.etapa}
          onClose={() => setSelectedSchool(null)}
        />
      )}

      {/* 6. Rodapé Institucional */}
      <FooterGov />
    </div>
  );
}
