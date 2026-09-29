import os
import openpyxl
import psycopg2

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:mEeXDegrviFMqbbYCYbklKSQkcbwyOsQ@altaria.proxy.rlwy.net:10883/railway"
)

conn = psycopg2.connect(DATABASE_URL, sslmode="require")
conn.set_client_encoding("UTF8")
cur = conn.cursor()

print("1. Creating / ensuring seduc.seduc_premiadas_ri table exists...")
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

print("\n2. Consolidating 10 tied records from all sheets of Excel file...")
excel_path = "ESCOLAS PUBLICADAS_BÔNUS ESCOLAS EMPATADA NA RI E NÃO PREMIADA.xlsx"
wb = openpyxl.load_workbook(excel_path)
print("Sheet names:", wb.sheetnames)

stage_mapping = {
    "AI": "EF ANOS INICIAIS (3º ao 5º)",
    "AF": "ENSINO FUNDAMENTAL ANOS FINAIS",
    "EM": "ENSINO MEDIO",
    "CARGO ADMINISTRATIVO": "CARGO ADMINISTRATIVO"
}

tied_records = []
for sheet in wb.sheetnames:
    ws = wb[sheet]
    default_etapa = stage_mapping.get(sheet, sheet)
    for row in ws.iter_rows(values_only=True):
        for cell in row:
            if cell is not None and str(cell).startswith("15") and len(str(cell)) == 8:
                cod = str(cell)
                tied_records.append((cod, default_etapa, sheet))
                break

print(f"Found {len(tied_records)} tied records across all sheets:")
for r in tied_records:
    print(" ", r)

# Upsert each tied record into seduc.seduc_premiadas_ri
for cod, etapa, sheet in tied_records:
    cur.execute("""
    INSERT INTO seduc.seduc_premiadas_ri (codigo_escola, etapa_ensino, elegivel_16_salario, status_premiacao_ri, motivo_premiacao)
    VALUES (%s, %s, FALSE, 'NÃO PREMIADA - CRITÉRIO DE DESEMPATE', 'Critério de Desempate RI - ' || %s)
    ON CONFLICT (codigo_escola, etapa_ensino)
    DO UPDATE SET 
        elegivel_16_salario = FALSE,
        status_premiacao_ri = 'NÃO PREMIADA - CRITÉRIO DE DESEMPATE',
        motivo_premiacao = 'Critério de Desempate RI - ' || EXCLUDED.motivo_premiacao;
    """, (cod, etapa, sheet))
    
    # Also add the raw etapa name 'ENSINO FUNDAMENTAL ANOS INICIAIS' if it was AI
    if etapa == "EF ANOS INICIAIS (3º ao 5º)":
        cur.execute("""
        INSERT INTO seduc.seduc_premiadas_ri (codigo_escola, etapa_ensino, elegivel_16_salario, status_premiacao_ri, motivo_premiacao)
        VALUES (%s, 'ENSINO FUNDAMENTAL ANOS INICIAIS', FALSE, 'NÃO PREMIADA - CRITÉRIO DE DESEMPATE', 'Critério de Desempate RI - AI')
        ON CONFLICT (codigo_escola, etapa_ensino)
        DO UPDATE SET 
            elegivel_16_salario = FALSE,
            status_premiacao_ri = 'NÃO PREMIADA - CRITÉRIO DE DESEMPATE',
            motivo_premiacao = 'Critério de Desempate RI - AI';
        """, (cod,))

conn.commit()
print("SUCCESS: Tied records upserted into seduc.seduc_premiadas_ri.")

print("\n3. Neutralizing ponto_regiao_integracao in seduc.seduc_publ_regular_prof for tied stages...")
# Padro Antonio Vieira in AI
cur.execute("UPDATE seduc.seduc_publ_regular_prof SET ponto_regiao_integracao = 0.0 WHERE codigo_escola = '15093654' AND etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS';")
# Vitaliano Maria Vari and Stella Maris in AF
cur.execute("UPDATE seduc.seduc_publ_regular_prof SET ponto_regiao_integracao = 0.0 WHERE codigo_escola IN ('15088383', '15033813') AND etapa_ensino = 'ENSINO FUNDAMENTAL ANOS FINAIS';")
# Waldemar Lindermayer and Rio Tocantins in EM
cur.execute("UPDATE seduc.seduc_publ_regular_prof SET ponto_regiao_integracao = 0.0 WHERE codigo_escola IN ('15140741', '15547191') AND etapa_ensino = 'ENSINO MEDIO';")
conn.commit()
print("SUCCESS: seduc_publ_regular_prof neutralized for tied schools.")

print("\n4. Recreating seduc.vw_escola_resultado_completo with zero phantom stages and strict 16º salary rules...")
cur.execute("SET search_path TO seduc, public; DROP VIEW IF EXISTS seduc.vw_escola_resultado_completo CASCADE;")

