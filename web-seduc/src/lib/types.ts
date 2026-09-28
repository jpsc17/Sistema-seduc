export interface Escola {
  codigo_escola: string;
  nome_escola: string;
  municipio: string;
  regional_dre: string | null;
  regiao_integracao: string | null;
  localizacao: string | null;
  escola_indigena: boolean;
  rede: string;
  status_publicacao: string;
  bonus_professor: number | null;
  bonus_administrativo: number | null;
  bonus_eja_iniciais: number | null;
  bonus_eja_finais: number | null;
  bonus_eja_medio: number | null;
  bonus_aee: number | null;
  atingiu_meta: number | null;
  ponto_crescimento: number | null;
  fluxo: number | null;
  etapa_ensino: string | null;
  etapa?: string | null;
  /** 16º Salário: destaque regional por RI (calculado pela view via RANK) */
  elegivel_16_salario?: boolean;
  motivo_16_salario?: string | null;
}

export interface KpiData {
  total_escolas: number;
  escolas_publicadas: number;
  escolas_nao_publicadas: number;
  escolas_eja_aee: number;
}

export interface FiltrosData {
  dres: string[];
  municipios: string[];
  redes: string[];
  localizacoes: string[];
  regioes_integracao: string[];
  dreMunicipios?: Record<string, string[]>;
}

/** Lista canônica das 12 Regiões de Integração do Pará (IDESP/SEDUC-PA) */
export const REGIOES_INTEGRACAO_PARA = [
  "ARAGUAIA",
  "BAIXO AMAZONAS",
  "CARAJÁS",
  "GUAJARÁ",
  "GUAMÁ",
  "LAGO DE TUCURUÍ",
  "MARAJÓ",
  "METROPOLITANA",
  "RIO CAETÉ",
  "RIO CAPIM",
  "TAPAJÓS",
  "TOCANTINS",
] as const;

export type RegiaoIntegracao = typeof REGIOES_INTEGRACAO_PARA[number];

export interface DashboardGraficosData {
  resumo: {
    totalEscolas: number;              // 972 (COUNT DISTINCT dim_escolas)
    publicadas: number;                 // 895
    naoPublicadas: number;              // 77
    percentualPublicadas: number;       // ~92.08%
    percentualNaoPublicadas: number;    // ~7.92%
    registrosEjaAee: number;            // 924
    totalRegioesIntegracao: number;     // 12
  };
  situacaoRede: Array<{ nome: string; valor: number; percentual: number }>;
  metaCrescimento: {
    metaSim: number;
    metaNao: number;
    crescimentoPositivo: number;
    crescimentoZero: number;
    matriz: Array<{
      categoria: 'Meta + Crescimento' | 'Apenas Meta' | 'Apenas Crescimento' | 'Nenhum';
      quantidade: number;
      percentual: number;
      impactoSalario: '14º e 15º' | '14º Salário' | '15º Salário' | 'Sem Bônus Extra';
    }>;
  };
  ideb: {
    porEtapa: Array<{ etapa: string; mediaIdeb: number }>;
    porDre: Array<{ dre: string; etapa?: string; mediaIdeb: number; fluxo: number }>;
    proficienciaDre: Array<{ dre: string; lp: number; mat: number }>;
  };
  regioesIntegracao: {
    porRi: Array<{ ri: string; mediaIdeb: number }>;
    destaques16: Array<{
      ri: string;
      etapa: string;
      escolaMaiorIdeb: { inep: string; nome: string; valor: number };
      escolaMaiorCrescimento: { inep: string; nome: string; valor: number };
    }>;
  };
  modalidadesEPontos: {
    ejaAeePorDre: Array<{ dre: string; total: number }>;
    pontosPorDre: Array<{ dre: string; totalPontos: number }>;
  };
}

