import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const etapa = searchParams.get("etapa") || "iniciais";
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

    let pontosCol = "pontos_ai";
    let matriculaCol = "matricula_ai";
    let bonusCol = "bonus_ai";

    if (etapa.toLowerCase().includes("final") || etapa === "finais") {
      pontosCol = "pontos_af";
      matriculaCol = "matricula_af";
      bonusCol = "bonus_af";
    } else if (
      etapa.toLowerCase().includes("médio") ||
      etapa.toLowerCase().includes("medio") ||
      etapa === "medio"
    ) {
      pontosCol = "pontos_em";
      matriculaCol = "matricula_em";
      bonusCol = "bonus_em";
    }

    const query = `
      SELECT
        ordem,
        UPPER(TRIM(dre)) AS dre,
        ${pontosCol} AS pontos_bonus,
        ${matriculaCol} AS matricula,
        ${bonusCol} AS bonus_etapa,
        bonus_ri,
        bonus_total,
        matricula_total
      FROM seduc.seduc_pontos_bonus_dre
      ${whereClause}
      ORDER BY ${pontosCol} DESC NULLS LAST, dre ASC
    `;

    const result = await pool.query(query, params);

    const data = result.rows.map((row) => ({
      ordem: row.ordem,
      dre: row.dre,
      pontos_bonus: row.pontos_bonus !== null ? Number(row.pontos_bonus) : null,
      matricula: row.matricula !== null ? Number(row.matricula) : null,
      bonus_etapa: row.bonus_etapa !== null ? Number(row.bonus_etapa) : null,
      bonus_ri: row.bonus_ri !== null ? Number(row.bonus_ri) : null,
      bonus_total: row.bonus_total !== null ? Number(row.bonus_total) : null,
      matricula_total: row.matricula_total !== null ? Number(row.matricula_total) : null,
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
