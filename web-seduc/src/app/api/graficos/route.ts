import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { DashboardGraficosData } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dre = searchParams.get("dre")?.trim() || "";
  const municipio = searchParams.get("municipio")?.trim() || "";
  const ri =
    searchParams.get("regiao_integracao")?.trim() ||
    searchParams.get("regiaoIntegracao")?.trim() ||
    searchParams.get("ri")?.trim() ||
    "";
  const etapa = searchParams.get("etapa")?.trim() || "";

  const client = await pool.connect();
  try {
    // ─── 1. Condições de Filtro Base para Escolas Publicadas ───────────────
    const vwConditions: string[] = ["status_publicacao = 'PUBLICADA'"];
    const vwParams: (string | number)[] = [];
    let vwIdx = 1;

    if (dre) {
      vwConditions.push(`UPPER(TRIM(regional_dre)) = $${vwIdx}`);
      vwParams.push(dre.toUpperCase());
      vwIdx++;
    }

    if (municipio) {
      vwConditions.push(`UPPER(TRIM(municipio)) = $${vwIdx}`);
      vwParams.push(municipio.toUpperCase());
      vwIdx++;
    }

    if (ri) {
      vwConditions.push(`UPPER(TRIM(regiao_integracao)) = $${vwIdx}`);
      vwParams.push(ri.toUpperCase());
      vwIdx++;
    }

    // ─── 2. Condições de Filtro para Tabela EJA & AEE ─────────────────────
    const ejaConditions: string[] = [];
    const ejaParams: (string | number)[] = [];
    let ejaIdx = 1;

    if (dre) {
      ejaConditions.push(`UPPER(TRIM(e.regional)) = $${ejaIdx}`);
      ejaParams.push(dre.toUpperCase());
      ejaIdx++;
    }

    if (municipio) {
      ejaConditions.push(`UPPER(TRIM(e.municipio)) = $${ejaIdx}`);
      ejaParams.push(municipio.toUpperCase());
      ejaIdx++;
    }

    if (ri) {
      ejaConditions.push(`UPPER(TRIM(d.regiao_integracao)) = $${ejaIdx}`);
      ejaParams.push(ri.toUpperCase());
      ejaIdx++;
    }

    const whereEja = ejaConditions.length > 0 ? `WHERE ${ejaConditions.join(" AND ")}` : "";

    // ─── 3. Verificação de Filtros de Etapa ────────────────────────────────
    const etapaUpper = etapa.toUpperCase();
    const isAlfa = Boolean(
      etapa &&
        (etapaUpper.includes("ALFABETIZA") ||
          etapaUpper.includes("1º E 2º") ||
          etapaUpper.includes("1 E 2"))
    );
    const isIniciais = Boolean(
      etapa &&
        (etapaUpper.includes("INICIAIS") ||
          etapaUpper.includes("3º AO 5º") ||
          etapaUpper.includes("3 A 5"))
    );
    const isFinais = Boolean(
      etapa &&
        (etapaUpper.includes("FINAIS") ||
          etapaUpper.includes("6º AO 9º") ||
          etapaUpper.includes("6 A 9"))
    );
    const isMedio = Boolean(
      etapa && (etapaUpper.includes("MEDIO") || etapaUpper.includes("MÉDIO"))
    );

    // ─── 4. Fatia 1: IDEB Regular (Escolas Publicadas) ────────────────────
    // Regra:
    // - Meta: se SIM = +1,0, se NÃO = 0,0
    // - Crescimento: somar valor se > 0
    // - Destaque em RI: se SIM = +1,0, se NÃO = 0,0
    // - Fluxo: somar valor numérico apurado de rendimento/fluxo
    let valIdeb = 0;
    let idebDetalhes = {
      meta: 0,
      crescimento: 0,
      destaque_ri: 0,
      fluxo: 0,
    };

    if (!isAlfa) {
      const idebCond = [...vwConditions, "etapa_ensino NOT ILIKE '%ALFABETIZA%'"];
      const idebParams = [...vwParams];
      let idebIdx = vwIdx;

      if (isIniciais) {
        idebCond.push(`(etapa_ensino ILIKE '%INICIAIS%' OR etapa_ensino ILIKE '%3%5%')`);
      } else if (isFinais) {
        idebCond.push(`(etapa_ensino ILIKE '%FINAIS%' OR etapa_ensino ILIKE '%6%9%')`);
      } else if (isMedio) {
        idebCond.push(`(etapa_ensino ILIKE '%MEDIO%' OR etapa_ensino ILIKE '%MÉDIO%')`);
      } else if (etapa) {
        idebCond.push(`etapa_ensino ILIKE $${idebIdx}`);
        idebParams.push(`%${etapa.trim()}%`);
        idebIdx++;
      }

      const qIdeb = `
        SELECT 
          COALESCE(SUM(CASE WHEN atingiu_meta >= 1 THEN 1.0 ELSE 0.0 END), 0.0)::float AS meta,
          COALESCE(SUM(CASE WHEN ponto_crescimento > 0 THEN ponto_crescimento ELSE 0.0 END), 0.0)::float AS crescimento,
          COALESCE(SUM(CASE WHEN elegivel_16_salario = TRUE THEN 1.0 ELSE 0.0 END), 0.0)::float AS destaque_ri,
          COALESCE(SUM(COALESCE(fluxo, 0.0)), 0.0)::float AS fluxo,
          COALESCE(SUM(
            (CASE WHEN atingiu_meta >= 1 THEN 1.0 ELSE 0.0 END) +
            (CASE WHEN ponto_crescimento > 0 THEN ponto_crescimento ELSE 0.0 END) +
            (CASE WHEN elegivel_16_salario = TRUE THEN 1.0 ELSE 0.0 END) +
            COALESCE(fluxo, 0.0)
          ), 0.0)::float AS total
        FROM seduc.vw_escola_resultado_completo
        WHERE ${idebCond.join(" AND ")};
      `;

      const resIdeb = await client.query(qIdeb, idebParams);
      const rowIdeb = resIdeb.rows[0];
      valIdeb = Number(rowIdeb?.total ?? 0);
      idebDetalhes = {
        meta: Number(rowIdeb?.meta ?? 0),
        crescimento: Number(rowIdeb?.crescimento ?? 0),
        destaque_ri: Number(rowIdeb?.destaque_ri ?? 0),
        fluxo: Number(rowIdeb?.fluxo ?? 0),
      };
    }

    // ─── 5. Fatia 2: Alfabetização (1º e 2º Ano) ──────────────────────────
    // Regra: Somatório dos fatores apurados de alfabetização concedidos às turmas de 1º e 2º ano
    let valAlfa = 0;
    if (!isIniciais && !isFinais && !isMedio) {
      const alfaCond = [
        ...vwConditions,
        "(etapa_ensino ILIKE '%ALFABETIZA%' OR oferta_alfabetizacao = TRUE)",
      ];
      const qAlfa = `
        SELECT COALESCE(SUM(COALESCE(bonus_professor, ponto_alfabetizacao, 0.0)), 0.0)::float AS total
        FROM seduc.vw_escola_resultado_completo
        WHERE ${alfaCond.join(" AND ")};
      `;
      const resAlfa = await client.query(qAlfa, vwParams);
      valAlfa = Number(resAlfa.rows[0]?.total ?? 0);
    }

    // ─── 6. Fatia 3: EJA e Fatia 4: AEE ───────────────────────────────────
    // Regra EJA: Total EJA = ∑ (EJA Iniciais + EJA Finais + EJA Médio)
    // Regra AEE: Somatório integral dos pontos da coluna oficial de AEE
    let valEja = 0;
    let valAee = 0;

    if (!isAlfa) {
      let ejaExpr =
        "COALESCE(SUM(COALESCE(e.eja_fundamental_iniciais, 0.0) + COALESCE(e.eja_fundamental_finais, 0.0) + COALESCE(e.eja_medio, 0.0)), 0.0)::float";
      let aeeExpr =
        "COALESCE(SUM(COALESCE(e.atendimento_especializado_aee, 0.0)), 0.0)::float";

      if (isIniciais) {
        ejaExpr = "COALESCE(SUM(COALESCE(e.eja_fundamental_iniciais, 0.0)), 0.0)::float";
        aeeExpr = "0.0::float";
      } else if (isFinais) {
        ejaExpr = "COALESCE(SUM(COALESCE(e.eja_fundamental_finais, 0.0)), 0.0)::float";
        aeeExpr = "0.0::float";
      } else if (isMedio) {
        ejaExpr = "COALESCE(SUM(COALESCE(e.eja_medio, 0.0)), 0.0)::float";
        aeeExpr = "0.0::float";
      }

      const qEja = `
        SELECT 
          ${ejaExpr} AS total_eja,
          ${aeeExpr} AS total_aee
        FROM seduc.seduc_bonus_eja_aee e
        LEFT JOIN seduc.dim_escolas d ON d.codigo_escola = e.codigo_escola
        ${whereEja};
      `;
      const resEja = await client.query(qEja, ejaParams);
      valEja = Number(resEja.rows[0]?.total_eja ?? 0);
      valAee = Number(resEja.rows[0]?.total_aee ?? 0);
    }

    // ─── 7. Consolidação Final dos Pontos e Percentuais ───────────────────
    const totalPontos = Number((valIdeb + valAlfa + valEja + valAee).toFixed(2));

    const pctIdeb = totalPontos > 0 ? Number(((valIdeb / totalPontos) * 100).toFixed(1)) : 0;
    const pctAlfa = totalPontos > 0 ? Number(((valAlfa / totalPontos) * 100).toFixed(1)) : 0;
    const pctEja = totalPontos > 0 ? Number(((valEja / totalPontos) * 100).toFixed(1)) : 0;
    const pctAee = totalPontos > 0 ? Number(((valAee / totalPontos) * 100).toFixed(1)) : 0;

    const data: DashboardGraficosData = {
      composicao_bonus: [
        {
          name: "IDEB (Regular)",
          value: Number(valIdeb.toFixed(2)),
          percent: pctIdeb,
          color: "#0284c7",
          descricao: "Meta pactuada (14º), Crescimento (15º), Destaque RI (16º) e Fluxo",
        },
        {
          name: "Alfabetização",
          value: Number(valAlfa.toFixed(2)),
          percent: pctAlfa,
          color: "#10b981",
          descricao: "Fatores apurados para turmas de 1º e 2º ano do Ensino Fundamental",
        },
        {
          name: "EJA",
          value: Number(valEja.toFixed(2)),
          percent: pctEja,
          color: "#f59e0b",
          descricao: "Educação de Jovens e Adultos (Iniciais + Finais + Médio)",
        },
        {
          name: "AEE",
          value: Number(valAee.toFixed(2)),
          percent: pctAee,
          color: "#8b5cf6",
          descricao: "Atendimento Educacional Especializado",
        },
      ],
      total_pontos: totalPontos,
      detalhes_ideb: {
        meta: Number(idebDetalhes.meta.toFixed(2)),
        crescimento: Number(idebDetalhes.crescimento.toFixed(2)),
        destaque_ri: Number(idebDetalhes.destaque_ri.toFixed(2)),
        fluxo: Number(idebDetalhes.fluxo.toFixed(2)),
      },
      filtros_aplicados: {
        dre: dre || null,
        municipio: municipio || null,
        regiao_integracao: ri || null,
        etapa: etapa || null,
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro na rota /api/graficos:", error);
    return NextResponse.json(
      { error: "Erro ao gerar indicadores gráficos de bonificação" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
