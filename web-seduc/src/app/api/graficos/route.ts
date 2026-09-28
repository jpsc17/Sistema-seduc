// src/app/api/graficos/route.ts

import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { GraficosResponse } from "@/lib/types";

export async function GET() {
  try {
    // 1️⃣ Resumo da rede
    const resumoRes = await pool.query(
      `SELECT 
        COUNT(*) AS total_escolas,
        COUNT(*) FILTER (WHERE status_publicacao = 'PUBLICADA') AS publicadas,
        COUNT(*) FILTER (WHERE status_publicacao = 'NAO_PUBLICADA') AS nao_publicadas,
        COUNT(*) FILTER (WHERE bonus_eja_iniciais IS NOT NULL OR bonus_eja_finais IS NOT NULL OR bonus_eja_medio IS NOT NULL OR bonus_aee IS NOT NULL) AS registros_eja_aee,
        COUNT(DISTINCT regiao_integracao) AS regioes_integracao
               FROM seduc.vw_escola_resultado_completo`
    );
    const resumoRow = resumoRes.rows[0];
    const resumo = {
      totalEscolas: Number(resumoRow.total_escolas),
      publicadas: Number(resumoRow.publicadas),
      naoPublicadas: Number(resumoRow.nao_publicadas),
      percentualPublicadas: Number(((resumoRow.publicadas / resumoRow.total_escolas) * 100).toFixed(2)),
      percentualNaoPublicadas: Number(((resumoRow.nao_publicadas / resumoRow.total_escolas) * 100).toFixed(2)),
      registrosEjaAee: Number(resumoRow.registros_eja_aee),
      regioesIntegracao: Number(resumoRow.regioes_integracao),
    };

    // 2️⃣ Situação da rede (donut)
    const situacaoRede = [
      {
        label: "Publicadas",
        quantidade: Number(resumoRow.publicadas),
        percentual: Number(((resumoRow.publicadas / resumoRow.total_escolas) * 100).toFixed(2)),
      },
      {
        label: "Não publicadas",
        quantidade: Number(resumoRow.nao_publicadas),
        percentual: Number(((resumoRow.nao_publicadas / resumoRow.total_escolas) * 100).toFixed(2)),
      },
    ];

    // 3️⃣ Meta (SIM / NÃO) – tabela vw_escola_resultado_completo
    const metaRes = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE atingiu_meta = 1) AS sim,
        COUNT(*) FILTER (WHERE atingiu_meta = 0) AS nao 
       FROM seduc.vw_escola_resultado_completo`
    );
    const meta = {
      sim: Number(metaRes.rows[0].sim),
      nao: Number(metaRes.rows[0].nao),
    };

    // 4️⃣ Crescimento (positivo, zero, negativo)
    const cresRes = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE ponto_crescimento > 0) AS positivo,
        COUNT(*) FILTER (WHERE ponto_crescimento = 0) AS zero,
        COUNT(*) FILTER (WHERE ponto_crescimento < 0) AS negativo 
       FROM seduc.vw_escola_resultado_completo`
    );
    const crescimento = {
      positivo: Number(cresRes.rows[0].positivo),
      zero: Number(cresRes.rows[0].zero),
      negativo: Number(cresRes.rows[0].negativo),
    };

    // 5️⃣ IDEB por Etapa (média)
    const idebEtapaRes = await pool.query(
      `SELECT 
        etapa_ensino AS etapa,
        AVG(ideb::numeric) AS media_ideb 
       FROM seduc.seduc_ideb_dre 
       GROUP BY etapa_ensino`
    );
    const idebPorEtapa = idebEtapaRes.rows.map((r: any) => ({
      etapa: r.etapa,
      mediaIdeb: Number(r.media_ideb),
    }));

    // 6️⃣ IDEB por DRE (média)
    const idebDreRes = await pool.query(
      `SELECT 
        dre,
        AVG(ideb::numeric) AS media_ideb 
       FROM seduc.seduc_ideb_dre 
       GROUP BY dre 
       ORDER BY dre`
    );
    const idebPorDre = idebDreRes.rows.map((r: any) => ({
      dre: r.dre,
      mediaIdeb: Number(r.media_ideb),
    }));


    // 7️⃣ IDEB por Região de Integração (média via view consolidada)
    const idebRiRes = await pool.query(
      `SELECT 
        regiao_integracao AS ri,
        AVG(bonus_professor::numeric) AS media_bonus
       FROM seduc.vw_escola_resultado_completo
       WHERE regiao_integracao IS NOT NULL
       GROUP BY regiao_integracao`
    );
    const idebPorRi = idebRiRes.rows.map((r: any) => ({
      ri: r.ri,
      mediaIdeb: Number(r.media_bonus) || 0,
    }));

    // 8️⃣ Destaques por Região de Integração (maiores bonificações por região)
    const destaqueRiRes = await pool.query(
      `SELECT DISTINCT ON (regiao_integracao)
          regiao_integracao AS ri,
          COALESCE(etapa_ensino, '—') AS etapa,
          codigo_escola AS inep,
          nome_escola AS escola,
          'Bonificação' AS indicador,
          COALESCE(bonus_professor::numeric, 0) AS valor
        FROM seduc.vw_escola_resultado_completo
        WHERE regiao_integracao IS NOT NULL
        ORDER BY regiao_integracao, bonus_professor::numeric DESC NULLS LAST;
      `
    );
    const destaquesRi = destaqueRiRes.rows.map((r: any) => ({
      ri: r.ri,
      etapa: r.etapa,
      escola: r.escola,
      inep: r.inep,
      indicador: r.indicador as "IDEB",
      valor: Number(r.valor),
    }));

    // 9️⃣ EJA / AEE distribuição
    const ejaAeeRes = await pool.query(
      `SELECT 
         CASE 
           WHEN bonus_eja_iniciais IS NOT NULL OR bonus_eja_finais IS NOT NULL OR bonus_eja_medio IS NOT NULL THEN 'EJA'
           WHEN bonus_aee IS NOT NULL THEN 'AEE'
         END AS modalidade,
         COUNT(*) AS quantidade 
       FROM seduc.vw_escola_resultado_completo 
       WHERE bonus_eja_iniciais IS NOT NULL OR bonus_eja_finais IS NOT NULL OR bonus_eja_medio IS NOT NULL OR bonus_aee IS NOT NULL
       GROUP BY modalidade`
    );
    const ejaAee = ejaAeeRes.rows.map((r: any) => ({
      modalidade: r.modalidade as "EJA" | "AEE",
      quantidade: Number(r.quantidade),
    }));

    // 🔟 Pontuação das DREs
    const pontosDreRes = await pool.query(
      `SELECT dre, bonus_total::numeric AS pontuacao FROM seduc.seduc_pontos_bonus_dre ORDER BY bonus_total::numeric DESC NULLS LAST`
    );
    const pontosDre = pontosDreRes.rows.map((r: any) => ({
      dre: r.dre,
      pontuacao: Number(r.pontuacao) || 0,
    }));

    const response: GraficosResponse = {
      resumo,
      situacaoRede,
      meta,
      crescimento,
      idebPorEtapa,
      idebPorDre,
      idebPorRi,
      destaquesRi,
      ejaAee,
      pontosDre,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Erro ao gerar dados de gráficos:", err);
    return NextResponse.json({ error: "Erro interno ao processar dados de gráficos" }, { status: 500 });
  }
}