view_sql = """
CREATE VIEW seduc.vw_escola_resultado_completo AS
WITH pub_p_expanded AS (
    -- 1. Anos Finais and Ensino Médio from regular professor table
    SELECT
        codigo_escola,
        municipio,
        regiao_integracao,
        nome_escola,
        etapa_ensino::varchar(255) AS etapa_ensino,
        meta_pactuada,
        ponto_crescimento,
        ponto_fluxo,
        ponto_regiao_integracao,
        NULL::numeric AS ponto_alfabetizacao,
        indice_bonus AS bonus_professor,
        FALSE AS oferta_alfabetizacao,
        FALSE AS meta_alfabetizacao_atingida
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino != 'ENSINO FUNDAMENTAL ANOS INICIAIS'

    UNION ALL

    -- 2. EF ALFABETIZAÇÃO: ONLY for units with actual apurado value (bonus_prof_1_e_2_ano > 0)
    SELECT
        codigo_escola,
        municipio,
        regiao_integracao,
        nome_escola,
        'EF ALFABETIZAÇÃO (1º e 2º)'::varchar(255) AS etapa_ensino,
        CASE WHEN bonus_prof_1_e_2_ano > 0 THEN 1.0 ELSE 0.0 END AS meta_pactuada,
        NULL::numeric AS ponto_crescimento,
        NULL::numeric AS ponto_fluxo,
        0.0 AS ponto_regiao_integracao,
        ponto_alfabetizacao,
        bonus_prof_1_e_2_ano AS bonus_professor,
        TRUE AS oferta_alfabetizacao,
        TRUE AS meta_alfabetizacao_atingida
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
      AND COALESCE(bonus_prof_1_e_2_ano, 0) > 0

    UNION ALL

    -- 3. EF ANOS INICIAIS (3º ao 5º): Real stage for all Anos Iniciais with apurado 3º a 5º value
    SELECT
        codigo_escola,
        municipio,
        regiao_integracao,
        nome_escola,
        'EF ANOS INICIAIS (3º ao 5º)'::varchar(255) AS etapa_ensino,
        meta_pactuada,
        ponto_crescimento,
        ponto_fluxo,
        ponto_regiao_integracao,
        NULL::numeric AS ponto_alfabetizacao,
        bonus_prof_3_a_5_ano AS bonus_professor,
        FALSE AS oferta_alfabetizacao,
        FALSE AS meta_alfabetizacao_atingida
    FROM seduc.seduc_publ_regular_prof
    WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
      AND (bonus_prof_3_a_5_ano IS NOT NULL OR COALESCE(bonus_prof_1_e_2_ano, 0) = 0)
),
pub_etapas AS (
    SELECT
        p.codigo_escola,
        p.etapa_ensino,
        p.meta_pactuada,
        p.ponto_crescimento,
        p.ponto_fluxo,
        p.ponto_regiao_integracao,
        p.ponto_alfabetizacao,
        p.bonus_professor,
        p.oferta_alfabetizacao,
        p.meta_alfabetizacao_atingida,
        'PUBLICADA'::varchar(50) AS status_publicacao
    FROM pub_p_expanded p

    UNION ALL

    -- SECTET schools without regular prof table record
    SELECT
        s.codigo_escola,
        'ENSINO MEDIO'::varchar(255) AS etapa_ensino,
        s.atingiu_meta_pactuada AS meta_pactuada,
        s.ponto_crescimento,
        s.fluxo AS ponto_fluxo,
        0.0 AS ponto_regiao_integracao,
        NULL::numeric AS ponto_alfabetizacao,
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
        0.0 AS ponto_regiao_integracao,
        NULL::numeric AS ponto_alfabetizacao,
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
        0.0 AS ponto_regiao_integracao,
        NULL::numeric AS ponto_alfabetizacao,
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
        ae.ponto_regiao_integracao,
        ae.ponto_alfabetizacao,
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

    -- Schools with only admin or eja records (no regular teaching stages)
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
        0.0 AS ponto_regiao_integracao,
        NULL::numeric AS ponto_alfabetizacao,
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
    b.ponto_regiao_integracao,
    b.ponto_alfabetizacao,
    b.etapa_ensino,
    b.oferta_alfabetizacao,
    b.meta_alfabetizacao_atingida,
    -- 16º Salário: Strictly bound by composite key (codigo_escola, etapa_ensino)
    -- If explicitly marked FALSE in seduc_premiadas_ri (e.g. tie-breaker loser), FALSE!
    -- If explicitly marked TRUE, TRUE!
    -- Else fallback to b.ponto_regiao_integracao = 1.0
    CASE
        WHEN pri.elegivel_16_salario = FALSE THEN FALSE
        WHEN pri.elegivel_16_salario = TRUE THEN TRUE
        WHEN COALESCE(b.ponto_regiao_integracao, 0) = 1.0 THEN TRUE
        ELSE FALSE
    END AS elegivel_16_salario,
    CASE
        WHEN pri.status_premiacao_ri IS NOT NULL THEN pri.status_premiacao_ri
        WHEN COALESCE(b.ponto_regiao_integracao, 0) = 1.0 THEN 'PREMIADA'
        ELSE 'NÃO ELEGÍVEL'
    END AS status_premiacao_ri,
    CASE
        WHEN pri.motivo_premiacao IS NOT NULL THEN pri.motivo_premiacao
        WHEN COALESCE(b.ponto_regiao_integracao, 0) = 1.0 THEN 'Destaque na Região de Integração'
        ELSE NULL
    END AS motivo_16_salario
FROM base b
LEFT JOIN seduc.seduc_premiadas_ri pri 
    ON b.codigo_escola = pri.codigo_escola 
   AND b.etapa_ensino = pri.etapa_ensino;
"""

cur.execute(view_sql)
conn.commit()
print("SUCCESS: seduc.vw_escola_resultado_completo created successfully.")

conn.close()
print("Done!")
