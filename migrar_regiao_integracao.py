"""
Migração: Região de Integração (RI) + 16º Salário
Adiciona regiao_integracao à dim_escolas e atualiza a view consolidada.
"""
import os
import psycopg2

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:mEeXDegrviFMqbbYCYbklKSQkcbwyOsQ@altaria.proxy.rlwy.net:10883/railway"
)

# Mapeamento canônico: municipio (UPPER) -> regiao_integracao
# Fonte: IDESP/SEDUC-PA - Regiões de Integração do Pará (12 RIs oficiais)
MUNICIPIO_RI = {
    # RI 1 - GUAJARÁ
    "ALTAMIRA": "GUAJARÁ",
    "VITÓRIA DO XINGU": "GUAJARÁ",
    "SENADOR JOSÉ PORFÍRIO": "GUAJARÁ",
    "PORTO DE MOZ": "GUAJARÁ",
    "GURUPÁ": "GUAJARÁ",
    "BRASIL NOVO": "GUAJARÁ",
    "URUARÁ": "GUAJARÁ",
    "PLACAS": "GUAJARÁ",
    "MEDICILÂNDIA": "GUAJARÁ",
    "ANAPU": "GUAJARÁ",
    "PACAJÁ": "GUAJARÁ",
    # RI 2 - RIO CAETÉ
    "BRAGANÇA": "RIO CAETÉ",
    "CAPANEMA": "RIO CAETÉ",
    "AUGUSTO CORRÊA": "RIO CAETÉ",
    "BONITO": "RIO CAETÉ",
    "CACHOEIRA DO PIRIÁ": "RIO CAETÉ",
    "TRACUATEUA": "RIO CAETÉ",
    "NOVA TIMBOTEUA": "RIO CAETÉ",
    "PRIMAVERA": "RIO CAETÉ",
    "QUATIPURU": "RIO CAETÉ",
    "SALINÓPOLIS": "RIO CAETÉ",
    "SÃO JOÃO DE PIRABAS": "RIO CAETÉ",
    "SANTARÉM NOVO": "RIO CAETÉ",
    "PEIXE-BOI": "RIO CAETÉ",
    # RI 3 - BAIXO AMAZONAS
    "SANTARÉM": "BAIXO AMAZONAS",
    "ÓBIDOS": "BAIXO AMAZONAS",
    "ORIXIMINÁ": "BAIXO AMAZONAS",
    "JURUTI": "BAIXO AMAZONAS",
    "TERRA SANTA": "BAIXO AMAZONAS",
    "FARO": "BAIXO AMAZONAS",
    "ALENQUER": "BAIXO AMAZONAS",
    "CURUÁ": "BAIXO AMAZONAS",
    "BELTERRA": "BAIXO AMAZONAS",
    "MOJUÍ DOS CAMPOS": "BAIXO AMAZONAS",
    "PRAINHA": "BAIXO AMAZONAS",
    "MONTE ALEGRE": "BAIXO AMAZONAS",
    "ALMEIRIM": "BAIXO AMAZONAS",
    # RI 4 - TAPAJÓS
    "ITAITUBA": "TAPAJÓS",
    "JACAREACANGA": "TAPAJÓS",
    "TRAIRÃO": "TAPAJÓS",
    "NOVO PROGRESSO": "TAPAJÓS",
    "RURÓPOLIS": "TAPAJÓS",
    "AVEIRO": "TAPAJÓS",
    # RI 5 - CARAJÁS
    "PARAUAPEBAS": "CARAJÁS",
    "CANAÃ DOS CARAJÁS": "CARAJÁS",
    "ELDORADO DOS CARAJÁS": "CARAJÁS",
    "CURIONÓPOLIS": "CARAJÁS",
    "ÁGUA AZUL DO NORTE": "CARAJÁS",
    "OURILÂNDIA DO NORTE": "CARAJÁS",
    "TUCUMÃ": "CARAJÁS",
    "SÃO FÉLIX DO XINGU": "CARAJÁS",
    # RI 6 - MARAJÓ
    "BREVES": "MARAJÓ",
    "PORTEL": "MARAJÓ",
    "MELGAÇO": "MARAJÓ",
    "CHAVES": "MARAJÓ",
    "SOURE": "MARAJÓ",
    "CACHOEIRA DO ARARI": "MARAJÓ",
    "SANTA CRUZ DO ARARI": "MARAJÓ",
    "PONTA DE PEDRAS": "MARAJÓ",
    "MUANÁ": "MARAJÓ",
    "BAGRE": "MARAJÓ",
    "ANAJÁS": "MARAJÓ",
    "CURRALINHO": "MARAJÓ",
    # RI 7 - METROPOLITANA
    "BELÉM": "METROPOLITANA",
    "ANANINDEUA": "METROPOLITANA",
    "MARITUBA": "METROPOLITANA",
    "BENEVIDES": "METROPOLITANA",
    "SANTA BÁRBARA DO PARÁ": "METROPOLITANA",
    "SANTA IZABEL DO PARÁ": "METROPOLITANA",
    # RI 8 - GUAMÁ
    "CASTANHAL": "GUAMÁ",
    "SANTA MARIA DO PARÁ": "GUAMÁ",
    "SÃO FRANCISCO DO PARÁ": "GUAMÁ",
    "INHANGAPI": "GUAMÁ",
    "SANTO ANTÔNIO DO TAUÁ": "GUAMÁ",
    "VIGIA": "GUAMÁ",
    "COLARES": "GUAMÁ",
    "SÃO CAETANO DE ODIVELAS": "GUAMÁ",
    "CURUÇÁ": "GUAMÁ",
    "TERRA ALTA": "GUAMÁ",
    "MARAPANIM": "GUAMÁ",
    "MAGALHÃES BARATA": "GUAMÁ",
    "MARACANÃ": "GUAMÁ",
    "SÃO JOÃO DA PONTA": "GUAMÁ",
    "BUJARU": "GUAMÁ",
    "AURORA DO PARÁ": "GUAMÁ",
    "CAPITÃO POÇO": "GUAMÁ",
    "IPIXUNA DO PARÁ": "GUAMÁ",
    "GARRAFÃO DO NORTE": "GUAMÁ",
    "PARAGOMINAS": "GUAMÁ",
    "DOM ELISEU": "GUAMÁ",
    "RONDON DO PARÁ": "GUAMÁ",
    "ABEL FIGUEIREDO": "GUAMÁ",
    "GOIANÉSIA DO PARÁ": "GUAMÁ",
    "TOMÉ-AÇU": "GUAMÁ",
    "ACARÁ": "GUAMÁ",
    "MOJU": "GUAMÁ",
    # RI 9 - RIO CAPIM
    "BREU BRANCO": "RIO CAPIM",
    "TUCURUÍ": "RIO CAPIM",
    "NOVO REPARTIMENTO": "RIO CAPIM",
    "JACUNDÁ": "RIO CAPIM",
    "NOVA IPIXUNA": "RIO CAPIM",
    "ITUPIRANGA": "RIO CAPIM",
    "SÃO DOMINGOS DO ARAGUAIA": "RIO CAPIM",
    "SÃO GERALDO DO ARAGUAIA": "RIO CAPIM",
    # RI 10 - ARAGUAIA
    "CONCEIÇÃO DO ARAGUAIA": "ARAGUAIA",
    "REDENÇÃO": "ARAGUAIA",
    "XINGUARA": "ARAGUAIA",
    "RIO MARIA": "ARAGUAIA",
    "SAPUCAIA": "ARAGUAIA",
    "FLORESTA DO ARAGUAIA": "ARAGUAIA",
    "SANTA MARIA DAS BARREIRAS": "ARAGUAIA",
    "PAU D'ARCO": "ARAGUAIA",
    # RI 11 - TOCANTINS
    "MARABÁ": "TOCANTINS",
    "SÃO JOÃO DO ARAGUAIA": "TOCANTINS",
    # RI 12 - LAGO DE TUCURUÍ
    "BAIÃO": "LAGO DE TUCURUÍ",
    "MOCAJUBA": "LAGO DE TUCURUÍ",
    "CAMETÁ": "LAGO DE TUCURUÍ",
    "OEIRAS DO PARÁ": "LAGO DE TUCURUÍ",
    "LIMOEIRO DO AJURU": "LAGO DE TUCURUÍ",
    "IGARAPÉ-MIRI": "LAGO DE TUCURUÍ",
    "ABAETETUBA": "LAGO DE TUCURUÍ",
    "BARCARENA": "LAGO DE TUCURUÍ",
    "TAILÂNDIA": "LAGO DE TUCURUÍ",
}

