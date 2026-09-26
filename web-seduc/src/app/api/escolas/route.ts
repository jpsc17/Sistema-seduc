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
      COALESCE(elegivel_16_salario, FALSE) AS elegivel_16_salario,
      motivo_16_salario
    `;

    if (isExport) {
      const dataResult = await pool.query(
        `SELECT ${selectFields} FROM seduc.vw_escola_resultado_completo ${whereClause}
         ORDER BY municipio, nome_escola`,
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
       ORDER BY municipio, nome_escola
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
