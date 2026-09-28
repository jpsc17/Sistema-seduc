import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          (SELECT COUNT(DISTINCT codigo_escola) FROM seduc.dim_escolas) AS total_escolas,
          COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' THEN codigo_escola END) AS escolas_publicadas,
          ((SELECT COUNT(DISTINCT codigo_escola) FROM seduc.dim_escolas) - COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' THEN codigo_escola END)) AS escolas_nao_publicadas,
          (SELECT COUNT(*) FROM seduc.seduc_bonus_eja_aee) AS escolas_eja_aee
        FROM seduc.vw_escola_resultado_completo
      `);
      return NextResponse.json(result.rows[0]);
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
