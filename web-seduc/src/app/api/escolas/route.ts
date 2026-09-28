import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tipo") || searchParams.get("tab") || "publicadas";
    const search = searchParams.get("search") || "";
    const dre = searchParams.get("dre") || "";
    const municipio = searchParams.get("municipio") || "";
    const rede = searchParams.get("rede") || "";
    const localizacao = searchParams.get("localizacao") || "";
    const regiaoIntegracao = searchParams.get("regiao_integracao") || "";
    const etapa = searchParams.get("etapa") || searchParams.get("etapa_filtro") || "";
    const isExport = searchParams.get("export") === "true" || searchParams.get("all") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    // Filter by tab
    if (tab === "publicadas") {
      conditions.push(`status_publicacao = 'PUBLICADA'`);
    } else if (tab === "nao_publicadas") {
      conditions.push(`status_publicacao = 'NAO_PUBLICADA'`);
    }

    // Filter by Etapa de Ensino
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

    // Search by code or name
    if (search) {
      conditions.push(
        `(codigo_escola ILIKE $${paramIdx} OR UPPER(nome_escola) ILIKE $${paramIdx})`
      );
      params.push(`%${search.toUpperCase().trim()}%`);
      paramIdx++;
    }

    // Filter by DRE (case-insensitive & trimmed)
    if (dre) {
      conditions.push(`UPPER(TRIM(regional_dre)) = $${paramIdx}`);
      params.push(dre.toUpperCase().trim());
      paramIdx++;
    }

    // Filter by Município (case-insensitive & trimmed)
    if (municipio) {
      conditions.push(`UPPER(TRIM(municipio)) = $${paramIdx}`);
      params.push(municipio.toUpperCase().trim());
      paramIdx++;
    }

    // Filter by Rede
    if (rede) {
      conditions.push(`rede = $${paramIdx}`);
      params.push(rede);
      paramIdx++;
    }

    // Filter by Localização
    if (localizacao) {
      conditions.push(`localizacao = $${paramIdx}`);
      params.push(localizacao);
      paramIdx++;
    }

    // Filter by Região de Integração
    if (regiaoIntegracao) {
      conditions.push(`UPPER(TRIM(regiao_integracao)) = $${paramIdx}`);
      params.push(regiaoIntegracao.toUpperCase().trim());
      paramIdx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const selectFields = `
      codigo_escola,
      nome_escola,
      municipio,
      COALESCE(regional_dre, '—') AS regional_dre,
      regiao_integracao,
      localizacao,
      escola_indigena,
      rede,
      status_publicacao,
      bonus_professor,
      bonus_administrativo,
      bonus_eja_iniciais,
      bonus_eja_finais,
      bonus_eja_medio,
      bonus_aee,
      atingiu_meta,
      ponto_crescimento,
      fluxo,
      etapa_ensino,
      etapa_ensino AS etapa,
      COALESCE(oferta_alfabetizacao, FALSE) AS oferta_alfabetizacao,
      COALESCE(meta_alfabetizacao_atingida, FALSE) AS meta_alfabetizacao_atingida,
      COALESCE(elegivel_16_salario, FALSE) AS elegivel_16_salario,
      motivo_16_salario,
      COALESCE(status_premiacao_ri, 'NÃO ELEGÍVEL') AS status_premiacao_ri
    `;

    const orderClause = `
      ORDER BY 
        municipio ASC,
        nome_escola ASC,
        codigo_escola ASC,
        CASE 
          WHEN etapa_ensino ILIKE '%ALFABETIZA%' OR etapa_ensino ILIKE '%1%2%' THEN 1
          WHEN etapa_ensino ILIKE '%INICIAIS%' OR etapa_ensino ILIKE '%3%5%' THEN 2
          WHEN etapa_ensino ILIKE '%FINAIS%' OR etapa_ensino ILIKE '%6%9%' THEN 3
          WHEN etapa_ensino ILIKE '%MÉDIO%' OR etapa_ensino ILIKE '%MEDIO%' THEN 4
          ELSE 5
        END ASC
    `;

    if (isExport) {
      const dataResult = await pool.query(
        `SELECT ${selectFields} FROM seduc.vw_escola_resultado_completo ${whereClause}
         ${orderClause}`,
        params
      );

      return NextResponse.json({
        data: dataResult.rows,
        total: dataResult.rows.length,
      });
    }

    // Normal paginated request
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM seduc.vw_escola_resultado_completo ${whereClause}`,
      params
    );

    const dataResult = await pool.query(
      `SELECT ${selectFields} FROM seduc.vw_escola_resultado_completo ${whereClause}
       ${orderClause}
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    const total = parseInt(countResult.rows[0].total, 10);

    return NextResponse.json({
      data: dataResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Escolas error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar escolas" },
      { status: 500 }
    );
  }
}
