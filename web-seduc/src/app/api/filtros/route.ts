import { NextResponse } from "next/server";
import pool from "@/lib/db";

/* ─── Mapa de correção para DREs corrompidas por OCR/PDF ─── */
const DRE_CORRECTIONS: Record<string, string> = {
  "AAGRAUGAUIAAIA": "ARAGUAIA",
  "ABRAARGREUIARAIAS": "ARAGUAIA",
  "ARAGUAIIA": "ARAGUAIA",
  "ARAGAUAIA": "ARAGUAIA",
  "AMARIARAJO": "MARAJÓ",
  "AMRIARAJO": "MARAJÓ",
  "AAMARIARAJO": "MARAJÓ",
  "GOUDAIVMELAAS": "GUAMÁ",
  "OG CUAAMPIAM": "RIO CAPIM",
  "OG PUAARJAARA": "GUAJARÁ",
  "PGAURAAMA": "GUAMÁ",
  "TGAUAMA": "GUAMÁ",
  "UTOCANTINS": "TOCANTINS",
};

/**
 * Normaliza o nome de uma DRE ou Município:
 * 1. TRIM + UPPER
 * 2. Filtra nulos, vazios ou traços ('—', '-')
 * 3. Aplica o mapa de correção (comparação sem acentos)
 * 4. Rejeita caracteres inválidos ou sequências ilegíveis
 */
function sanitizeName(raw: string | null | undefined, isDre = false): string | null {
  if (!raw || typeof raw !== "string") return null;
  let name = raw.trim().toUpperCase();

  // Descartar traços, vazios ou tamanho inconsistente
  if (!name || name === "—" || name === "-" || name.length < 2) {
    return null;
  }

  // Chave sem acentos para consulta no dicionário
  const stripped = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/g, "")
    .trim();

  if (isDre && DRE_CORRECTIONS[stripped]) {
    name = DRE_CORRECTIONS[stripped];
  }

  // Rejeita nomes com caracteres ilegíveis/estranhos fora do alfabeto, números, espaços, hífens e acentos
  if (!/^[A-ZÀ-ÖØ-Ý0-9\s\-''.]+$/i.test(name)) return null;

  // Rejeita padrões com letras consecutivas triplas ou mais repetidas (ex: 'aaaiii')
  if (/(.)\1{2,}/.test(name)) return null;

  return name;
}

export async function GET() {
  try {
    const [dres, municipios, redes, localizacoes, dreMunResult, regioesResult] = await Promise.all([
      pool.query(
        `SELECT DISTINCT UPPER(TRIM(dre)) AS regional_dre
         FROM seduc.seduc_ideb_dre
         WHERE dre IS NOT NULL 
           AND TRIM(dre) != '' 
           AND dre NOT ILIKE '%ORDEM%'
         UNION
         SELECT DISTINCT UPPER(TRIM(regional_dre)) AS regional_dre
         FROM seduc.vw_escola_resultado_completo
         WHERE regional_dre IN ('SECTET', 'TECNOLOGICAS')
         ORDER BY regional_dre ASC`
      ),
      pool.query(
        `SELECT DISTINCT UPPER(TRIM(municipio)) AS municipio
         FROM seduc.vw_escola_resultado_completo
         WHERE municipio IS NOT NULL 
           AND TRIM(municipio) != ''
           AND TRIM(municipio) != '—'
           AND TRIM(municipio) != '-'
         ORDER BY municipio ASC`
      ),
      pool.query(
        `SELECT DISTINCT rede FROM seduc.vw_escola_resultado_completo
         WHERE rede IS NOT NULL AND TRIM(rede) != ''
         ORDER BY rede ASC`
      ),
      pool.query(
        `SELECT DISTINCT localizacao FROM seduc.vw_escola_resultado_completo
         WHERE localizacao IS NOT NULL AND TRIM(localizacao) != ''
         ORDER BY localizacao ASC`
      ),
      pool.query(
        `SELECT DISTINCT UPPER(TRIM(regional_dre)) AS dre, UPPER(TRIM(municipio)) AS municipio
         FROM seduc.vw_escola_resultado_completo
         WHERE regional_dre IS NOT NULL AND municipio IS NOT NULL
           AND TRIM(regional_dre) != '' AND TRIM(municipio) != ''`
      ),
      pool.query(
        `SELECT DISTINCT UPPER(TRIM(regiao_integracao)) AS regiao_integracao
         FROM seduc.vw_escola_resultado_completo
         WHERE regiao_integracao IS NOT NULL
           AND TRIM(regiao_integracao) != ''
         ORDER BY regiao_integracao ASC`
      ),
    ]);

    // Sanitiza e deduplica DREs
    const dreSet = new Set<string>();
    for (const r of dres.rows) {
      const cleaned = sanitizeName(r.regional_dre, true);
      if (cleaned) dreSet.add(cleaned);
    }
    const dresSorted = [...dreSet].sort((a, b) => a.localeCompare(b, "pt-BR"));

    // Sanitiza e deduplica Municípios
    const munSet = new Set<string>();
    for (const r of municipios.rows) {
      const cleaned = sanitizeName(r.municipio, false);
      if (cleaned) munSet.add(cleaned);
    }
    const munSorted = [...munSet].sort((a, b) => a.localeCompare(b, "pt-BR"));

    // Mapeamento DRE -> Municípios
    const dreMunicipios: Record<string, string[]> = {};
    for (const r of dreMunResult.rows) {
      const d = sanitizeName(r.dre, true);
      const m = sanitizeName(r.municipio, false);
      if (d && m) {
        if (!dreMunicipios[d]) dreMunicipios[d] = [];
        if (!dreMunicipios[d].includes(m)) dreMunicipios[d].push(m);
      }
    }
    for (const d of Object.keys(dreMunicipios)) {
      dreMunicipios[d].sort((a, b) => a.localeCompare(b, "pt-BR"));
    }

    return NextResponse.json({
      dres: dresSorted,
      municipios: munSorted,
      redes: redes.rows.map((r) => r.rede).filter(Boolean),
      localizacoes: localizacoes.rows.map((r) => r.localizacao).filter(Boolean),
      dreMunicipios,
      regioes_integracao: regioesResult.rows
        .map((r) => r.regiao_integracao)
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b, "pt-BR")),
    });
  } catch (error) {
    console.error("Filtros error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar filtros" },
      { status: 500 }
    );
  }
}
