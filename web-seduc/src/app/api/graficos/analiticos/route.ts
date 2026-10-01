import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type {
  DashboardAnaliticoData,
  IndicadorRedeItem,
  DistribuicaoPontosItem,
  QuadranteTrajetoria,
  DreComparativoItem,
  GranularidadeAnalitica,
} from "@/lib/types";

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
  const granularidadeParam = searchParams.get("granularidade")?.trim().toLowerCase() || "";
  const granularidade: GranularidadeAnalitica =
    granularidadeParam === "escola" ? "escola" : "etapa";

  const client = await pool.connect();
  try {
    // ─── 1. Condições de Filtro Base para Escolas Publicadas ───────────────
    const conditions: string[] = ["status_publicacao = 'PUBLICADA'"];
    const params: (string | number)[] = [];
    let idx = 1;

    if (dre) {
      conditions.push(`UPPER(TRIM(regional_dre)) = $${idx}`);
      params.push(dre.toUpperCase().trim());
      idx++;
    }

    if (municipio) {
      conditions.push(`UPPER(TRIM(municipio)) = $${idx}`);
      params.push(municipio.toUpperCase().trim());
      idx++;
    }

    if (ri) {
      conditions.push(`UPPER(TRIM(regiao_integracao)) = $${idx}`);
      params.push(ri.toUpperCase().trim());
      idx++;
    }

    if (etapa) {
      const etapaUpper = etapa.toUpperCase();
      if (
        etapaUpper.includes("ALFABETIZA") ||
        etapaUpper.includes("1º E 2º") ||
        etapaUpper.includes("1 E 2")
      ) {
        conditions.push(
          `(etapa_ensino ILIKE '%ALFABETIZA%' OR etapa_ensino ILIKE '%1%2%' OR oferta_alfabetizacao = TRUE)`
        );
      } else if (
        etapaUpper.includes("INICIAIS") ||
        etapaUpper.includes("3º AO 5º") ||
        etapaUpper.includes("3 A 5")
      ) {
        conditions.push(
          `((etapa_ensino ILIKE '%INICIAIS%' OR etapa_ensino ILIKE '%3%5%') AND etapa_ensino NOT ILIKE '%ALFABETIZA%' AND etapa_ensino NOT ILIKE '%1%2%')`
        );
      } else if (
        etapaUpper.includes("FINAIS") ||
        etapaUpper.includes("6º AO 9º") ||
        etapaUpper.includes("6 A 9")
      ) {
        conditions.push(
          `(etapa_ensino ILIKE '%FINAIS%' OR etapa_ensino ILIKE '%6%9%')`
        );
      } else if (
        etapaUpper.includes("MEDIO") ||
        etapaUpper.includes("MÉDIO")
      ) {
        conditions.push(
          `(etapa_ensino ILIKE '%MEDIO%' OR etapa_ensino ILIKE '%MÉDIO%')`
        );
      } else {
        conditions.push(`etapa_ensino ILIKE $${idx}`);
        params.push(`%${etapa.trim()}%`);
        idx++;
      }
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // ─── 2. Query Geral Conforme a Granularidade ──────────────────────────
    // Se 'escola' (895 escolas): Agrupa previamente por codigo_escola com MAX()
    // Se 'etapa' (1.197 avaliações): Avalia cada linha publicada diretamente
    let qGeral = "";
    let qDre = "";

    if (granularidade === "escola") {
      qGeral = `
        WITH escola_filtrada AS (
          SELECT 
            codigo_escola,
            regional_dre,
            municipio,
            regiao_integracao,
            atingiu_meta,
            ponto_crescimento,
            fluxo,
            elegivel_16_salario,
            ponto_regiao_integracao
          FROM seduc.vw_escola_resultado_completo
          ${whereClause}
        ),
        escola_agg AS (
          SELECT 
            codigo_escola,
            MAX(regional_dre) AS regional_dre,
            MAX(municipio) AS municipio,
            MAX(regiao_integracao) AS regiao_integracao,
            MAX(CASE WHEN atingiu_meta >= 1 THEN 1 ELSE 0 END) AS is_meta,
            MAX(CASE WHEN ponto_crescimento > 0 THEN 1 ELSE 0 END) AS is_crescimento,
            MAX(CASE WHEN fluxo > 0 THEN 1 ELSE 0 END) AS is_fluxo,
            MAX(CASE WHEN elegivel_16_salario = TRUE OR ponto_regiao_integracao = 1.0 THEN 1 ELSE 0 END) AS is_destaque_ri
          FROM escola_filtrada
          GROUP BY codigo_escola
        ),
        com_pontos AS (
          SELECT 
            *,
            (is_meta + is_crescimento + is_fluxo + is_destaque_ri) AS pontos
          FROM escola_agg
        )
        SELECT 
          COUNT(*)::int AS total_escolas,
          COALESCE(SUM(is_meta), 0)::int AS meta_count,
          COALESCE(SUM(is_crescimento), 0)::int AS crescimento_count,
          COALESCE(SUM(is_fluxo), 0)::int AS fluxo_count,
          COALESCE(SUM(is_destaque_ri), 0)::int AS destaque_ri_count,
          COALESCE(SUM(CASE WHEN pontos = 0 THEN 1 ELSE 0 END), 0)::int AS p0,
          COALESCE(SUM(CASE WHEN pontos = 1 THEN 1 ELSE 0 END), 0)::int AS p1,
          COALESCE(SUM(CASE WHEN pontos = 2 THEN 1 ELSE 0 END), 0)::int AS p2,
          COALESCE(SUM(CASE WHEN pontos = 3 THEN 1 ELSE 0 END), 0)::int AS p3,
          COALESCE(SUM(CASE WHEN pontos = 4 THEN 1 ELSE 0 END), 0)::int AS p4,
          COALESCE(SUM(CASE WHEN is_crescimento = 1 AND is_fluxo = 1 THEN 1 ELSE 0 END), 0)::int AS quad_a,
          COALESCE(SUM(CASE WHEN is_crescimento = 1 AND is_fluxo = 0 THEN 1 ELSE 0 END), 0)::int AS quad_b,
          COALESCE(SUM(CASE WHEN is_crescimento = 0 AND is_fluxo = 1 THEN 1 ELSE 0 END), 0)::int AS quad_c,
          COALESCE(SUM(CASE WHEN is_crescimento = 0 AND is_fluxo = 0 THEN 1 ELSE 0 END), 0)::int AS quad_d
        FROM com_pontos;
      `;

      qDre = `
        WITH escola_filtrada AS (
          SELECT 
            codigo_escola,
            regional_dre,
            municipio,
            regiao_integracao,
            atingiu_meta,
            ponto_crescimento,
            fluxo,
            elegivel_16_salario,
            ponto_regiao_integracao
          FROM seduc.vw_escola_resultado_completo
          ${whereClause}
        ),
        escola_agg AS (
          SELECT 
            codigo_escola,
            MAX(regional_dre) AS regional_dre,
            MAX(CASE WHEN atingiu_meta >= 1 THEN 1 ELSE 0 END) AS is_meta,
            MAX(CASE WHEN ponto_crescimento > 0 THEN 1 ELSE 0 END) AS is_crescimento,
            MAX(CASE WHEN fluxo > 0 THEN 1 ELSE 0 END) AS is_fluxo
          FROM escola_filtrada
          GROUP BY codigo_escola
        )
        SELECT 
          COALESCE(regional_dre, 'NÃO INFORMADA') AS dre,
          COUNT(*)::int AS total,
          COALESCE(SUM(is_meta), 0)::int AS meta_count,
          COALESCE(SUM(is_crescimento), 0)::int AS crescimento_count,
          COALESCE(SUM(is_fluxo), 0)::int AS fluxo_count
        FROM escola_agg
        GROUP BY regional_dre
        ORDER BY regional_dre ASC;
      `;
    } else {
      // Visão por Etapa Avaliada (1.197 etapas avaliadas publicadas)
      qGeral = `
        WITH base AS (
          SELECT 
            codigo_escola,
            regional_dre,
            (CASE WHEN atingiu_meta >= 1 THEN 1 ELSE 0 END) AS is_meta,
            (CASE WHEN ponto_crescimento > 0 THEN 1 ELSE 0 END) AS is_crescimento,
            (CASE WHEN fluxo > 0 THEN 1 ELSE 0 END) AS is_fluxo,
            (CASE WHEN elegivel_16_salario = TRUE OR ponto_regiao_integracao = 1.0 THEN 1 ELSE 0 END) AS is_destaque_ri,
            (
              (CASE WHEN atingiu_meta >= 1 THEN 1 ELSE 0 END) +
              (CASE WHEN ponto_crescimento > 0 THEN 1 ELSE 0 END) +
              (CASE WHEN fluxo > 0 THEN 1 ELSE 0 END) +
              (CASE WHEN elegivel_16_salario = TRUE OR ponto_regiao_integracao = 1.0 THEN 1 ELSE 0 END)
            ) AS pontos
          FROM seduc.vw_escola_resultado_completo
          ${whereClause}
        )
        SELECT 
          COUNT(*)::int AS total_escolas,
          COALESCE(SUM(is_meta), 0)::int AS meta_count,
          COALESCE(SUM(is_crescimento), 0)::int AS crescimento_count,
          COALESCE(SUM(is_fluxo), 0)::int AS fluxo_count,
          COALESCE(SUM(is_destaque_ri), 0)::int AS destaque_ri_count,
          COALESCE(SUM(CASE WHEN pontos = 0 THEN 1 ELSE 0 END), 0)::int AS p0,
          COALESCE(SUM(CASE WHEN pontos = 1 THEN 1 ELSE 0 END), 0)::int AS p1,
          COALESCE(SUM(CASE WHEN pontos = 2 THEN 1 ELSE 0 END), 0)::int AS p2,
          COALESCE(SUM(CASE WHEN pontos = 3 THEN 1 ELSE 0 END), 0)::int AS p3,
          COALESCE(SUM(CASE WHEN pontos = 4 THEN 1 ELSE 0 END), 0)::int AS p4,
          COALESCE(SUM(CASE WHEN is_crescimento = 1 AND is_fluxo = 1 THEN 1 ELSE 0 END), 0)::int AS quad_a,
          COALESCE(SUM(CASE WHEN is_crescimento = 1 AND is_fluxo = 0 THEN 1 ELSE 0 END), 0)::int AS quad_b,
          COALESCE(SUM(CASE WHEN is_crescimento = 0 AND is_fluxo = 1 THEN 1 ELSE 0 END), 0)::int AS quad_c,
          COALESCE(SUM(CASE WHEN is_crescimento = 0 AND is_fluxo = 0 THEN 1 ELSE 0 END), 0)::int AS quad_d
        FROM base;
      `;

      qDre = `
        SELECT 
          COALESCE(regional_dre, 'NÃO INFORMADA') AS dre,
          COUNT(*)::int AS total,
          COALESCE(SUM(CASE WHEN atingiu_meta >= 1 THEN 1 ELSE 0 END), 0)::int AS meta_count,
          COALESCE(SUM(CASE WHEN ponto_crescimento > 0 THEN 1 ELSE 0 END), 0)::int AS crescimento_count,
          COALESCE(SUM(CASE WHEN fluxo > 0 THEN 1 ELSE 0 END), 0)::int AS fluxo_count
        FROM seduc.vw_escola_resultado_completo
        ${whereClause}
        GROUP BY regional_dre
        ORDER BY regional_dre ASC;
      `;
    }

    const resGeral = await client.query(qGeral, params);
    const rowG = resGeral.rows[0] || {};
    const totalCount = Number(rowG.total_escolas ?? 0);

    const calcPct = (val: number) =>
      totalCount > 0 ? Number(((val / totalCount) * 100).toFixed(1)) : 0;

    const rotuloUnidade = granularidade === "escola" ? "escolas" : "etapas avaliadas";

    // ─── 3. Gráfico 1: Indicadores da Rede ────────────────────────────────
    const indicadores: IndicadorRedeItem[] = [
      {
        id: "meta",
        nome: "META",
        descricao:
          granularidade === "escola"
            ? "Meta pactuada alcançada em ao menos uma etapa da escola"
            : "Meta pactuada alcançada na respectiva etapa avaliada",
        total: totalCount,
        count: Number(rowG.meta_count ?? 0),
        percent: calcPct(Number(rowG.meta_count ?? 0)),
        color: "#0284c7", // Sky/Blue
      },
      {
        id: "crescimento",
        nome: "CRESCIMENTO",
        descricao:
          granularidade === "escola"
            ? "Avanço pedagógico positivo (> 0) em ao menos uma etapa da escola"
            : "Avanço pedagógico positivo apurado (> 0) na etapa",
        total: totalCount,
        count: Number(rowG.crescimento_count ?? 0),
        percent: calcPct(Number(rowG.crescimento_count ?? 0)),
        color: "#059669", // Emerald
      },
      {
        id: "fluxo",
        nome: "FLUXO",
        descricao:
          granularidade === "escola"
            ? "Rendimento escolar e taxa de aprovação positivos em ao menos uma etapa"
            : "Rendimento escolar e taxa de aprovação apurados na etapa",
        total: totalCount,
        count: Number(rowG.fluxo_count ?? 0),
        percent: calcPct(Number(rowG.fluxo_count ?? 0)),
        color: "#d97706", // Amber
      },
      {
        id: "destaque_ri",
        nome: "DESTAQUE EM RI",
        descricao: "Destaque regional conquistado na respectiva Região de Integração",
        total: totalCount,
        count: Number(rowG.destaque_ri_count ?? 0),
        percent: calcPct(Number(rowG.destaque_ri_count ?? 0)),
        color: "#7c3aed", // Violet
      },
    ];

    // ─── 4. Gráfico 2: Distribuição da Pontuação (0 a 4 Pontos) ───────────
    const distribuicao_pontos: DistribuicaoPontosItem[] = [
      {
        pontos: 0,
        escolas: Number(rowG.p0 ?? 0),
        percent: calcPct(Number(rowG.p0 ?? 0)),
      },
      {
        pontos: 1,
        escolas: Number(rowG.p1 ?? 0),
        percent: calcPct(Number(rowG.p1 ?? 0)),
      },
      {
        pontos: 2,
        escolas: Number(rowG.p2 ?? 0),
        percent: calcPct(Number(rowG.p2 ?? 0)),
      },
      {
        pontos: 3,
        escolas: Number(rowG.p3 ?? 0),
        percent: calcPct(Number(rowG.p3 ?? 0)),
      },
      {
        pontos: 4,
        escolas: Number(rowG.p4 ?? 0),
        percent: calcPct(Number(rowG.p4 ?? 0)),
      },
    ];

    // ─── 5. Gráfico 3: Matriz 2x2 de Trajetória Escolar (Fluxo x Crescimento)
    const countA = Number(rowG.quad_a ?? 0);
    const countB = Number(rowG.quad_b ?? 0);
    const countC = Number(rowG.quad_c ?? 0);
    const countD = Number(rowG.quad_d ?? 0);

    const matriz_trajetoria = {
      quadranteA: {
        id: "A" as const,
        titulo: "Quadrante A",
        subtitulo: "Alto Desempenho",
        descricao:
          granularidade === "escola"
            ? "Escolas com salto pedagógico efetivo aliado à retenção e fluxo regular positivo."
            : "Etapas avaliadas com salto pedagógico concomitante à retenção e aprovação regular.",
        count: countA,
        percent: calcPct(countA),
        crescimento: "Crescimento > 0",
        fluxo: "Fluxo Positivo",
        badge: "Alto Desempenho",
        corTexto: "text-emerald-800",
        corBg: "bg-emerald-50/70",
        corBorda: "border-emerald-200",
        corBarra: "bg-emerald-500",
      },
      quadranteB: {
        id: "B" as const,
        titulo: "Quadrante B",
        subtitulo: "Alerta de Fluxo / Evasão",
        descricao:
          granularidade === "escola"
            ? "Apresentou ganho de aprendizagem, porém com pendência ou perda no rendimento escolar."
            : "Etapas com avanço pedagógico, contudo com fluxo escolar não alcançado ou perda de rendimento.",
        count: countB,
        percent: calcPct(countB),
        crescimento: "Crescimento > 0",
        fluxo: "Fluxo Não Alcançado",
        badge: "Alerta de Fluxo / Evasão",
        corTexto: "text-amber-800",
        corBg: "bg-amber-50/70",
        corBorda: "border-amber-200",
        corBarra: "bg-amber-500",
      },
      quadranteC: {
        id: "C" as const,
        titulo: "Quadrante C",
        subtitulo: "Regularidade sem Avanço",
        descricao:
          granularidade === "escola"
            ? "Alunos progridem com fluxo regular, contudo sem incremento na proficiência pedagógica."
            : "Etapas com progressão regular de alunos, porém sem incremento pedagógico em relação à meta.",
        count: countC,
        percent: calcPct(countC),
        crescimento: "Crescimento ≤ 0",
        fluxo: "Fluxo Positivo",
        badge: "Regularidade sem Avanço",
        corTexto: "text-sky-800",
        corBg: "bg-sky-50/70",
        corBorda: "border-sky-200",
        corBarra: "bg-sky-500",
      },
      quadranteD: {
        id: "D" as const,
        titulo: "Quadrante D",
        subtitulo: "Intervenção Prioritária",
        descricao:
          granularidade === "escola"
            ? "Déficit duplo em aprendizagem e fluxo escolar, exigindo plano pedagógico focal e tutoria."
            : "Etapas em situação crítica com déficit duplo em proficiência e rendimento escolar.",
        count: countD,
        percent: calcPct(countD),
        crescimento: "Crescimento ≤ 0",
        fluxo: "Fluxo Não Alcançado",
        badge: "Intervenção Prioritária",
        corTexto: "text-rose-800",
        corBg: "bg-rose-50/70",
        corBorda: "border-rose-200",
        corBarra: "bg-rose-500",
      },
    };

    // ─── 6. Gráfico 4: Resultado Comparativo por DRE ─────────────────────
    const resDre = await client.query(qDre, params);
    const comparativo_dre: DreComparativoItem[] = resDre.rows.map((r: any) => {
      const tot = Number(r.total ?? 0);
      const mCount = Number(r.meta_count ?? 0);
      const cCount = Number(r.crescimento_count ?? 0);
      const fCount = Number(r.fluxo_count ?? 0);
      return {
        dre: r.dre,
        total: tot,
        metaCount: mCount,
        metaPct: tot > 0 ? Number(((mCount / tot) * 100).toFixed(1)) : 0,
        crescimentoCount: cCount,
        crescimentoPct: tot > 0 ? Number(((cCount / tot) * 100).toFixed(1)) : 0,
        fluxoCount: fCount,
        fluxoPct: tot > 0 ? Number(((fCount / tot) * 100).toFixed(1)) : 0,
      };
    });

    const metaGlobal = Number(rowG.meta_count ?? 0);
    const crescGlobal = Number(rowG.crescimento_count ?? 0);
    const fluxoGlobal = Number(rowG.fluxo_count ?? 0);

    const media_rede = {
      metaPct: calcPct(metaGlobal),
      crescimentoPct: calcPct(crescGlobal),
      fluxoPct: calcPct(fluxoGlobal),
    };

    const data: DashboardAnaliticoData = {
      total_escolas: totalCount,
      exercicio: "2024 / 2025",
      granularidade,
      rotulo_unidade: rotuloUnidade,
      filtros_aplicados: {
        dre: dre || null,
        municipio: municipio || null,
        regiao_integracao: ri || null,
        etapa: etapa || null,
      },
      indicadores,
      distribuicao_pontos,
      matriz_trajetoria,
      comparativo_dre,
      media_rede,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro na rota /api/graficos/analiticos:", error);
    return NextResponse.json(
      { error: "Erro ao gerar diagnóstico pedagógico analítico da rede" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
