import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const dre = searchParams.get("dre") || "";
    const municipio = searchParams.get("municipio") || "";
    const localizacao = searchParams.get("localizacao") || "";
    const isExport = searchParams.get("export") === "true" || searchParams.get("all") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(codigo_escola ILIKE $${paramIdx} OR nome_escola ILIKE $${paramIdx})`
      );
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (dre) {
      conditions.push(`regional = $${paramIdx}`);
      params.push(dre);
      paramIdx++;
    }

    if (municipio) {
      conditions.push(`municipio = $${paramIdx}`);
      params.push(municipio);
      paramIdx++;
    }

    if (localizacao) {
      conditions.push(`localizacao = $${paramIdx}`);
      params.push(localizacao);
      paramIdx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    if (isExport) {
      const dataResult = await pool.query(
        `SELECT
           regional,
           municipio,
           localizacao,
           escola_indigena,
           codigo_escola,
           tem_publicacao,
           nome_escola,
           eja_fundamental_iniciais,
           eja_fundamental_finais,
           eja_medio,
           atendimento_especializado_aee
         FROM seduc.seduc_bonus_eja_aee ${whereClause}
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
      `SELECT COUNT(*) AS total FROM seduc.seduc_bonus_eja_aee ${whereClause}`,
      params
    );

    const dataResult = await pool.query(
      `SELECT
         regional,
         municipio,
         localizacao,
         escola_indigena,
         codigo_escola,
         tem_publicacao,
         nome_escola,
         eja_fundamental_iniciais,
         eja_fundamental_finais,
         eja_medio,
         atendimento_especializado_aee
       FROM seduc.seduc_bonus_eja_aee ${whereClause}
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
    console.error("EJA/AEE error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados EJA/AEE" },
      { status: 500 }
    );
  }
}
