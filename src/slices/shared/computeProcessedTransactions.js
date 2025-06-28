export function computeNetProcessedAmountsPerMonth(transactions) {
  const monthlyTotals = new Map();

  transactions.forEach(({ month, amount }) => {
    if (!month || typeof amount !== 'number') return;

    const existing = monthlyTotals.get(month) || 0;
    monthlyTotals.set(month, existing + amount);
  });

  return Array.from(monthlyTotals.entries()).map(([month, netAmount]) => ({
    month,
    netAmount
  }));
}
