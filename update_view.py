import os
import psycopg2

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:mEeXDegrviFMqbbYCYbklKSQkcbwyOsQ@altaria.proxy.rlwy.net:10883/railway"
)

conn = psycopg2.connect(DATABASE_URL, sslmode="require")
conn.set_client_encoding("UTF8")
cur = conn.cursor()

view_sql = """
CREATE OR REPLACE VIEW seduc.vw_escola_resultado_completo AS
WITH pub_p_expanded AS (
    SELECT 
        codigo_escola,
        municipio,
        regiao_integracao,
        nome_escola,
        etapa_ensino::varchar(255) AS etapa_ensino,
        meta_pactuada,
        ponto_crescimento,
        ponto_fluxo,
        indice_bonus as bonus_professor
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino != 'ENSINO FUNDAMENTAL ANOS INICIAIS'
    
    UNION ALL
    
    SELECT 
        codigo_escola,
        municipio,
        regiao_integracao,
        nome_escola,
        'EF ALFABETIZAÇÃO (1º e 2º)'::varchar(255) as etapa_ensino,
        meta_pactuada,
        ponto_crescimento,
        ponto_fluxo,
        bonus_prof_1_e_2_ano as bonus_professor
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
      AND (bonus_prof_1_e_2_ano > 0 OR ponto_alfabetizacao > 0)
      
    UNION ALL
    
    SELECT 
        codigo_escola,
        municipio,
        regiao_integracao,
        nome_escola,
        'EF ANOS INICIAIS (3º ao 5º)'::varchar(255) as etapa_ensino,
        meta_pactuada,
        ponto_crescimento,
        ponto_fluxo,
        bonus_prof_3_a_5_ano as bonus_professor
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
      AND (bonus_prof_3_a_5_ano > 0 OR (COALESCE(bonus_prof_1_e_2_ano, 0) = 0 AND COALESCE(ponto_alfabetizacao, 0) = 0))
)
SELECT
    e.codigo_escola,
    e.nome_escola,
    e.municipio,
    e.regional_dre,
    e.localizacao,
    e.escola_indigena,
    e.rede,
    CASE
        WHEN pub_p.codigo_escola IS NOT NULL OR pub_a.codigo_escola IS NOT NULL
             OR pub_s.codigo_escola IS NOT NULL
            THEN 'PUBLICADA'
        WHEN np_p.codigo_escola IS NOT NULL OR np_a.codigo_escola IS NOT NULL
             OR np_s.codigo_escola IS NOT NULL
            THEN 'NAO_PUBLICADA'
        WHEN eja.tem_publicacao = TRUE THEN 'PUBLICADA'
        ELSE 'NAO_PUBLICADA'
    END AS status_publicacao,
    COALESCE(
        pub_p.bonus_professor,
        pub_s.bonus_prof_vinculado_turma,
        np_p.ponto_bonus_professor,
        np_s.indice_bonus_gestao
    ) AS bonus_professor,
    COALESCE(
        pub_a.indice_bonus,
        pub_s.bonus_cargo_administrativo,
        np_a.indice_bonus_admin,
        np_s.indice_bonus_gestao
    ) AS bonus_administrativo,
    eja.eja_fundamental_iniciais AS bonus_eja_iniciais,
    eja.eja_fundamental_finais   AS bonus_eja_finais,
    eja.eja_medio                AS bonus_eja_medio,
    eja.atendimento_especializado_aee AS bonus_aee,
    COALESCE(pub_p.meta_pactuada, pub_s.atingiu_meta_pactuada) AS atingiu_meta,
    COALESCE(pub_p.ponto_crescimento, pub_s.ponto_crescimento) AS ponto_crescimento,
    COALESCE(pub_p.ponto_fluxo, pub_s.fluxo)                  AS fluxo,
    COALESCE(
        pub_p.etapa_ensino, 
        CASE 
            WHEN np_p.etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS' THEN 'EF ANOS INICIAIS (3º ao 5º)'
            ELSE np_p.etapa_ensino 
        END
    )::varchar(255) AS etapa_ensino
FROM seduc.dim_escolas e
LEFT JOIN pub_p_expanded           pub_p ON e.codigo_escola = pub_p.codigo_escola
LEFT JOIN seduc.seduc_publ_regular_admin pub_a ON e.codigo_escola = pub_a.codigo_escola
LEFT JOIN seduc.seduc_publ_sectet        pub_s ON e.codigo_escola = pub_s.codigo_escola
LEFT JOIN seduc.seduc_nao_publ_regular_prof  np_p ON e.codigo_escola = np_p.codigo_escola
LEFT JOIN seduc.seduc_nao_publ_regular_admin np_a ON e.codigo_escola = np_a.codigo_escola
LEFT JOIN seduc.seduc_nao_publ_sectet        np_s ON e.codigo_escola = np_s.codigo_escola
LEFT JOIN seduc.seduc_bonus_eja_aee          eja  ON e.codigo_escola = eja.codigo_escola;
"""

cur.execute(view_sql)
conn.commit()

cur.execute("SELECT DISTINCT etapa_ensino FROM seduc.vw_escola_resultado_completo;")
rows = cur.fetchall()
for r in rows:
    print(repr(r[0]))

conn.close()
