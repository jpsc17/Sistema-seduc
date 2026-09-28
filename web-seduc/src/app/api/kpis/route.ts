import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT
          (SELECT COUNT(DISTINCT codigo_escola) FROM seduc.dim_escolas)::int AS total_escolas,
          COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' THEN codigo_escola END)::int AS escolas_publicadas,
          ((SELECT COUNT(DISTINCT codigo_escola) FROM seduc.dim_escolas) - COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' THEN codigo_escola END))::int AS escolas_nao_publicadas,
          (SELECT COUNT(*) FROM seduc.seduc_bonus_eja_aee)::int AS escolas_eja_aee,
          -- Segunda fileira de KPIs analíticos
          COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' AND atingiu_meta >= 1 THEN codigo_escola END)::int AS total_meta_sim,
          COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' AND ponto_crescimento > 0 THEN codigo_escola END)::int AS total_crescimento_positivo,
          COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' AND (atingiu_meta IS NULL OR atingiu_meta < 1) AND (ponto_crescimento IS NULL OR ponto_crescimento <= 0) AND fluxo > 0 THEN codigo_escola END)::int AS total_somente_fluxo,
          COUNT(DISTINCT CASE WHEN status_publicacao = 'PUBLICADA' AND bonus_professor = 0.0 THEN codigo_escola END)::int AS total_fator_zero
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
