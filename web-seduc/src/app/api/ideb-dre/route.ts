import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const etapa = searchParams.get("etapa") || "";
    const dre = searchParams.get("dre") || "";

    const conditions: string[] = [];
    const params: string[] = [];
    let paramIdx = 1;

    if (etapa) {
      conditions.push(`UPPER(TRIM(etapa_ensino)) = $${paramIdx}`);
      params.push(etapa.toUpperCase().trim());
      paramIdx++;
    }

    if (dre) {
      conditions.push(`UPPER(TRIM(dre)) = $${paramIdx}`);
      params.push(dre.toUpperCase().trim());
      paramIdx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
         UPPER(TRIM(dre)) AS dre,
         etapa_ensino,
         desempenho_lingua_portuguesa,
         desempenho_matematica,
         nota_padronizada_media,
         fluxo_tempo_medio,
         ideb,
         ordem
       FROM seduc.seduc_ideb_dre
       ${whereClause}
       ORDER BY ordem ASC NULLS LAST, ideb DESC NULLS LAST`,
      params
    );

    const data = result.rows.map((row) => ({
      ...row,
      ideb:
        row.ideb !== null && row.ideb !== undefined && row.ideb !== ""
          ? Number(row.ideb)
          : null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("IDEB DRE error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados IDEB por DRE" },
      { status: 500 }
    );
  }
}
