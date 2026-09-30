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
  ponto_regiao_integracao?: number | null;
  ponto_alfabetizacao?: number | null;
  etapa_ensino: string | null;
  etapa?: string | null;
  /** Alfabetização (1º e 2º ano) - Lei Estadual nº 10.435/2024 */
  oferta_alfabetizacao?: boolean;
  meta_alfabetizacao_atingida?: boolean;
  /** 16º Salário: destaque regional por RI (homologação oficial) */
  elegivel_16_salario?: boolean;
  motivo_16_salario?: string | null;
  status_premiacao_ri?: string | null;
}

export type TabType =
  | "todas"
  | "publicadas"
  | "nao_publicadas"
  | "alfabetizacao"
  | "eja_aee"
  | "pontos_bonus_dre"
  | "graficos";

export interface KpiData {
  total_escolas: number;
  escolas_publicadas: number;
  escolas_nao_publicadas: number;
  escolas_eja_aee: number;
  total_alfabetizacao?: number;
  // Segunda fileira de KPIs analíticos
  total_meta_sim?: number;
  total_crescimento_positivo?: number;
  total_somente_fluxo?: number;
  total_fator_zero?: number;
}

export interface PontosBonusDreRow {
  ordem?: number | null;
  dre: string;
  matricula_total?: number | null;
  bonus_ai?: number | null;
  bonus_af?: number | null;
  bonus_em?: number | null;
  bonus_ri?: number | null;
  bonus_total: number | null;
  pontos_bonus?: number | null;
  matricula?: number | null;
  bonus_etapa?: number | null;
}

export interface FiltrosData {
  dres: string[];
  municipios: string[];
  redes: string[];
  localizacoes: string[];
  regioes_integracao: string[];
  etapas?: string[];
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

export interface ModalidadeDetalhesIdeb {
  meta: number;
  crescimento: number;
  destaque_ri: number;
  fluxo: number;
}

export interface ModalidadeBonus {
  id: "ideb" | "aee" | "eja" | "alfabetizacao" | string;
  nome: string;
  valor: number;
  descricao?: string;
  detalhes?: ModalidadeDetalhesIdeb;
  color?: string;
  percent?: number;
}

export interface ItemComposicaoBonus {
  name: string;
  value: number;
  percent: number;
  color: string;
  descricao?: string;
}

export interface DashboardGraficosData {
  total_rede: number;
  exercicio: string;
  base_legal: string;
  modalidades: ModalidadeBonus[];
  composicao_bonus?: ItemComposicaoBonus[];
  total_pontos?: number;
  detalhes_ideb?: ModalidadeDetalhesIdeb;
  filtros_aplicados?: {
    dre?: string | null;
    municipio?: string | null;
    regiao_integracao?: string | null;
    etapa?: string | null;
  };
}

