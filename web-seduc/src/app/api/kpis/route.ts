import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const dre = searchParams.get("dre") || "";
    const municipio = searchParams.get("municipio") || "";
    const regiaoIntegracao = searchParams.get("regiao_integracao") || "";
    const etapa = searchParams.get("etapa") || "";
    const rede = searchParams.get("rede") || "";
    const localizacao = searchParams.get("localizacao") || "";

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (search.trim()) {
      conditions.push(`(codigo_escola ILIKE $${paramIdx} OR UPPER(nome_escola) ILIKE $${paramIdx})`);
      params.push(`%${search.toUpperCase().trim()}%`);
      paramIdx++;
    }

    if (dre) {
      conditions.push(`UPPER(TRIM(regional_dre)) = $${paramIdx}`);
      params.push(dre.toUpperCase().trim());
      paramIdx++;
    }

    if (municipio) {
      conditions.push(`UPPER(TRIM(municipio)) = $${paramIdx}`);
      params.push(municipio.toUpperCase().trim());
      paramIdx++;
    }

    if (regiaoIntegracao) {
      conditions.push(`UPPER(TRIM(regiao_integracao)) = $${paramIdx}`);
      params.push(regiaoIntegracao.toUpperCase().trim());
      paramIdx++;
    }

    if (rede) {
      conditions.push(`rede = $${paramIdx}`);
      params.push(rede);
      paramIdx++;
    }

    if (localizacao) {
      conditions.push(`localizacao = $${paramIdx}`);
      params.push(localizacao);
      paramIdx++;
    }

    const destaqueRi = searchParams.get("destaque_ri") || "";
    if (destaqueRi === "sim") {
      conditions.push(`elegivel_16_salario = TRUE`);
    } else if (destaqueRi === "nao") {
      conditions.push(`elegivel_16_salario = FALSE`);
    }

    if (etapa) {
      if (etapa.includes("Alfabetiza") || etapa.includes("1º e 2º")) {
        conditions.push(`(etapa_ensino ILIKE '%ALFABETIZA%' OR etapa_ensino ILIKE '%1%2%' OR oferta_alfabetizacao = TRUE)`);
      } else if (etapa.includes("Iniciais") || etapa.includes("3º ao 5º")) {
        conditions.push(`((etapa_ensino ILIKE '%INICIAIS%' OR etapa_ensino ILIKE '%3%5%') AND etapa_ensino NOT ILIKE '%ALFABETIZA%' AND etapa_ensino NOT ILIKE '%1%2%')`);
      } else if (etapa.includes("Finais") || etapa.includes("6º ao 9º")) {
        conditions.push(`(etapa_ensino ILIKE '%FINAIS%' OR etapa_ensino ILIKE '%6%9%')`);
      } else if (etapa.includes("Médio") || etapa.includes("Medio")) {
        conditions.push(`(etapa_ensino ILIKE '%MEDIO%' OR etapa_ensino ILIKE '%MÉDIO%')`);
      } else {
        conditions.push(`etapa_ensino ILIKE $${paramIdx}`);
        params.push(`%${etapa.trim()}%`);
        paramIdx++;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      WITH filtered_vw AS (
        SELECT *
        FROM seduc.vw_escola_resultado_completo
        ${whereClause}
      )
      SELECT
        COUNT(DISTINCT codigo_escola)::int AS total_escolas,
        COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' THEN codigo_escola END)::int AS escolas_publicadas,
        GREATEST(0, (COUNT(DISTINCT codigo_escola) - COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' THEN codigo_escola END)))::int AS escolas_nao_publicadas,
        COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' AND atingiu_meta >= 1 THEN codigo_escola END)::int AS total_meta_sim,
        COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' AND ponto_crescimento > 0 THEN codigo_escola END)::int AS total_crescimento_positivo,
        COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' AND (atingiu_meta IS NULL OR atingiu_meta < 1) AND (ponto_crescimento IS NULL OR ponto_crescimento <= 0) AND fluxo > 0 THEN codigo_escola END)::int AS total_somente_fluxo,
        COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' AND bonus_professor = 0.0 THEN codigo_escola END)::int AS total_fator_zero,
        COUNT(DISTINCT CASE WHEN oferta_alfabetizacao = TRUE THEN codigo_escola END)::int AS total_alfabetizacao
      FROM filtered_vw
    `;

    const client = await pool.connect();
    try {
      const result = await client.query(query, params);
      const row = result.rows[0] || {};

      // Calculate EJA / AEE count for current filters:
      const ejaConditions: string[] = [];
      const ejaParams: (string | number)[] = [];
      let ejaIdx = 1;

      if (dre) {
        ejaConditions.push(`UPPER(TRIM(e.regional)) = $${ejaIdx}`);
        ejaParams.push(dre.toUpperCase().trim());
        ejaIdx++;
      }
      if (municipio) {
        ejaConditions.push(`UPPER(TRIM(e.municipio)) = $${ejaIdx}`);
        ejaParams.push(municipio.toUpperCase().trim());
        ejaIdx++;
      }
      if (regiaoIntegracao) {
        ejaConditions.push(`UPPER(TRIM(d.regiao_integracao)) = $${ejaIdx}`);
        ejaParams.push(regiaoIntegracao.toUpperCase().trim());
        ejaIdx++;
      }
      if (search.trim()) {
        ejaConditions.push(`(e.codigo_escola ILIKE $${ejaIdx} OR UPPER(e.nome_escola) ILIKE $${ejaIdx})`);
        ejaParams.push(`%${search.toUpperCase().trim()}%`);
        ejaIdx++;
      }

      const ejaWhere = ejaConditions.length > 0 ? `WHERE ${ejaConditions.join(" AND ")}` : "";
      const ejaQuery = `
        SELECT COUNT(DISTINCT e.codigo_escola)::int AS count
        FROM seduc.seduc_bonus_eja_aee e
        LEFT JOIN seduc.dim_escolas d ON d.codigo_escola = e.codigo_escola
        ${ejaWhere}
      `;
      const ejaRes = await client.query(ejaQuery, ejaParams);
      const escolas_eja_aee = parseInt(ejaRes.rows[0]?.count || "0", 10);

      const total_escolas = parseInt(row.total_escolas || "0", 10);
      const escolas_publicadas = parseInt(row.escolas_publicadas || "0", 10);
      const escolas_nao_publicadas = parseInt(row.escolas_nao_publicadas || "0", 10);
      const total_meta_sim = parseInt(row.total_meta_sim || "0", 10);
      const total_crescimento_positivo = parseInt(row.total_crescimento_positivo || "0", 10);
      const total_somente_fluxo = parseInt(row.total_somente_fluxo || "0", 10);
      const total_fator_zero = parseInt(row.total_fator_zero || "0", 10);
      const total_alfabetizacao = parseInt(row.total_alfabetizacao || "0", 10);

      return NextResponse.json({
        total_escolas,
        escolas_publicadas,
        escolas_nao_publicadas,
        escolas_eja_aee,
        total_meta_sim,
        total_crescimento_positivo,
        total_somente_fluxo,
        total_fator_zero,
        total_alfabetizacao,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("KPI error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar KPIs" },
      { status: 500 }
    );
  }
}
