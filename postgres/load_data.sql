-- ====================================================================
-- SCRIPT DE CARGA VIA \copy (PostgreSQL psql)
-- Execute no terminal: psql -U seu_usuario -d seu_banco -f load_data.sql
-- ====================================================================

SET search_path TO seduc, public;

\copy seduc.seduc_bonus_eja_aee (regional, municipio, localizacao, escola_indigena, codigo_escola, tem_publicacao, nome_escola, eja_fundamental_iniciais, eja_fundamental_finais, eja_medio, atendimento_especializado_aee) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_bonus_eja_aee.csv' WITH (FORMAT csv, HEADER true, NULL '');

\copy seduc.seduc_nao_publ_regular_admin (regional, municipio, localizacao, escola_indigena, codigo_escola, nome_escola, indice_bonus_admin) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_nao_publ_regular_admin.csv' WITH (FORMAT csv, HEADER true, NULL '');

\copy seduc.seduc_nao_publ_regular_prof (regional, municipio, localizacao, escola_indigena, codigo_escola, nome_escola, ponto_bonus_professor, etapa_ensino) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_nao_publ_regular_prof.csv' WITH (FORMAT csv, HEADER true, NULL '');

\copy seduc.seduc_nao_publ_sectet (regional, municipio, localizacao, escola_indigena, codigo_escola, nome_escola, indice_bonus_gestao) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_nao_publ_sectet.csv' WITH (FORMAT csv, HEADER true, NULL '');

\copy seduc.seduc_publ_regular_admin (municipio, localizacao, codigo_escola, nome_escola, matricula_ef_iniciais, matricula_ef_finais, matricula_em, matricula_total, pontos_ef_iniciais, pontos_ef_finais, pontos_em, ponderado_ef_iniciais, ponderado_ef_finais, ponderado_em, indice_bonus) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_publ_regular_admin.csv' WITH (FORMAT csv, HEADER true, NULL '');

\copy seduc.seduc_publ_regular_prof (municipio, regiao_integracao, codigo_escola, nome_escola, etapa_ensino, meta_pactuada, decimo_crescimento, ponto_crescimento, ponto_regiao_integracao, ponto_fluxo, ponto_alfabetizacao, bonus_prof_1_e_2_ano, bonus_prof_3_a_5_ano, indice_bonus) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_publ_regular_prof.csv' WITH (FORMAT csv, HEADER true, NULL '');

\copy seduc.seduc_publ_sectet (municipio, codigo_escola, sectet, nome_escola, atingiu_meta_pactuada, decimo_crescimento, ponto_crescimento, fluxo, bonus_prof_vinculado_turma, bonus_cargo_administrativo) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_publ_sectet.csv' WITH (FORMAT csv, HEADER true, NULL '');

\copy seduc.seduc_pontos_bonus_dre (ordem, dre, pontos_ai, pontos_af, pontos_em, matricula_ai, matricula_af, matricula_em, matricula_total, bonus_ai, bonus_af, bonus_em, bonus_ri, bonus_total) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_pontos_bonus_dre.csv' WITH (FORMAT csv, HEADER true, NULL '');

\copy seduc.seduc_ideb_dre (ordem, dre, etapa_ensino, desempenho_lingua_portuguesa, desempenho_matematica, nota_padronizada_lp, nota_padronizada_mat, nota_padronizada_media, fluxo_tempo_medio, ideb) FROM 'C:/Users/J P/OneDrive/Desktop/Sistema Seduc/postgres/data/seduc_ideb_dre.csv' WITH (FORMAT csv, HEADER true, NULL '');
