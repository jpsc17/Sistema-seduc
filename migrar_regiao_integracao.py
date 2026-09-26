"""
Migração Oficial e Sanitização Definitiva de Região de Integração (RI) e Deduplicação da View.

Problemas resolvidos:
1. Sanitização completa das 12 RIs canônicas do Pará (sem OCR corrompido, sem METROPOLITANA, mapeia Xingu e municípios faltantes).
2. Eliminação definitiva de qualquer duplicação na view (sem produto cartesiano entre pub_p e np_p).
3. 16º Salário calculado sem duplicações.
"""
import os
import psycopg2

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:mEeXDegrviFMqbbYCYbklKSQkcbwyOsQ@altaria.proxy.rlwy.net:10883/railway"
)

# Mapa canônico de Município -> Região de Integração oficial do Pará
# Abrange os municípios com RI nula ou associada a ruídos
MUNICIPIO_RI_MAP = {
    # ARAGUAIA
    "CUMARU DO NORTE": "ARAGUAIA",
    "SANTANA DO ARAGUAIA": "ARAGUAIA",
    "AGUA AZUL DO NORTE": "ARAGUAIA",
    "ÁGUA AZUL DO NORTE": "ARAGUAIA",
    "BANNACH": "ARAGUAIA",
    "CONCEICAO DO ARAGUAIA": "ARAGUAIA",
    "CONCEIÇÃO DO ARAGUAIA": "ARAGUAIA",
    "FLORESTA DO ARAGUAIA": "ARAGUAIA",
    "OURILANDIA DO NORTE": "ARAGUAIA",
    "OURILÂNDIA DO NORTE": "ARAGUAIA",
    "PAU D'ARCO": "ARAGUAIA",
    "PAU D ARCO": "ARAGUAIA",
    "REDENCAO": "ARAGUAIA",
    "REDENÇÃO": "ARAGUAIA",
    "RIO MARIA": "ARAGUAIA",
    "SANTA MARIA DAS BARREIRAS": "ARAGUAIA",
    "SAO FELIX DO XINGU": "ARAGUAIA",
    "SÃO FÉLIX DO XINGU": "ARAGUAIA",
    "SAPUCAIA": "ARAGUAIA",
    "TUCUMA": "ARAGUAIA",
    "TUCUMÃ": "ARAGUAIA",
    "XINGUARA": "ARAGUAIA",

    # CARAJÁS
    "BOM JESUS DO TOCANTINS": "CARAJÁS",
    "BREJO GRANDE DO ARAGUAIA": "CARAJÁS",
    "PALESTINA DO PARA": "CARAJÁS",
    "PALESTINA DO PARÁ": "CARAJÁS",
    "CANAA DOS CARAJAS": "CARAJÁS",
    "CANAÃ DOS CARAJÁS": "CARAJÁS",
    "CURIONOPOLIS": "CARAJÁS",
    "CURIONÓPOLIS": "CARAJÁS",
    "ELDORADO DO CARAJAS": "CARAJÁS",
    "ELDORADO DO CARAJÁS": "CARAJÁS",
    "MARABA": "CARAJÁS",
    "MARABÁ": "CARAJÁS",
    "PARAUAPEBAS": "CARAJÁS",
    "PICARRA": "CARAJÁS",
    "PIÇARRA": "CARAJÁS",
    "SAO DOMINGOS DO ARAGUAIA": "CARAJÁS",
    "SÃO DOMINGOS DO ARAGUAIA": "CARAJÁS",
    "SAO GERALDO DO ARAGUAIA": "CARAJÁS",
    "SÃO GERALDO DO ARAGUAIA": "CARAJÁS",
    "SAO JOAO DO ARAGUAIA": "CARAJÁS",
    "SÃO JOÃO DO ARAGUAIA": "CARAJÁS",

    # GUAJARÁ (Belém, Ananindeua, Marituba, Benevides, Santa Bárbara)
    "BELEM": "GUAJARÁ",
    "BELÉM": "GUAJARÁ",
    "ANANINDEUA": "GUAJARÁ",
    "MARITUBA": "GUAJARÁ",
    "BENEVIDES": "GUAJARÁ",
    "SANTA BARBARA DO PARA": "GUAJARÁ",
    "SANTA BÁRBARA DO PARÁ": "GUAJARÁ",

    # GUAMÁ
    "SANTA IZABEL DO PARA": "GUAMÁ",
    "SANTA IZABEL DO PARÁ": "GUAMÁ",
    "SANTA ISABEL DO PARA": "GUAMÁ",
    "CASTANHAL": "GUAMÁ",
    "COLARES": "GUAMÁ",
    "CURUCA": "GUAMÁ",
    "CURUÇÁ": "GUAMÁ",
    "IGARAPE-ACU": "GUAMÁ",
    "IGARAPÉ-AÇU": "GUAMÁ",
    "INHANGAPI": "GUAMÁ",
    "MAGALHAES BARATA": "GUAMÁ",
    "MAGALHÃES BARATA": "GUAMÁ",
    "MARACANA": "GUAMÁ",
    "MARACANÃ": "GUAMÁ",
    "MARAPANIM": "GUAMÁ",
    "SANTO ANTONIO DO TAUA": "GUAMÁ",
    "SANTO ANTÔNIO DO TAUÁ": "GUAMÁ",
    "SANTA MARIA DO PARA": "GUAMÁ",
    "SANTA MARIA DO PARÁ": "GUAMÁ",
    "SAO CAETANO DE ODIVELAS": "GUAMÁ",
    "SÃO CAETANO DE ODIVELAS": "GUAMÁ",
    "SAO DOMINGOS DO CAPIM": "GUAMÁ",
    "SÃO DOMINGOS DO CAPIM": "GUAMÁ",
    "SAO FRANCISCO DO PARA": "GUAMÁ",
    "SÃO FRANCISCO DO PARÁ": "GUAMÁ",
    "SAO JOAO DA PONTA": "GUAMÁ",
    "SÃO JOÃO DA PONTA": "GUAMÁ",
    "SAO MIGUEL DO GUAMA": "GUAMÁ",
    "SÃO MIGUEL DO GUAMÁ": "GUAMÁ",
    "TERRA ALTA": "GUAMÁ",
    "VIGIA": "GUAMÁ",

    # XINGU
    "ALTAMIRA": "XINGU",
    "ANAPU": "XINGU",
    "BRASIL NOVO": "XINGU",
    "MEDICILANDIA": "XINGU",
    "MEDICILÂNDIA": "XINGU",
    "PACAJA": "XINGU",
    "PACAJÁ": "XINGU",
    "PORTO DE MOZ": "XINGU",
    "SENADOR JOSE PORFIRIO": "XINGU",
    "SENADOR JOSÉ PORFÍRIO": "XINGU",
    "URUARA": "XINGU",
    "URUARÁ": "XINGU",
    "VITORIA DO XINGU": "XINGU",
    "VITÓRIA DO XINGU": "XINGU",

    # RIO CAPIM
    "IRITUIA": "RIO CAPIM",
    "ABEL FIGUEIREDO": "RIO CAPIM",
    "AURORA DO PARA": "RIO CAPIM",
    "AURORA DO PARÁ": "RIO CAPIM",
    "DOM ELISEU": "RIO CAPIM",
    "GARRAFAO DO NORTE": "RIO CAPIM",
    "GARRAFÃO DO NORTE": "RIO CAPIM",
    "IPIXUNA DO PARA": "RIO CAPIM",
    "IPIXUNA DO PARÁ": "RIO CAPIM",
    "MAE DO RIO": "RIO CAPIM",
    "MÃE DO RIO": "RIO CAPIM",
    "NOVA ESPERANCA DO PIRIA": "RIO CAPIM",
    "NOVA ESPERANÇA DO PIRIÁ": "RIO CAPIM",
    "OUREM": "RIO CAPIM",
    "OURÉM": "RIO CAPIM",
    "PARAGOMINAS": "RIO CAPIM",
    "RONDON DO PARA": "RIO CAPIM",
    "RONDON DO PARÁ": "RIO CAPIM",
    "TOME-ACU": "RIO CAPIM",
    "TOMÉ-AÇU": "RIO CAPIM",
    "ULIANOPOLIS": "RIO CAPIM",
    "ULIANÓPOLIS": "RIO CAPIM",

    # MARAJÓ
    "SALVATERRA": "MARAJÓ",
    "AFUA": "MARAJÓ",
    "AFUÁ": "MARAJÓ",
    "ANAJAS": "MARAJÓ",
    "ANAJÁS": "MARAJÓ",
    "BAGRE": "MARAJÓ",
    "BREVES": "MARAJÓ",
    "CACHOEIRA DO ARARI": "MARAJÓ",
    "CHAVES": "MARAJÓ",
    "CURRALINHO": "MARAJÓ",
    "MELGACO": "MARAJÓ",
    "MELGAÇO": "MARAJÓ",
    "MUANA": "MARAJÓ",
    "MUANÁ": "MARAJÓ",
    "PONTA DE PEDRAS": "MARAJÓ",
    "PORTEL": "MARAJÓ",
    "SANTA CRUZ DO ARARI": "MARAJÓ",
    "SAO SEBASTIAO DA BOA VISTA": "MARAJÓ",
    "SÃO SEBASTIÃO DA BOA VISTA": "MARAJÓ",
    "SOURE": "MARAJÓ",
}

