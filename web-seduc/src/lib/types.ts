export interface Escola {
  codigo_escola: string;
  nome_escola: string;
  municipio: string;
  regional_dre: string | null;
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
  dreMunicipios?: Record<string, string[]>;
}
