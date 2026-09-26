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

/** As 12 Regiões de Integração oficiais do Estado do Pará */
export const CANONICAL_RIS = [
  "ARAGUAIA",
  "BAIXO AMAZONAS",
  "CARAJÁS",
  "GUAJARÁ",
  "GUAMÁ",
  "LAGO DE TUCURUÍ",
  "MARAJÓ",
  "RIO CAETÉ",
  "RIO CAPIM",
  "TAPAJÓS",
  "TOCANTINS",
  "XINGU",
];

const CANONICAL_RIS_SET = new Set(CANONICAL_RIS);

/** Mapa de correção canônica das 12 Regiões de Integração do Pará (inclui ruídos de OCR e variantes sem acento) */
const RI_CANONICAL_MAP: Record<string, string> = {
  // GUAJARÁ
  "GUAJARA": "GUAJARÁ",
  "GUAJARÁ": "GUAJARÁ",
  "OG PUAARJAARA": "GUAJARÁ",
  "OG PUAARJARÁ": "GUAJARÁ",
  "OG PUAARJARA": "GUAJARÁ",
  "OG PUAARJA": "GUAJARÁ",
  "METROPOLITANA": "GUAJARÁ",

  // RIO CAPIM
  "RIO CAPIM": "RIO CAPIM",
  "OG CUAAMPIAM": "RIO CAPIM",
  "OG CUAAMPIAN": "RIO CAPIM",
  "OG CUAAMPIAO": "RIO CAPIM",

  // GUAMÁ
  "GUAMA": "GUAMÁ",
  "GUAMÁ": "GUAMÁ",
  "GOUDAIVMELAAS": "GUAMÁ",
  "GOUDAIVMELAS": "GUAMÁ",
  "PGAURAMA": "GUAMÁ",
  "PGAURAAMA": "GUAMÁ",
  "TGAUAMA": "GUAMÁ",

  // ARAGUAIA
  "ARAGUAIA": "ARAGUAIA",
  "AAGRAUGAUIAAIA": "ARAGUAIA",
  "ABRAARGREUIARAIAS": "ARAGUAIA",
  "ARAGUAIIA": "ARAGUAIA",
  "ARAGAUAIA": "ARAGUAIA",

  // MARAJÓ
  "MARAJO": "MARAJÓ",
  "MARAJÓ": "MARAJÓ",
  "AMRIARAJO": "MARAJÓ",
  "AMRIARAJÓ": "MARAJÓ",
  "RMARAIRAJO": "MARAJÓ",

  // CARAJÁS
  "CARAJAS": "CARAJÁS",
  "CARAJÁS": "CARAJÁS",

  // BAIXO AMAZONAS
  "BAIXO AMAZONAS": "BAIXO AMAZONAS",

  // TAPAJÓS
  "TAPAJOS": "TAPAJÓS",
  "TAPAJÓS": "TAPAJÓS",

  // TOCANTINS
  "TOCANTINS": "TOCANTINS",
  "UTOCANTINS": "TOCANTINS",

  // LAGO DE TUCURUÍ
  "LAGO TUCURUI": "LAGO DE TUCURUÍ",
  "LAGO DE TUCURUI": "LAGO DE TUCURUÍ",
  "LAGO DE TUCURUÍ": "LAGO DE TUCURUÍ",

  // RIO CAETÉ
  "RIO CAETE": "RIO CAETÉ",
  "RIO CAETÉ": "RIO CAETÉ",

  // XINGU
  "XINGU": "XINGU",
};

/** Normaliza RI: valida estritamente contra as 12 Regiões Oficiais do Pará */
function sanitizeRI(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const name = raw.trim().toUpperCase();
  if (!name || name === "—" || name === "-" || name.length < 3) return null;

  if (CANONICAL_RIS_SET.has(name)) return name;

  const stripped = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9 ]/g, "")
    .trim();

  if (RI_CANONICAL_MAP[stripped]) {
    return RI_CANONICAL_MAP[stripped];
  }

  return null;
}

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

    // Sanitiza e deduplica Regiões de Integração — aplica correções canônicas no nível da API
    const riSet = new Set<string>();
    for (const r of regioesResult.rows) {
      const cleaned = sanitizeRI(r.regiao_integracao);
      if (cleaned) riSet.add(cleaned);
    }
    const riSorted = [...riSet].sort((a, b) => a.localeCompare(b, "pt-BR"));

    return NextResponse.json({
      dres: dresSorted,
      municipios: munSorted,
      redes: redes.rows.map((r) => r.rede).filter(Boolean),
      localizacoes: localizacoes.rows.map((r) => r.localizacao).filter(Boolean),
      dreMunicipios,
      regioes_integracao: riSorted,
    });
  } catch (error) {
    console.error("Filtros error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar filtros" },
      { status: 500 }
    );
  }
}
