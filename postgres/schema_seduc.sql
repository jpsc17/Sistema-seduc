-- ====================================================================
-- SISTEMA SEDUC - ESQUEMA DE BANCO DE DADOS POSTGRESQL
-- Gerado automaticamente a partir dos relatórios em PDF
-- ====================================================================

CREATE SCHEMA IF NOT EXISTS seduc;
SET search_path TO seduc, public;

DROP TABLE IF EXISTS seduc.seduc_bonus_eja_aee CASCADE;
CREATE TABLE seduc.seduc_bonus_eja_aee (
id BIGSERIAL PRIMARY KEY,
    regional VARCHAR(255),
    municipio VARCHAR(255),
    localizacao VARCHAR(100),
    escola_indigena BOOLEAN,
    codigo_escola VARCHAR(20),
    tem_publicacao BOOLEAN,
    nome_escola VARCHAR(255),
    eja_fundamental_iniciais NUMERIC(8,4),
    eja_fundamental_finais NUMERIC(8,4),
    eja_medio NUMERIC(8,4),
    atendimento_especializado_aee NUMERIC(8,4),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_bonus_eja_aee_codigo_escola ON seduc.seduc_bonus_eja_aee(codigo_escola);
CREATE INDEX idx_seduc_bonus_eja_aee_municipio ON seduc.seduc_bonus_eja_aee(municipio);
CREATE INDEX idx_seduc_bonus_eja_aee_regional ON seduc.seduc_bonus_eja_aee(regional);

DROP TABLE IF EXISTS seduc.seduc_nao_publ_regular_admin CASCADE;
CREATE TABLE seduc.seduc_nao_publ_regular_admin (
id BIGSERIAL PRIMARY KEY,
    regional VARCHAR(255),
    municipio VARCHAR(255),
    localizacao VARCHAR(100),
    escola_indigena BOOLEAN,
    codigo_escola VARCHAR(20),
    nome_escola VARCHAR(255),
    indice_bonus_admin NUMERIC(8,4),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_nao_publ_regular_admin_codigo_escola ON seduc.seduc_nao_publ_regular_admin(codigo_escola);
CREATE INDEX idx_seduc_nao_publ_regular_admin_municipio ON seduc.seduc_nao_publ_regular_admin(municipio);
CREATE INDEX idx_seduc_nao_publ_regular_admin_regional ON seduc.seduc_nao_publ_regular_admin(regional);

DROP TABLE IF EXISTS seduc.seduc_nao_publ_regular_prof CASCADE;
CREATE TABLE seduc.seduc_nao_publ_regular_prof (
id BIGSERIAL PRIMARY KEY,
    regional VARCHAR(255),
    municipio VARCHAR(255),
    localizacao VARCHAR(100),
    escola_indigena BOOLEAN,
    codigo_escola VARCHAR(20),
    nome_escola VARCHAR(255),
    ponto_bonus_professor NUMERIC(8,4),
    etapa_ensino VARCHAR(255),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_nao_publ_regular_prof_codigo_escola ON seduc.seduc_nao_publ_regular_prof(codigo_escola);
CREATE INDEX idx_seduc_nao_publ_regular_prof_municipio ON seduc.seduc_nao_publ_regular_prof(municipio);
CREATE INDEX idx_seduc_nao_publ_regular_prof_regional ON seduc.seduc_nao_publ_regular_prof(regional);
CREATE INDEX idx_seduc_nao_publ_regular_prof_etapa ON seduc.seduc_nao_publ_regular_prof(etapa_ensino);

DROP TABLE IF EXISTS seduc.seduc_nao_publ_sectet CASCADE;
CREATE TABLE seduc.seduc_nao_publ_sectet (
id BIGSERIAL PRIMARY KEY,
    regional VARCHAR(255),
    municipio VARCHAR(255),
    localizacao VARCHAR(100),
    escola_indigena BOOLEAN,
    codigo_escola VARCHAR(20),
    nome_escola VARCHAR(255),
    indice_bonus_gestao NUMERIC(8,4),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_nao_publ_sectet_codigo_escola ON seduc.seduc_nao_publ_sectet(codigo_escola);
CREATE INDEX idx_seduc_nao_publ_sectet_municipio ON seduc.seduc_nao_publ_sectet(municipio);
CREATE INDEX idx_seduc_nao_publ_sectet_regional ON seduc.seduc_nao_publ_sectet(regional);

DROP TABLE IF EXISTS seduc.seduc_publ_regular_admin CASCADE;
CREATE TABLE seduc.seduc_publ_regular_admin (
id BIGSERIAL PRIMARY KEY,
    municipio VARCHAR(255),
    localizacao VARCHAR(100),
    codigo_escola VARCHAR(20),
    nome_escola VARCHAR(255),
    matricula_ef_iniciais INTEGER,
    matricula_ef_finais INTEGER,
    matricula_em INTEGER,
    matricula_total INTEGER,
    pontos_ef_iniciais NUMERIC(8,4),
    pontos_ef_finais NUMERIC(8,4),
    pontos_em NUMERIC(8,4),
    ponderado_ef_iniciais NUMERIC(8,4),
    ponderado_ef_finais NUMERIC(8,4),
    ponderado_em NUMERIC(8,4),
    indice_bonus NUMERIC(8,4),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_publ_regular_admin_codigo_escola ON seduc.seduc_publ_regular_admin(codigo_escola);
CREATE INDEX idx_seduc_publ_regular_admin_municipio ON seduc.seduc_publ_regular_admin(municipio);

DROP TABLE IF EXISTS seduc.seduc_publ_regular_prof CASCADE;
CREATE TABLE seduc.seduc_publ_regular_prof (
id BIGSERIAL PRIMARY KEY,
    municipio VARCHAR(255),
    regiao_integracao VARCHAR(100),
    codigo_escola VARCHAR(20),
    nome_escola VARCHAR(255),
    etapa_ensino VARCHAR(255),
    meta_pactuada NUMERIC(8,4),
    decimo_crescimento NUMERIC(8,4),
    ponto_crescimento NUMERIC(8,4),
    ponto_regiao_integracao NUMERIC(8,4),
    ponto_fluxo NUMERIC(8,4),
    ponto_alfabetizacao NUMERIC(8,4),
    bonus_prof_1_e_2_ano NUMERIC(8,4),
    bonus_prof_3_a_5_ano NUMERIC(8,4),
    indice_bonus NUMERIC(8,4),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_publ_regular_prof_codigo_escola ON seduc.seduc_publ_regular_prof(codigo_escola);
CREATE INDEX idx_seduc_publ_regular_prof_municipio ON seduc.seduc_publ_regular_prof(municipio);
CREATE INDEX idx_seduc_publ_regular_prof_etapa ON seduc.seduc_publ_regular_prof(etapa_ensino);

DROP TABLE IF EXISTS seduc.seduc_publ_sectet CASCADE;
CREATE TABLE seduc.seduc_publ_sectet (
id BIGSERIAL PRIMARY KEY,
    municipio VARCHAR(255),
    codigo_escola VARCHAR(20),
    sectet BOOLEAN,
    nome_escola VARCHAR(255),
    atingiu_meta_pactuada NUMERIC(8,4),
    decimo_crescimento NUMERIC(8,4),
    ponto_crescimento NUMERIC(8,4),
    fluxo NUMERIC(8,4),
    bonus_prof_vinculado_turma NUMERIC(8,4),
    bonus_cargo_administrativo NUMERIC(8,4),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_publ_sectet_codigo_escola ON seduc.seduc_publ_sectet(codigo_escola);
CREATE INDEX idx_seduc_publ_sectet_municipio ON seduc.seduc_publ_sectet(municipio);

DROP TABLE IF EXISTS seduc.seduc_pontos_bonus_dre CASCADE;
CREATE TABLE seduc.seduc_pontos_bonus_dre (
id BIGSERIAL PRIMARY KEY,
    ordem INTEGER,
    dre VARCHAR(255),
    pontos_ai NUMERIC(8,4),
    pontos_af NUMERIC(8,4),
    pontos_em NUMERIC(8,4),
    matricula_ai INTEGER,
    matricula_af INTEGER,
    matricula_em INTEGER,
    matricula_total INTEGER,
    bonus_ai NUMERIC(8,4),
    bonus_af NUMERIC(8,4),
    bonus_em NUMERIC(8,4),
    bonus_ri NUMERIC(8,4),
    bonus_total NUMERIC(8,4),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_pontos_bonus_dre_dre ON seduc.seduc_pontos_bonus_dre(dre);

DROP TABLE IF EXISTS seduc.seduc_ideb_dre CASCADE;
CREATE TABLE seduc.seduc_ideb_dre (
id BIGSERIAL PRIMARY KEY,
    ordem INTEGER,
    dre VARCHAR(255),
    etapa_ensino VARCHAR(255),
    desempenho_lingua_portuguesa NUMERIC(8,4),
    desempenho_matematica NUMERIC(8,4),
    nota_padronizada_lp NUMERIC(8,4),
    nota_padronizada_mat NUMERIC(8,4),
    nota_padronizada_media NUMERIC(8,4),
    fluxo_tempo_medio NUMERIC(8,4),
    ideb VARCHAR(100),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados
CREATE INDEX idx_seduc_ideb_dre_dre ON seduc.seduc_ideb_dre(dre);
CREATE INDEX idx_seduc_ideb_dre_etapa ON seduc.seduc_ideb_dre(etapa_ensino);
