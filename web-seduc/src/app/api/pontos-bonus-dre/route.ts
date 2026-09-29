import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dre = searchParams.get("dre") || "";

    const conditions: string[] = [];
    const params: string[] = [];
    let paramIdx = 1;

    if (dre) {
      conditions.push(`UPPER(TRIM(dre)) = $${paramIdx}`);
      params.push(dre.toUpperCase().trim());
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        ordem,
        UPPER(TRIM(dre)) AS dre,
        matricula_total,
        bonus_ai,
        bonus_af,
        bonus_em,
        bonus_ri,
        bonus_total
      FROM seduc.seduc_pontos_bonus_dre
      ${whereClause}
      ORDER BY bonus_total DESC NULLS LAST, dre ASC
    `;

    const result = await pool.query(query, params);

    const data = result.rows.map((row) => ({
      ordem: row.ordem !== null ? Number(row.ordem) : null,
      dre: row.dre,
      matricula_total: row.matricula_total !== null ? Number(row.matricula_total) : null,
      bonus_ai: row.bonus_ai !== null ? Number(row.bonus_ai) : null,
      bonus_af: row.bonus_af !== null ? Number(row.bonus_af) : null,
      bonus_em: row.bonus_em !== null ? Number(row.bonus_em) : null,
      bonus_ri: row.bonus_ri !== null ? Number(row.bonus_ri) : null,
      bonus_total: row.bonus_total !== null ? Number(row.bonus_total) : null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Pontos Bonus DRE error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pontos de bônus por DRE" },
      { status: 500 }
    );
  }
}
