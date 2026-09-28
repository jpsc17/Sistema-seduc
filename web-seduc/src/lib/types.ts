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

// Interfaces para a nova API /api/graficos
export interface SituacaoRedeItem {
  label: string;
  quantidade: number;
  percentual: number;
}

export interface MetaCrescimentoItem {
  label: string;
  quantidade: number;
  percentual: number;
}

export interface IdebEtapa {
  etapa: string;
  mediaIdeb: number;
}

export interface IdebDre {
  dre: string;
  mediaIdeb: number;
}

export interface IdebRi {
  ri: string;
  mediaIdeb: number;
}

export interface DestaqueRi {
  ri: string;
  etapa: string;
  escola: string;
  inep: string;
  indicador: "IDEB" | "Crescimento";
  valor: number;
}

export interface EjaAeeItem {
  modalidade: "EJA" | "AEE";
  quantidade: number;
}

export interface PontosDre {
  dre: string;
  pontuacao: number;
}

export interface GraficoResumo {
  totalEscolas: number;
  publicadas: number;
  naoPublicadas: number;
  percentualPublicadas: number;
  percentualNaoPublicadas: number;
  registrosEjaAee: number;
  regioesIntegracao: number;
}

export interface GraficosResponse {
  resumo: GraficoResumo;
  situacaoRede: SituacaoRedeItem[];
  meta: { sim: number; nao: number };
  crescimento: { positivo: number; zero: number; negativo: number };
  idebPorEtapa: IdebEtapa[];
  idebPorDre: IdebDre[];
  idebPorRi: IdebRi[];
  destaquesRi: DestaqueRi[];
  ejaAee: EjaAeeItem[];
  pontosDre: PontosDre[];
}
