export function formatBonus(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}
