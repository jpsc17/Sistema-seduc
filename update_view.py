import os
import psycopg2

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:mEeXDegrviFMqbbYCYbklKSQkcbwyOsQ@altaria.proxy.rlwy.net:10883/railway"
)

conn = psycopg2.connect(DATABASE_URL, sslmode="require")
conn.set_client_encoding("UTF8")
cur = conn.cursor()

# 1. Create table seduc.seduc_premiadas_ri if not exists
cur.execute("""
CREATE TABLE IF NOT EXISTS seduc.seduc_premiadas_ri (
    codigo_escola VARCHAR(20) NOT NULL,
    etapa_ensino VARCHAR(255) NOT NULL,
    elegivel_16_salario BOOLEAN NOT NULL DEFAULT FALSE,
    status_premiacao_ri TEXT NOT NULL,
    motivo_premiacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (codigo_escola, etapa_ensino)
);
""")
conn.commit()

# 2. Update view definition
view_sql = """
DROP VIEW IF EXISTS seduc.vw_escola_resultado_completo CASCADE;

CREATE VIEW seduc.vw_escola_resultado_completo AS
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
        indice_bonus AS bonus_professor,
        FALSE AS oferta_alfabetizacao,
        FALSE AS meta_alfabetizacao_atingida
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino != 'ENSINO FUNDAMENTAL ANOS INICIAIS'

    UNION ALL

    SELECT
        codigo_escola,
        municipio,
        regiao_integracao,
        nome_escola,
        'EF ALFABETIZAÇÃO (1º e 2º)'::varchar(255) AS etapa_ensino,
        CASE WHEN bonus_prof_1_e_2_ano > 0 THEN 1.0 ELSE 0.0 END AS meta_pactuada,
        NULL::numeric AS ponto_crescimento,
        NULL::numeric AS ponto_fluxo,
        bonus_prof_1_e_2_ano AS bonus_professor,
        TRUE AS oferta_alfabetizacao,
        (COALESCE(bonus_prof_1_e_2_ano, 0) > 0) AS meta_alfabetizacao_atingida
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
      AND bonus_prof_1_e_2_ano IS NOT NULL

    UNION ALL

    SELECT
        codigo_escola,
        municipio,
        regiao_integracao,
        nome_escola,
        'EF ANOS INICIAIS (3º ao 5º)'::varchar(255) AS etapa_ensino,
        meta_pactuada,
        ponto_crescimento,
        ponto_fluxo,
        bonus_prof_3_a_5_ano AS bonus_professor,
        FALSE AS oferta_alfabetizacao,
        FALSE AS meta_alfabetizacao_atingida
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
      AND bonus_prof_3_a_5_ano IS NOT NULL
),
pub_etapas AS (
    SELECT
        p.codigo_escola,
        p.etapa_ensino,
        p.meta_pactuada,
        p.ponto_crescimento,
        p.ponto_fluxo,
        p.bonus_professor,
        p.oferta_alfabetizacao,
        p.meta_alfabetizacao_atingida,
        'PUBLICADA'::varchar(50) AS status_publicacao
    FROM pub_p_expanded p

    UNION ALL

    SELECT
        s.codigo_escola,
        'ENSINO MEDIO'::varchar(255) AS etapa_ensino,
        s.atingiu_meta_pactuada AS meta_pactuada,
        s.ponto_crescimento,
        s.fluxo AS ponto_fluxo,
        s.bonus_prof_vinculado_turma AS bonus_professor,
        FALSE AS oferta_alfabetizacao,
        FALSE AS meta_alfabetizacao_atingida,
        'PUBLICADA'::varchar(50) AS status_publicacao
    FROM seduc.seduc_publ_sectet s
    WHERE s.codigo_escola NOT IN (SELECT codigo_escola FROM pub_p_expanded)
),
np_etapas AS (
    SELECT
        np.codigo_escola,
        CASE
            WHEN np.etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS' THEN 'EF ANOS INICIAIS (3º ao 5º)'
            ELSE np.etapa_ensino
        END::varchar(255) AS etapa_ensino,
        NULL::numeric AS meta_pactuada,
        NULL::numeric AS ponto_crescimento,
        NULL::numeric AS ponto_fluxo,
        np.ponto_bonus_professor AS bonus_professor,
        FALSE AS oferta_alfabetizacao,
        FALSE AS meta_alfabetizacao_atingida,
        'NAO_PUBLICADA'::varchar(50) AS status_publicacao
    FROM seduc.seduc_nao_publ_regular_prof np

    UNION ALL

    SELECT
        ns.codigo_escola,
        'ENSINO MEDIO'::varchar(255) AS etapa_ensino,
        NULL::numeric AS meta_pactuada,
        NULL::numeric AS ponto_crescimento,
        NULL::numeric AS ponto_fluxo,
        ns.indice_bonus_gestao AS bonus_professor,
        FALSE AS oferta_alfabetizacao,
        FALSE AS meta_alfabetizacao_atingida,
        'NAO_PUBLICADA'::varchar(50) AS status_publicacao
    FROM seduc.seduc_nao_publ_sectet ns
    WHERE ns.codigo_escola NOT IN (SELECT codigo_escola FROM seduc.seduc_nao_publ_regular_prof)
),
all_etapas AS (
    SELECT * FROM pub_etapas
    UNION ALL
    SELECT * FROM np_etapas
),
base AS (
    SELECT
        e.codigo_escola,
        e.nome_escola,
        e.municipio,
        e.regional_dre,
        e.regiao_integracao,
        e.localizacao,
        e.escola_indigena,
        e.rede,
        ae.status_publicacao,
        ae.bonus_professor,
        COALESCE(
            pub_a.indice_bonus,
            pub_s.bonus_cargo_administrativo,
            np_a.indice_bonus_admin,
            np_s.indice_bonus_gestao
        ) AS bonus_administrativo,
        eja.eja_fundamental_iniciais  AS bonus_eja_iniciais,
        eja.eja_fundamental_finais    AS bonus_eja_finais,
        eja.eja_medio                 AS bonus_eja_medio,
        eja.atendimento_especializado_aee AS bonus_aee,
        ae.meta_pactuada AS atingiu_meta,
        ae.ponto_crescimento,
        ae.ponto_fluxo AS fluxo,
        ae.etapa_ensino,
        ae.oferta_alfabetizacao,
        ae.meta_alfabetizacao_atingida
    FROM seduc.dim_escolas e
    JOIN all_etapas ae ON e.codigo_escola = ae.codigo_escola
    LEFT JOIN seduc.seduc_publ_regular_admin     pub_a ON e.codigo_escola = pub_a.codigo_escola
    LEFT JOIN seduc.seduc_publ_sectet            pub_s ON e.codigo_escola = pub_s.codigo_escola
    LEFT JOIN seduc.seduc_nao_publ_regular_admin np_a  ON e.codigo_escola = np_a.codigo_escola
    LEFT JOIN seduc.seduc_nao_publ_sectet        np_s  ON e.codigo_escola = np_s.codigo_escola
    LEFT JOIN seduc.seduc_bonus_eja_aee          eja   ON e.codigo_escola = eja.codigo_escola

    UNION ALL

    SELECT
        e.codigo_escola,
        e.nome_escola,
        e.municipio,
        e.regional_dre,
        e.regiao_integracao,
        e.localizacao,
        e.escola_indigena,
        e.rede,
        CASE
            WHEN pub_a.codigo_escola IS NOT NULL OR eja.tem_publicacao = TRUE THEN 'PUBLICADA'::varchar(50)
            ELSE 'NAO_PUBLICADA'::varchar(50)
        END AS status_publicacao,
        NULL::numeric AS bonus_professor,
        COALESCE(
            pub_a.indice_bonus,
            np_a.indice_bonus_admin
        ) AS bonus_administrativo,
        eja.eja_fundamental_iniciais  AS bonus_eja_iniciais,
        eja.eja_fundamental_finais    AS bonus_eja_finais,
        eja.eja_medio                 AS bonus_eja_medio,
        eja.atendimento_especializado_aee AS bonus_aee,
        NULL::numeric AS atingiu_meta,
        NULL::numeric AS ponto_crescimento,
        NULL::numeric AS fluxo,
        NULL::varchar(255) AS etapa_ensino,
        FALSE AS oferta_alfabetizacao,
        FALSE AS meta_alfabetizacao_atingida
    FROM seduc.dim_escolas e
    LEFT JOIN seduc.seduc_publ_regular_admin     pub_a ON e.codigo_escola = pub_a.codigo_escola
    LEFT JOIN seduc.seduc_nao_publ_regular_admin np_a  ON e.codigo_escola = np_a.codigo_escola
    LEFT JOIN seduc.seduc_bonus_eja_aee          eja   ON e.codigo_escola = eja.codigo_escola
    WHERE e.codigo_escola NOT IN (SELECT codigo_escola FROM all_etapas)
)
SELECT
    b.codigo_escola,
    b.nome_escola,
    b.municipio,
    b.regional_dre,
    b.regiao_integracao,
    b.localizacao,
    b.escola_indigena,
    b.rede,
    b.status_publicacao,
    b.bonus_professor,
    b.bonus_administrativo,
    b.bonus_eja_iniciais,
    b.bonus_eja_finais,
    b.bonus_eja_medio,
    b.bonus_aee,
    b.atingiu_meta,
    b.ponto_crescimento,
    b.fluxo,
    b.etapa_ensino,
    b.oferta_alfabetizacao,
    b.meta_alfabetizacao_atingida,
    COALESCE(pri.elegivel_16_salario, FALSE) AS elegivel_16_salario,
    COALESCE(pri.status_premiacao_ri, 'NÃO ELEGÍVEL') AS status_premiacao_ri,
    pri.motivo_premiacao AS motivo_16_salario
FROM base b
LEFT JOIN seduc.seduc_premiadas_ri pri 
    ON b.codigo_escola = pri.codigo_escola 
   AND b.etapa_ensino = pri.etapa_ensino;
"""

cur.execute(view_sql)
conn.commit()
print("View seduc.vw_escola_resultado_completo atualizada com sucesso.")
conn.close()
