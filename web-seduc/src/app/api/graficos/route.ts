import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { DashboardGraficosData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dre = searchParams.get("dre")?.trim() || null;
  const ri = searchParams.get("regiao_integracao")?.trim() || searchParams.get("ri")?.trim() || null;

  const client = await pool.connect();
  try {
    // 1. Resumo executivo da rede (consultas estritamente parametrizadas no PostgreSQL)
    const resumoQuery = await client.query(
      `
      WITH counts AS (
        SELECT 
          (SELECT COUNT(DISTINCT codigo_escola) FROM seduc.dim_escolas
           WHERE ($1::text IS NULL OR UPPER(TRIM(regional_dre)) = UPPER(TRIM($1)))
             AND ($2::text IS NULL OR UPPER(TRIM(regiao_integracao)) = UPPER(TRIM($2)))) AS total_escolas,
          (SELECT COUNT(DISTINCT codigo_escola) FROM seduc.vw_escola_resultado_completo 
           WHERE status_publicacao = 'PUBLICADA'
             AND ($1::text IS NULL OR UPPER(TRIM(regional_dre)) = UPPER(TRIM($1)))
             AND ($2::text IS NULL OR UPPER(TRIM(regiao_integracao)) = UPPER(TRIM($2)))) AS publicadas,
          (SELECT COUNT(*) FROM seduc.seduc_bonus_eja_aee
           WHERE ($1::text IS NULL OR UPPER(TRIM(regional)) = UPPER(TRIM($1)))) AS registros_eja_aee,
          (SELECT COUNT(DISTINCT regiao_integracao) FROM seduc.dim_escolas 
           WHERE regiao_integracao IS NOT NULL
             AND ($1::text IS NULL OR UPPER(TRIM(regional_dre)) = UPPER(TRIM($1)))
             AND ($2::text IS NULL OR UPPER(TRIM(regiao_integracao)) = UPPER(TRIM($2)))) AS total_ri
      )
      SELECT 
        total_escolas::int,
        publicadas::int,
        (total_escolas - publicadas)::int AS nao_publicadas,
        ROUND((publicadas::numeric / NULLIF(total_escolas, 0)::numeric) * 100, 2)::float AS pct_publicadas,
        ROUND(((total_escolas - publicadas)::numeric / NULLIF(total_escolas, 0)::numeric) * 100, 2)::float AS pct_nao_publicadas,
        registros_eja_aee::int,
        total_ri::int
      FROM counts;
      `,
      [dre, ri]
    );

    const rRow = resumoQuery.rows[0];
    const totalEscolas = rRow?.total_escolas ?? 972;
    const publicadas = rRow?.publicadas ?? 895;
    const naoPublicadas = rRow?.nao_publicadas ?? 77;
    const pctPub = rRow?.pct_publicadas ?? 92.08;
    const pctNaoPub = rRow?.pct_nao_publicadas ?? 7.92;

    const resumo: DashboardGraficosData["resumo"] = {
      totalEscolas,
      publicadas,
      naoPublicadas,
      percentualPublicadas: pctPub,
      percentualNaoPublicadas: pctNaoPub,
      registrosEjaAee: rRow?.registros_eja_aee ?? 924,
      totalRegioesIntegracao: rRow?.total_ri ?? 12,
    };

    // 2. Situação da Rede (Publicadas vs Não Publicadas)
    const situacaoRede: DashboardGraficosData["situacaoRede"] = [
      {
        nome: "Publicadas",
        valor: resumo.publicadas,
        percentual: resumo.percentualPublicadas,
      },
      {
        nome: "Não Publicadas",
        valor: resumo.naoPublicadas,
        percentual: resumo.percentualNaoPublicadas,
      },
    ];

    // 3. Metas (14º Salário) e Crescimento (15º Salário) — Matriz 2x2
    const metaCrescQuery = await client.query(
      `
      WITH escola_pub AS (
        SELECT 
          codigo_escola,
          MAX(COALESCE(atingiu_meta, 0)) AS max_meta,
          MAX(COALESCE(ponto_crescimento, 0)) AS max_cresc
        FROM seduc.vw_escola_resultado_completo
        WHERE status_publicacao = 'PUBLICADA'
          AND ($1::text IS NULL OR UPPER(TRIM(regional_dre)) = UPPER(TRIM($1)))
          AND ($2::text IS NULL OR UPPER(TRIM(regiao_integracao)) = UPPER(TRIM($2)))
        GROUP BY codigo_escola
      ),
      cat_counts AS (
        SELECT
          COUNT(*) AS total,
          COUNT(CASE WHEN max_meta > 0 THEN 1 END) AS meta_sim,
          COUNT(CASE WHEN max_meta = 0 THEN 1 END) AS meta_nao,
          COUNT(CASE WHEN max_cresc > 0 THEN 1 END) AS cresc_pos,
          COUNT(CASE WHEN max_cresc = 0 THEN 1 END) AS cresc_zero,
          COUNT(CASE WHEN max_meta > 0 AND max_cresc > 0 THEN 1 END) AS ambos,
          COUNT(CASE WHEN max_meta > 0 AND max_cresc = 0 THEN 1 END) AS apenas_meta,
          COUNT(CASE WHEN max_meta = 0 AND max_cresc > 0 THEN 1 END) AS apenas_cresc,
          COUNT(CASE WHEN max_meta = 0 AND max_cresc = 0 THEN 1 END) AS nenhum
        FROM escola_pub
      )
      SELECT * FROM cat_counts;
      `,
      [dre, ri]
    );

    const mc = metaCrescQuery.rows[0];
    const totalPub = Number(mc?.total || resumo.publicadas || 895);
    const ambos = Number(mc?.ambos || 0);
    const apenasCresc = Number(mc?.apenas_cresc || 0);
    const apenasMeta = Number(mc?.apenas_meta || 0);
    const nenhum = Number(mc?.nenhum || 0);

    const metaCrescimento: DashboardGraficosData["metaCrescimento"] = {
      metaSim: Number(mc?.meta_sim || 0),
      metaNao: Number(mc?.meta_nao || 0),
      crescimentoPositivo: Number(mc?.cresc_pos || 0),
      crescimentoZero: Number(mc?.cresc_zero || 0),
      matriz: [
        {
          categoria: "Meta + Crescimento",
          quantidade: ambos,
          percentual: Number(((ambos / (totalPub || 1)) * 100).toFixed(2)),
          impactoSalario: "14º e 15º",
        },
        {
          categoria: "Apenas Crescimento",
          quantidade: apenasCresc,
          percentual: Number(((apenasCresc / (totalPub || 1)) * 100).toFixed(2)),
          impactoSalario: "15º Salário",
        },
        {
          categoria: "Apenas Meta",
          quantidade: apenasMeta,
          percentual: Number(((apenasMeta / (totalPub || 1)) * 100).toFixed(2)),
          impactoSalario: "14º Salário",
        },
        {
          categoria: "Nenhum",
          quantidade: nenhum,
          percentual: Number(((nenhum / (totalPub || 1)) * 100).toFixed(2)),
          impactoSalario: "Sem Bônus Extra",
        },
      ],
    };

    // 4. Desempenho IDEB
    // 4.1 Por Etapa de Ensino (Escala de 0 a 10)
    const idebEtapaQuery = await client.query(
      `
      SELECT 
        etapa_ensino AS etapa,
        ROUND(AVG(NULLIF(ideb, '')::numeric), 2)::float AS "mediaIdeb"
      FROM seduc.seduc_ideb_dre
      WHERE ideb IS NOT NULL AND ideb != ''
        AND ($1::text IS NULL OR UPPER(TRIM(dre)) = UPPER(TRIM($1)))
      GROUP BY etapa_ensino
      ORDER BY "mediaIdeb" DESC;
      `,
      [dre]
    );

    // 4.2 Por Regional DRE e Etapa (permite alternar entre Todas, Anos Iniciais, Anos Finais e Ensino Médio)
    const idebDreQuery = await client.query(
      `
      SELECT 
        UPPER(TRIM(dre)) AS dre,
        etapa_ensino AS etapa,
        ROUND(NULLIF(ideb, '')::numeric, 2)::float AS "mediaIdeb",
        ROUND(fluxo_tempo_medio, 2)::float AS fluxo
      FROM seduc.seduc_ideb_dre
      WHERE ideb IS NOT NULL AND ideb != ''
        AND ($1::text IS NULL OR UPPER(TRIM(dre)) = UPPER(TRIM($1)))
      ORDER BY "mediaIdeb" DESC, dre ASC;
      `,
      [dre]
    );

    // 4.3 Proficiência DRE (Língua Portuguesa e Matemática separadas na escala SAEB 200-300)
    const proficienciaDreQuery = await client.query(
      `
      SELECT 
        UPPER(TRIM(dre)) AS dre,
        ROUND(AVG(desempenho_lingua_portuguesa), 1)::float AS lp,
        ROUND(AVG(desempenho_matematica), 1)::float AS mat
      FROM seduc.seduc_ideb_dre
      WHERE desempenho_lingua_portuguesa IS NOT NULL
        AND ($1::text IS NULL OR UPPER(TRIM(dre)) = UPPER(TRIM($1)))
      GROUP BY UPPER(TRIM(dre))
      ORDER BY UPPER(TRIM(dre)) ASC;
      `,
      [dre]
    );

    // 5. Regiões de Integração (RI) e Destaques do 16º Salário
    // 5.1 IDEB Médio por Região de Integração (12 RIs)
    const riIdebQuery = await client.query(
      `
      WITH dre_ri AS (
        SELECT DISTINCT UPPER(TRIM(regional_dre)) AS dre, UPPER(TRIM(regiao_integracao)) AS ri
        FROM seduc.dim_escolas
        WHERE regional_dre IS NOT NULL AND regiao_integracao IS NOT NULL
      )
      SELECT 
        d.ri,
        ROUND(AVG(NULLIF(i.ideb, '')::numeric), 2)::float AS "mediaIdeb"
      FROM seduc.seduc_ideb_dre i
      JOIN dre_ri d ON UPPER(TRIM(i.dre)) = d.dre
      WHERE i.ideb IS NOT NULL AND i.ideb != ''
        AND ($1::text IS NULL OR d.ri = UPPER(TRIM($1)))
      GROUP BY d.ri
      ORDER BY "mediaIdeb" DESC;
      `,
      [ri]
    );

    // 5.2 Destaques do 16º Salário (Melhor Desempenho e Maior Crescimento por RI e Etapa)
    const destaques16Query = await client.query(
      `
      WITH ranked_desempenho AS (
        SELECT 
          regiao_integracao,
          etapa_ensino,
          codigo_escola,
          nome_escola,
          bonus_professor,
          ROW_NUMBER() OVER (
            PARTITION BY regiao_integracao, etapa_ensino 
            ORDER BY bonus_professor DESC, codigo_escola
          ) AS rk
        FROM seduc.vw_escola_resultado_completo
        WHERE elegivel_16_salario = true 
          AND (motivo_16_salario = 'Melhor Desempenho RI' OR bonus_professor > 0)
          AND ($1::text IS NULL OR UPPER(TRIM(regional_dre)) = UPPER(TRIM($1)))
          AND ($2::text IS NULL OR UPPER(TRIM(regiao_integracao)) = UPPER(TRIM($2)))
      ),
      ranked_crescimento AS (
        SELECT 
          regiao_integracao,
          etapa_ensino,
          codigo_escola,
          nome_escola,
          ponto_crescimento,
          ROW_NUMBER() OVER (
            PARTITION BY regiao_integracao, etapa_ensino 
            ORDER BY ponto_crescimento DESC, codigo_escola
          ) AS rk
        FROM seduc.vw_escola_resultado_completo
        WHERE elegivel_16_salario = true 
          AND (motivo_16_salario = 'Maior Crescimento RI' OR ponto_crescimento > 0)
          AND ($1::text IS NULL OR UPPER(TRIM(regional_dre)) = UPPER(TRIM($1)))
          AND ($2::text IS NULL OR UPPER(TRIM(regiao_integracao)) = UPPER(TRIM($2)))
      )
      SELECT 
        COALESCE(d.regiao_integracao, c.regiao_integracao) AS ri,
        COALESCE(d.etapa_ensino, c.etapa_ensino) AS etapa,
        COALESCE(d.codigo_escola, '') AS inep_ideb,
        COALESCE(d.nome_escola, '') AS nome_ideb,
        COALESCE(d.bonus_professor, 0)::float AS valor_ideb,
        COALESCE(c.codigo_escola, '') AS inep_cresc,
        COALESCE(c.nome_escola, '') AS nome_cresc,
        COALESCE(c.ponto_crescimento, 0)::float AS valor_cresc
      FROM ranked_desempenho d
      FULL OUTER JOIN ranked_crescimento c 
        ON d.regiao_integracao = c.regiao_integracao 
       AND d.etapa_ensino = c.etapa_ensino 
       AND d.rk = 1 AND c.rk = 1
      WHERE d.rk = 1 OR c.rk = 1
      ORDER BY ri, etapa;
      `,
      [dre, ri]
    );

    const destaques16 = destaques16Query.rows.map((row) => ({
      ri: row.ri,
      etapa: row.etapa,
      escolaMaiorIdeb: {
        inep: row.inep_ideb,
        nome: row.nome_ideb,
        valor: row.valor_ideb,
      },
      escolaMaiorCrescimento: {
        inep: row.inep_cresc,
        nome: row.nome_cresc,
        valor: row.valor_cresc,
      },
    }));

    // 6. Modalidades e Pontos
    // 6.1 EJA e AEE por Regional DRE
    const ejaAeeDreQuery = await client.query(
      `
      SELECT 
        UPPER(TRIM(regional)) AS dre,
        COUNT(*)::int AS total
      FROM seduc.seduc_bonus_eja_aee
      WHERE ($1::text IS NULL OR UPPER(TRIM(regional)) = UPPER(TRIM($1)))
      GROUP BY UPPER(TRIM(regional))
      ORDER BY total DESC;
      `,
      [dre]
    );

    // 6.2 Pontos de Bônus Institucional por Regional DRE
    const pontosDreQuery = await client.query(
      `
      SELECT 
        UPPER(TRIM(dre)) AS dre,
        ROUND(bonus_total, 2)::float AS "totalPontos"
      FROM seduc.seduc_pontos_bonus_dre
      WHERE dre IS NOT NULL
        AND ($1::text IS NULL OR UPPER(TRIM(dre)) = UPPER(TRIM($1)))
      ORDER BY bonus_total DESC NULLS LAST;
      `,
      [dre]
    );

    const data: DashboardGraficosData = {
      resumo,
      situacaoRede,
      metaCrescimento,
      ideb: {
        porEtapa: idebEtapaQuery.rows,
        porDre: idebDreQuery.rows,
        proficienciaDre: proficienciaDreQuery.rows,
      },
      regioesIntegracao: {
        porRi: riIdebQuery.rows,
        destaques16,
      },
      modalidadesEPontos: {
        ejaAeePorDre: ejaAeeDreQuery.rows,
        pontosPorDre: pontosDreQuery.rows,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro na rota /api/graficos:", error);
    return NextResponse.json(
      { error: "Erro ao gerar indicadores gráficos consolidados" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
