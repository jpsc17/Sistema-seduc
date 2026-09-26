export function formatBonus(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

// ─── 14º / 15º / 16º Salário — Regras de Bonificação ──────────────
export const LIMITE_BONUS = 3.5;

/**
 * Normaliza o valor de bônus ao teto legal de 3,5 e retorna o percentual atingido.
 */
export function normalizarBonus(valorBonus: number | null | undefined): {
  valorLimitado: number;
  percentualAtingido: number;
} {
  const num = Number(valorBonus) || 0;
  const valorLimitado = Math.min(num, LIMITE_BONUS);
  const percentualAtingido = Math.round((valorLimitado / LIMITE_BONUS) * 100);
  return { valorLimitado, percentualAtingido };
}

/**
 * Determina quais salários-bônus a escola conquistou.
 * - 14º Salário: META = SIM (atingiu_meta >= 1)
 * - 15º Salário: Atingiu pontuação máxima de 1,0 em crescimento (ponto_crescimento >= 1,0)
 * - 16º Salário: Pontuação acumulada no teto legal de 3,5 (bonus >= 3,5)
 */
export function calcularSalarios(escola: {
  atingiu_meta: number | null;
  ponto_crescimento: number | null;
  bonus_professor: number | null;
}): {
  tem14: boolean;
  tem15: boolean;
  tem16: boolean;
} {
  const tem14 = escola.atingiu_meta !== null && Number(escola.atingiu_meta) >= 1;
  const pontoCrescimento = Number(escola.ponto_crescimento) || 0;
  const tem15 = escola.ponto_crescimento !== null && pontoCrescimento >= 1.0;
  const bonusVal = Number(escola.bonus_professor) || 0;
  const tem16 = bonusVal >= LIMITE_BONUS;
  return { tem14, tem15, tem16 };
}

/**
 * Formata o valor de bônus com o percentual do teto quando aplicável.
 * Ex: "2,1 (60% do teto)" ou "3,5 (100% do teto)"
 */
export function formatBonusComTeto(val: number | null | undefined): string {
  if (val === null || val === undefined) return "—";
  const num = Number(val);
  if (isNaN(num) || num === 0) return "—";
  const { valorLimitado, percentualAtingido } = normalizarBonus(num);
  const formatted = valorLimitado.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
  return `${formatted} (${percentualAtingido}% do teto)`;
}

// ─── Formatação de Etapa com Separação de Alfabetização ────────────
/**
 * Formata a etapa de ensino, distinguindo:
 *  - "EF ALFABETIZAÇÃO (1º e 2º)" para registros de alfabetização
 *  - "EF ANOS INICIAIS (3º ao 5º)" para demais anos iniciais
 *  - Formatações padrão para demais etapas
 */
export function formatEtapaEnsino(raw: string | null | undefined): string {
  if (!raw) return "—";

  const upper = raw.toUpperCase().trim();

  // Detectar alfabetização (1º e 2º ano) — múltiplas variações possíveis nos dados
  if (
    upper.includes("ALFABETIZA") ||
    upper.includes("1 E 2") ||
    upper.includes("1º E 2º") ||
    upper.includes("1° E 2°")
  ) {
    return "EF ALFABETIZAÇÃO (1º e 2º)";
  }

  // Detectar anos iniciais (3º ao 5º) — registros que mencionam explicitamente 3-5
  if (
    upper.includes("3 AO 5") ||
    upper.includes("3º AO 5º") ||
    upper.includes("3° AO 5°")
  ) {
    return "EF ANOS INICIAIS (3º ao 5º)";
  }

  // Detectar "ANOS INICIAIS" genérico — quando não especifica sub-ciclo
  // Neste caso, mantemos como "ANOS INICIAIS" (o banco pode não diferenciar)
  if (upper.includes("ANOS INICIAIS") || upper.includes("INICIAIS")) {
    // Se contém alguma indicação de série, tentar inferir
    if (upper.includes("1") && upper.includes("2") && !upper.includes("3")) {
      return "EF ALFABETIZAÇÃO (1º e 2º)";
    }
    if (upper.includes("3") || upper.includes("4") || upper.includes("5")) {
      return "EF ANOS INICIAIS (3º ao 5º)";
    }
    return "EF ANOS INICIAIS";
  }

  // Formatações padrão para outras etapas
  return upper
    .replace(/^ENSINO\s+/, "")
    .replace(/^FUNDAMENTAL\s+/, "EF ")
    .replace(/MEDIO/i, "MÉDIO");
}
