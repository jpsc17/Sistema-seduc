import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
          codigo_escola,
          nome_escola,
          municipio,
          COALESCE(regional_dre, '—') AS regional_dre,
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
          etapa_ensino AS etapa
         FROM seduc.vw_escola_resultado_completo 
         WHERE codigo_escola = $1`,
        [codigo]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Escola não encontrada" },
          { status: 404 }
        );
      }

      return NextResponse.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Escola detail error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar escola" },
      { status: 500 }
    );
  }
}
