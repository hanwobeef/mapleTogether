export function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

export function formatCombatPower(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return "0";

  const sign = numericValue < 0 ? "-" : "";
  const absoluteValue = Math.floor(Math.abs(numericValue));
  const eok = Math.floor(absoluteValue / 100000000);
  const man = Math.floor((absoluteValue % 100000000) / 10000);
  const rest = absoluteValue % 10000;

  if (eok > 0) {
    return `${sign}${eok}억 ${String(man).padStart(4, "0")}만 ${String(rest).padStart(4, "0")}`;
  }

  if (man > 0) {
    return `${sign}${man}만 ${String(rest).padStart(4, "0")}`;
  }

  return `${sign}${formatNumber(rest)}`;
}