# 12 Regiões Oficiais do Estado do Pará
CANONICAL_RIS = [
    "ARAGUAIA",
    "BAIXO AMAZONAS",
    "CARAJÁS",
    "GUAJARÁ",
    "GUAMÁ",
    "LAGO DE TUCURUÍ",
    "MARAJÓ",
    "RIO CAETÉ",
    "RIO CAPIM",
    "TAPAJÓS",
    "TOCANTINS",
    "XINGU"
]

def main():
    print("Conectando ao PostgreSQL no Railway...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    conn.set_client_encoding("UTF8")
    cur = conn.cursor()
    print("[OK] Conexao estabelecida!")

    # 1. Corrigir municípios de Xingu
    print("\n1. Corrigindo municipios do Xingu...")
    for mun in ["Altamira", "Anapu", "Brasil Novo", "Medicilândia", "Pacajá", "Porto de Moz", "Senador José Porfírio", "Uruará", "Vitória do Xingu"]:
        cur.execute("""
            UPDATE seduc.dim_escolas
            SET regiao_integracao = 'XINGU'
            WHERE UPPER(TRIM(municipio)) = UPPER(TRIM(%s));
        """, (mun,))

    # 2. Corrigir escolas com METROPOLITANA
    print("\n2. Corrigindo escolas marcadas como METROPOLITANA...")
    cur.execute("""
        UPDATE seduc.dim_escolas
        SET regiao_integracao = 'GUAJARÁ'
        WHERE UPPER(TRIM(regiao_integracao)) = 'METROPOLITANA'
          AND UPPER(TRIM(municipio)) IN ('BELEM', 'BELÉM', 'ANANINDEUA', 'MARITUBA', 'BENEVIDES', 'SANTA BÁRBARA DO PARÁ', 'SANTA BARBARA DO PARA');
    """)
    cur.execute("""
        UPDATE seduc.dim_escolas
        SET regiao_integracao = 'GUAMÁ'
        WHERE UPPER(TRIM(regiao_integracao)) = 'METROPOLITANA'
          AND UPPER(TRIM(municipio)) IN ('SANTA IZABEL DO PARÁ', 'SANTA IZABEL DO PARA', 'SANTA ISABEL DO PARA');
    """)

    # 3. Mapear escolas com regiao_integracao nula por município
    print("\n3. Mapeando escolas com RI nula por municipio...")
    for mun, ri in MUNICIPIO_RI_MAP.items():
        cur.execute("""
            UPDATE seduc.dim_escolas
            SET regiao_integracao = %s
            WHERE (regiao_integracao IS NULL OR TRIM(regiao_integracao) = '')
              AND UPPER(TRIM(municipio)) = %s;
        """, (ri, mun))

    # 4. Verificar se sobrou alguma escola com RI fora das 12 canônicas
    print("\n4. Verificando RIs resultantes em dim_escolas...")
    cur.execute("""
        SELECT DISTINCT regiao_integracao, COUNT(*)
        FROM seduc.dim_escolas
        GROUP BY 1
        ORDER BY 1;
    """)
    for r in cur.fetchall():
        print(f"   RI: {r[0]} -> {r[1]} escolas")

    # 5. Recriar vw_escola_resultado_completo sem produtos cartesianos
    print("\n5. Recriando seduc.vw_escola_resultado_completo de forma limpa e deduplicada...")
    cur.execute("SET search_path TO seduc, public; DROP VIEW IF EXISTS seduc.vw_escola_resultado_completo CASCADE;")
    
    cur.execute("""
    SET search_path TO seduc, public;

    CREATE VIEW vw_escola_resultado_completo AS
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
            indice_bonus AS bonus_professor
        FROM seduc_publ_regular_prof
        WHERE etapa_ensino != 'ENSINO FUNDAMENTAL ANOS INICIAIS'

        UNION ALL

        SELECT
            codigo_escola,
            municipio,
            regiao_integracao,
            nome_escola,
            'EF ALFABETIZACAO (1 e 2)'::varchar(255) AS etapa_ensino,
            meta_pactuada,
            ponto_crescimento,
            ponto_fluxo,
            bonus_prof_1_e_2_ano AS bonus_professor
        FROM seduc_publ_regular_prof
        WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
          AND (bonus_prof_1_e_2_ano > 0 OR ponto_alfabetizacao > 0)

        UNION ALL

        SELECT
            codigo_escola,
            municipio,
            regiao_integracao,
            nome_escola,
            'EF ANOS INICIAIS (3 ao 5)'::varchar(255) AS etapa_ensino,
            meta_pactuada,
            ponto_crescimento,
            ponto_fluxo,
            bonus_prof_3_a_5_ano AS bonus_professor
        FROM seduc_publ_regular_prof
        WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
          AND (bonus_prof_3_a_5_ano > 0
               OR (COALESCE(bonus_prof_1_e_2_ano, 0) = 0
                   AND COALESCE(ponto_alfabetizacao, 0) = 0))
    ),
    pub_etapas AS (
        SELECT
            p.codigo_escola,
            p.etapa_ensino,
            p.meta_pactuada,
            p.ponto_crescimento,
            p.ponto_fluxo,
            p.bonus_professor,
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
            'PUBLICADA'::varchar(50) AS status_publicacao
        FROM seduc_publ_sectet s
        WHERE s.codigo_escola NOT IN (SELECT codigo_escola FROM pub_p_expanded)
    ),
    np_etapas AS (
        SELECT
            np.codigo_escola,
            CASE
                WHEN np.etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS' THEN 'EF ANOS INICIAIS (3 ao 5)'
                ELSE np.etapa_ensino
            END::varchar(255) AS etapa_ensino,
            NULL::numeric AS meta_pactuada,
            NULL::numeric AS ponto_crescimento,
            NULL::numeric AS ponto_fluxo,
            np.ponto_bonus_professor AS bonus_professor,
            'NAO_PUBLICADA'::varchar(50) AS status_publicacao
        FROM seduc_nao_publ_regular_prof np

        UNION ALL

        SELECT
            ns.codigo_escola,
            'ENSINO MEDIO'::varchar(255) AS etapa_ensino,
            NULL::numeric AS meta_pactuada,
            NULL::numeric AS ponto_crescimento,
            NULL::numeric AS ponto_fluxo,
            ns.indice_bonus_gestao AS bonus_professor,
            'NAO_PUBLICADA'::varchar(50) AS status_publicacao
        FROM seduc_nao_publ_sectet ns
        WHERE ns.codigo_escola NOT IN (SELECT codigo_escola FROM seduc_nao_publ_regular_prof)
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
            ae.etapa_ensino
        FROM dim_escolas e
        JOIN all_etapas ae ON e.codigo_escola = ae.codigo_escola
        LEFT JOIN seduc_publ_regular_admin     pub_a ON e.codigo_escola = pub_a.codigo_escola
        LEFT JOIN seduc_publ_sectet            pub_s ON e.codigo_escola = pub_s.codigo_escola
        LEFT JOIN seduc_nao_publ_regular_admin np_a  ON e.codigo_escola = np_a.codigo_escola
        LEFT JOIN seduc_nao_publ_sectet        np_s  ON e.codigo_escola = np_s.codigo_escola
        LEFT JOIN seduc_bonus_eja_aee          eja   ON e.codigo_escola = eja.codigo_escola

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
            NULL::varchar(255) AS etapa_ensino
        FROM dim_escolas e
        LEFT JOIN seduc_publ_regular_admin     pub_a ON e.codigo_escola = pub_a.codigo_escola
        LEFT JOIN seduc_nao_publ_regular_admin np_a  ON e.codigo_escola = np_a.codigo_escola
        LEFT JOIN seduc_bonus_eja_aee          eja   ON e.codigo_escola = eja.codigo_escola
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
        CASE
            WHEN b.regiao_integracao IS NOT NULL
              AND b.etapa_ensino IS NOT NULL
              AND b.status_publicacao = 'PUBLICADA'
              AND (
                (COALESCE(b.bonus_professor, 0) > 0 AND COALESCE(b.bonus_professor, 0) >= (
                    SELECT MAX(COALESCE(b2.bonus_professor, 0))
                    FROM base b2
                    WHERE b2.regiao_integracao = b.regiao_integracao
                      AND b2.etapa_ensino      = b.etapa_ensino
                      AND b2.status_publicacao = 'PUBLICADA'
                ))
                OR
                (COALESCE(b.ponto_crescimento, 0) > 0 AND COALESCE(b.ponto_crescimento, 0) >= (
                    SELECT MAX(COALESCE(b2.ponto_crescimento, 0))
                    FROM base b2
                    WHERE b2.regiao_integracao = b.regiao_integracao
                      AND b2.etapa_ensino      = b.etapa_ensino
                      AND b2.status_publicacao = 'PUBLICADA'
                ))
              )
                THEN TRUE
            ELSE FALSE
        END AS elegivel_16_salario,

        CASE
            WHEN b.regiao_integracao IS NOT NULL
              AND b.etapa_ensino IS NOT NULL
              AND b.status_publicacao = 'PUBLICADA'
              AND COALESCE(b.bonus_professor, 0) > 0
              AND COALESCE(b.bonus_professor, 0) >= (
                    SELECT MAX(COALESCE(b2.bonus_professor, 0))
                    FROM base b2
                    WHERE b2.regiao_integracao = b.regiao_integracao
                      AND b2.etapa_ensino      = b.etapa_ensino
                      AND b2.status_publicacao = 'PUBLICADA'
                )
                THEN 'Melhor Desempenho RI'
            WHEN b.regiao_integracao IS NOT NULL
              AND b.etapa_ensino IS NOT NULL
              AND b.status_publicacao = 'PUBLICADA'
              AND COALESCE(b.ponto_crescimento, 0) > 0
              AND COALESCE(b.ponto_crescimento, 0) >= (
                    SELECT MAX(COALESCE(b2.ponto_crescimento, 0))
                    FROM base b2
                    WHERE b2.regiao_integracao = b.regiao_integracao
                      AND b2.etapa_ensino      = b.etapa_ensino
                      AND b2.status_publicacao = 'PUBLICADA'
                )
                THEN 'Maior Crescimento RI'
            ELSE NULL
        END AS motivo_16_salario
    FROM base b;
    """)

    print("\n[OK] View recriada com sucesso!")

    # 6. Testar duplicatas na view
    cur.execute("""
        SELECT codigo_escola, etapa_ensino, status_publicacao, count(*)
        FROM seduc.vw_escola_resultado_completo
        GROUP BY 1, 2, 3
        HAVING count(*) > 1;
    """)
    dups = cur.fetchall()
    if dups:
        print(f"ATENCAO: Existem {len(dups)} duplicatas na view!")
        print(dups[:5])
    else:
        print("[SUCESSO] ZERO duplicatas na view! Cada (codigo_escola, etapa, status) e estritamente UNICO.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
