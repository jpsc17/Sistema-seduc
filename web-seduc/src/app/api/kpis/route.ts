import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          COUNT(DISTINCT codigo_escola) AS total_escolas,
          COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' THEN codigo_escola END) AS escolas_publicadas,
          COUNT(DISTINCT CASE WHEN status_publicacao = 'NAO_PUBLICADA' THEN codigo_escola END) AS escolas_nao_publicadas,
          COUNT(DISTINCT CASE WHEN bonus_eja_iniciais IS NOT NULL
                               OR bonus_eja_finais IS NOT NULL
                               OR bonus_eja_medio IS NOT NULL
                               OR bonus_aee IS NOT NULL THEN codigo_escola END) AS escolas_eja_aee
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