def main():
    print("Conectando ao PostgreSQL no Railway...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        print("[OK] Ligacao estabelecida!")

        # PASSO 1: Adicionar coluna regiao_integracao à dim_escolas
        print("\nPASSO 1: Adicionando coluna 'regiao_integracao' a dim_escolas...")
        cur.execute("""
            SET search_path TO seduc, public;
            ALTER TABLE seduc.dim_escolas
            ADD COLUMN IF NOT EXISTS regiao_integracao VARCHAR(100);
        """)
        print("[OK] Coluna adicionada!")

        # PASSO 2: Popular regiao_integracao a partir da tabela fonte
        print("\nPASSO 2: Populando regiao_integracao a partir de seduc_publ_regular_prof...")
        cur.execute("""
            SET search_path TO seduc, public;
            UPDATE seduc.dim_escolas d
            SET regiao_integracao = UPPER(TRIM(p.regiao_integracao))
            FROM seduc.seduc_publ_regular_prof p
            WHERE d.codigo_escola = p.codigo_escola
              AND p.regiao_integracao IS NOT NULL
              AND TRIM(p.regiao_integracao) != '';
        """)
        print("[OK] RI populada via tabela fonte!")

        # PASSO 3: Preencher RI faltante via tabela temporária de mapeamento
        print("\nPASSO 3: Preenchendo RI ausente via tabela temporaria de mapeamento...")
        cur.execute("""
            SET search_path TO seduc, public;
            CREATE TEMP TABLE IF NOT EXISTS _mun_ri_map (
                municipio_upper VARCHAR(255) PRIMARY KEY,
                regiao_integracao VARCHAR(100)
            ) ON COMMIT PRESERVE ROWS;
            TRUNCATE _mun_ri_map;
        """)
        # Insert each mapping row safely using execute_batch
        insert_rows = [(mun.upper(), ri) for mun, ri in MUNICIPIO_RI.items()]
        from psycopg2.extras import execute_batch
        execute_batch(cur,
            "INSERT INTO _mun_ri_map (municipio_upper, regiao_integracao) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            insert_rows
        )
        cur.execute("""
            SET search_path TO seduc, public;
            UPDATE seduc.dim_escolas d
            SET regiao_integracao = m.regiao_integracao
            FROM _mun_ri_map m
            WHERE UPPER(TRIM(d.municipio)) = m.municipio_upper
              AND (d.regiao_integracao IS NULL OR TRIM(d.regiao_integracao) = '');
        """)
        print("[OK] RI preenchida via tabela temporaria de mapeamento!")

        # PASSO 3.5: Normalizar valores OCR corrompidos vindos dos PDFs
        print("\nPASSO 3.5: Normalizando nomes de RI corrompidos por OCR...")
        RI_CORRECTIONS = [
            ("AAGRAUGAUIAAIA", "ARAGUAIA"),
            ("ABRAARGREUIARAIAS", "ARAGUAIA"),
            ("ARAGUAIIA", "ARAGUAIA"),
            ("ARAGAUAIA", "ARAGUAIA"),
            ("AMRIARAJÓ", "MARAJÓ"),
            ("RMARAIRAJÓ", "MARAJÓ"),
            ("AMRIARAJO", "MARAJÓ"),
            ("GOUDAIVMELAAS", "GUAMÁ"),
            ("GOUDAIVMELÂAS", "GUAMÁ"),
            ("OG CUAAMPIAM", "RIO CAPIM"),
            ("OG CUAAMPIÁN", "RIO CAPIM"),
            ("OG CUAAMPIÃO", "RIO CAPIM"),
            ("OG PUAARJAARA", "GUAJARÁ"),
            ("OG PUAARJÁARÁ", "GUAJARÁ"),
            ("OG PUAARJARÁ", "GUAJARÁ"),
            ("PGAURAMA", "GUAMÁ"),
            ("PGAURÂMÂ", "GUAMÁ"),
            ("TGAUAMA", "GUAMÁ"),
            ("TGAUAMÂ", "GUAMÁ"),
            ("UTOCANTINS", "TOCANTINS"),
            ("XINGU", "GUAJARÁ"),
            ("LAGO TUCURUÍ", "LAGO DE TUCURUÍ"),
            ("LAGO TUCURUI", "LAGO DE TUCURUÍ"),
        ]
        for corrupted, canonical in RI_CORRECTIONS:
            cur.execute("""
                SET search_path TO seduc, public;
                UPDATE seduc.dim_escolas
                SET regiao_integracao = %s
                WHERE UPPER(TRIM(regiao_integracao)) = UPPER(%s);
            """, (canonical, corrupted))
        print("[OK] Nomes de RI normalizados!")

        # PASSO 4: Recriar a VIEW com regiao_integracao + 16 Salario
        print("\nPASSO 4: Recriando view 'vw_escola_resultado_completo' com RI e 16 Salario...")
        # Precisa DROP + CREATE pois CREATE OR REPLACE não aceita reordenar colunas
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
                    indice_bonus as bonus_professor
                FROM seduc_publ_regular_prof
                WHERE etapa_ensino != 'ENSINO FUNDAMENTAL ANOS INICIAIS'

                UNION ALL

                SELECT
                    codigo_escola,
                    municipio,
                    regiao_integracao,
                    nome_escola,
                    'EF ALFABETIZACAO (1 e 2)'::varchar(255) as etapa_ensino,
                    meta_pactuada,
                    ponto_crescimento,
                    ponto_fluxo,
                    bonus_prof_1_e_2_ano as bonus_professor
                FROM seduc_publ_regular_prof
                WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
                  AND (bonus_prof_1_e_2_ano > 0 OR ponto_alfabetizacao > 0)

                UNION ALL

                SELECT
                    codigo_escola,
                    municipio,
                    regiao_integracao,
                    nome_escola,
                    'EF ANOS INICIAIS (3 ao 5)'::varchar(255) as etapa_ensino,
                    meta_pactuada,
                    ponto_crescimento,
                    ponto_fluxo,
                    bonus_prof_3_a_5_ano as bonus_professor
                FROM seduc_publ_regular_prof
                WHERE etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
                  AND (bonus_prof_3_a_5_ano > 0 OR (COALESCE(bonus_prof_1_e_2_ano, 0) = 0 AND COALESCE(ponto_alfabetizacao, 0) = 0))
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
                            WHEN np_p.etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS'
                                THEN 'EF ANOS INICIAIS (3 ao 5)'
                            ELSE np_p.etapa_ensino
                        END
                    )::varchar(255) AS etapa_ensino
                FROM dim_escolas e
                LEFT JOIN pub_p_expanded               pub_p ON e.codigo_escola = pub_p.codigo_escola
                LEFT JOIN seduc_publ_regular_admin     pub_a ON e.codigo_escola = pub_a.codigo_escola
                LEFT JOIN seduc_publ_sectet            pub_s ON e.codigo_escola = pub_s.codigo_escola
                LEFT JOIN seduc_nao_publ_regular_prof  np_p  ON e.codigo_escola = np_p.codigo_escola
                LEFT JOIN seduc_nao_publ_regular_admin np_a  ON e.codigo_escola = np_a.codigo_escola
                LEFT JOIN seduc_nao_publ_sectet        np_s  ON e.codigo_escola = np_s.codigo_escola
                LEFT JOIN seduc_bonus_eja_aee          eja   ON e.codigo_escola = eja.codigo_escola
            ),
            ri_ranking AS (
                SELECT
                    codigo_escola,
                    RANK() OVER (
                        PARTITION BY regiao_integracao, etapa_ensino
                        ORDER BY COALESCE(bonus_professor, 0) DESC
                    ) AS rank_desempenho,
                    RANK() OVER (
                        PARTITION BY regiao_integracao, etapa_ensino
                        ORDER BY COALESCE(ponto_crescimento, 0) DESC
                    ) AS rank_crescimento
                FROM base
                WHERE regiao_integracao IS NOT NULL
                  AND etapa_ensino IS NOT NULL
                  AND status_publicacao = 'PUBLICADA'
            )
            SELECT
                b.*,
                CASE
                    WHEN r.rank_desempenho = 1 AND COALESCE(b.bonus_professor, 0) > 0 THEN TRUE
                    WHEN r.rank_crescimento = 1 AND COALESCE(b.ponto_crescimento, 0) > 0 THEN TRUE
                    ELSE FALSE
                END AS elegivel_16_salario,
                CASE
                    WHEN r.rank_desempenho = 1 AND COALESCE(b.bonus_professor, 0) > 0
                        THEN 'Melhor Desempenho RI'
                    WHEN r.rank_crescimento = 1 AND COALESCE(b.ponto_crescimento, 0) > 0
                        THEN 'Maior Crescimento RI'
                    ELSE NULL
                END AS motivo_16_salario
            FROM base b
            LEFT JOIN ri_ranking r ON b.codigo_escola = r.codigo_escola;
        """)
        print("[OK] View recriada com RI e 16 Salario!")

        # Validações
        cur.execute("SELECT COUNT(*) FROM seduc.dim_escolas;")
        total_escolas = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM seduc.dim_escolas WHERE regiao_integracao IS NOT NULL;")
        com_ri = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM seduc.vw_escola_resultado_completo;")
        total_view = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM seduc.vw_escola_resultado_completo WHERE elegivel_16_salario = TRUE;")
        com_16 = cur.fetchone()[0]

        cur.execute("""
            SELECT DISTINCT regiao_integracao
            FROM seduc.dim_escolas
            WHERE regiao_integracao IS NOT NULL
            ORDER BY 1
        """)
        ris = [r[0] for r in cur.fetchall()]

        print(f"\n[SUCESSO] Migracao concluida no Railway!")
        print(f"   Escolas unicas (dim_escolas):  {total_escolas}")
        print(f"   Escolas com RI mapeada:        {com_ri}")
        print(f"   Registros na view:             {total_view}")
        print(f"   Elegiveis ao 16 Salario:       {com_16}")
        print(f"\n   Regioes de Integracao identificadas ({len(ris)}):")
        for ri in ris:
            print(f"      - {ri}")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"[ERRO] {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
