import os
import psycopg2

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:mEeXDegrviFMqbbYCYbklKSQkcbwyOsQ@altaria.proxy.rlwy.net:10883/railway"
)

def main():
    print("🔌 Conectando ao PostgreSQL no Railway...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        print("🟢 Ligação estabelecida!")

        print("⏳ Criando dimensão 'dim_escolas' e view consolidada...")
        cur.execute("""
            SET search_path TO seduc, public;

            -- =================================================================
            -- DIMENSÃO ÚNICA DE ESCOLAS (codigo_escola = chave INEP)
            -- =================================================================
            DROP TABLE IF EXISTS dim_escolas CASCADE;

            CREATE TABLE dim_escolas (
                codigo_escola VARCHAR(20) PRIMARY KEY,
                nome_escola   VARCHAR(255) NOT NULL,
                municipio     VARCHAR(255),
                regional_dre  VARCHAR(255),
                localizacao   VARCHAR(100),
                escola_indigena BOOLEAN DEFAULT FALSE,
                rede          VARCHAR(20) DEFAULT 'REGULAR'
            );

            -- Fonte 1: seduc_publ_regular_prof (usa 'regiao_integracao' como regional)
            INSERT INTO dim_escolas (codigo_escola, nome_escola, municipio, regional_dre, localizacao, escola_indigena, rede)
            SELECT DISTINCT ON (codigo_escola)
                codigo_escola, nome_escola, municipio, regiao_integracao, NULL, FALSE, 'REGULAR'
            FROM seduc_publ_regular_prof
            ON CONFLICT (codigo_escola) DO NOTHING;

            -- Fonte 2: seduc_nao_publ_regular_prof (tem 'regional')
            INSERT INTO dim_escolas (codigo_escola, nome_escola, municipio, regional_dre, localizacao, escola_indigena, rede)
            SELECT DISTINCT ON (codigo_escola)
                codigo_escola, nome_escola, municipio, regional, localizacao, escola_indigena, 'REGULAR'
            FROM seduc_nao_publ_regular_prof
            ON CONFLICT (codigo_escola) DO NOTHING;

            -- Fonte 3: seduc_nao_publ_regular_admin (tem 'regional')
            INSERT INTO dim_escolas (codigo_escola, nome_escola, municipio, regional_dre, localizacao, escola_indigena, rede)
            SELECT DISTINCT ON (codigo_escola)
                codigo_escola, nome_escola, municipio, regional, localizacao, escola_indigena, 'REGULAR'
            FROM seduc_nao_publ_regular_admin
            ON CONFLICT (codigo_escola) DO NOTHING;

            -- Fonte 4: seduc_publ_regular_admin (não tem 'regional')
            INSERT INTO dim_escolas (codigo_escola, nome_escola, municipio, regional_dre, localizacao, escola_indigena, rede)
            SELECT DISTINCT ON (codigo_escola)
                codigo_escola, nome_escola, municipio, NULL, localizacao, FALSE, 'REGULAR'
            FROM seduc_publ_regular_admin
            ON CONFLICT (codigo_escola) DO NOTHING;

            -- Fonte 5: seduc_bonus_eja_aee (tem 'regional')
            INSERT INTO dim_escolas (codigo_escola, nome_escola, municipio, regional_dre, localizacao, escola_indigena, rede)
            SELECT DISTINCT ON (codigo_escola)
                codigo_escola, nome_escola, municipio, regional, localizacao, escola_indigena, 'EJA_AEE'
            FROM seduc_bonus_eja_aee
            ON CONFLICT (codigo_escola) DO NOTHING;

            -- Fonte 6: seduc_publ_sectet (sem 'regional', sem 'localizacao')
            INSERT INTO dim_escolas (codigo_escola, nome_escola, municipio, regional_dre, localizacao, escola_indigena, rede)
            SELECT DISTINCT ON (codigo_escola)
                codigo_escola, nome_escola, municipio, 'SECTET', 'Urbana', FALSE, 'SECTET'
            FROM seduc_publ_sectet
            ON CONFLICT (codigo_escola) DO NOTHING;

            -- Fonte 7: seduc_nao_publ_sectet (tem 'regional', 'localizacao')
            INSERT INTO dim_escolas (codigo_escola, nome_escola, municipio, regional_dre, localizacao, escola_indigena, rede)
            SELECT DISTINCT ON (codigo_escola)
                codigo_escola, nome_escola, municipio, regional, localizacao, escola_indigena, 'SECTET'
            FROM seduc_nao_publ_sectet
            ON CONFLICT (codigo_escola) DO NOTHING;
        """)
        print("✅ Tabela 'dim_escolas' criada e populada!")

        # Agora cria a VIEW usando SOMENTE colunas que existem nas tabelas reais
        cur.execute("""
            SET search_path TO seduc, public;

            -- =================================================================
            -- VIEW CONSOLIDADA: vw_escola_resultado_completo
            -- =================================================================
            CREATE OR REPLACE VIEW vw_escola_resultado_completo AS
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
                    'EF ALFABETIZAÇÃO (1º e 2º)'::varchar(255) as etapa_ensino,
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
                    'EF ANOS INICIAIS (3º ao 5º)'::varchar(255) as etapa_ensino,
                    meta_pactuada,
                    ponto_crescimento,
                    ponto_fluxo,
                    bonus_prof_3_a_5_ano as bonus_professor
                FROM seduc_publ_regular_prof
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

                -- Status de publicação
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

                -- Bônus Professor (melhor valor disponível)
                COALESCE(
                    pub_p.bonus_professor,
                    pub_s.bonus_prof_vinculado_turma,
                    np_p.ponto_bonus_professor,
                    np_s.indice_bonus_gestao
                ) AS bonus_professor,

                -- Bônus Administrativo (melhor valor disponível)
                COALESCE(
                    pub_a.indice_bonus,
                    pub_s.bonus_cargo_administrativo,
                    np_a.indice_bonus_admin,
                    np_s.indice_bonus_gestao
                ) AS bonus_administrativo,

                -- EJA e AEE
                eja.eja_fundamental_iniciais AS bonus_eja_iniciais,
                eja.eja_fundamental_finais   AS bonus_eja_finais,
                eja.eja_medio                AS bonus_eja_medio,
                eja.atendimento_especializado_aee AS bonus_aee,

                -- Meta e Crescimento (escolas publicadas)
                COALESCE(pub_p.meta_pactuada, pub_s.atingiu_meta_pactuada) AS atingiu_meta,
                COALESCE(pub_p.ponto_crescimento, pub_s.ponto_crescimento) AS ponto_crescimento,
                COALESCE(pub_p.ponto_fluxo, pub_s.fluxo)                  AS fluxo,

                -- Etapa de ensino
                COALESCE(
                    pub_p.etapa_ensino,
                    CASE 
                        WHEN np_p.etapa_ensino = 'ENSINO FUNDAMENTAL ANOS INICIAIS' THEN 'EF ANOS INICIAIS (3º ao 5º)'
                        ELSE np_p.etapa_ensino 
                    END
                )::varchar(255) AS etapa_ensino

            FROM dim_escolas e
            LEFT JOIN pub_p_expanded           pub_p ON e.codigo_escola = pub_p.codigo_escola
            LEFT JOIN seduc_publ_regular_admin pub_a ON e.codigo_escola = pub_a.codigo_escola
            LEFT JOIN seduc_publ_sectet        pub_s ON e.codigo_escola = pub_s.codigo_escola
            LEFT JOIN seduc_nao_publ_regular_prof  np_p ON e.codigo_escola = np_p.codigo_escola
            LEFT JOIN seduc_nao_publ_regular_admin np_a ON e.codigo_escola = np_a.codigo_escola
            LEFT JOIN seduc_nao_publ_sectet        np_s ON e.codigo_escola = np_s.codigo_escola
            LEFT JOIN seduc_bonus_eja_aee          eja  ON e.codigo_escola = eja.codigo_escola;
        """)
        print("✅ View 'vw_escola_resultado_completo' criada!")

        # Validação
        cur.execute("SELECT COUNT(*) FROM seduc.dim_escolas;")
        total_escolas = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM seduc.vw_escola_resultado_completo;")
        total_view = cur.fetchone()[0]

        print(f"\n🎉 Base 100% pronta no Railway!")
        print(f"   📊 Escolas únicas catalogadas (dim_escolas): {total_escolas}")
        print(f"   📊 Registros na view consolidada: {total_view}")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Ocorreu um erro: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()