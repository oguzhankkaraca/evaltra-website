// Small, browser-local illustrations for the marketing site, not the Evaltra engine.
export const salesRecords = [
  ['North', 'Platform', 12400], ['South', 'Platform', 8600],
  ['East', 'Services', 5400], ['West', 'Platform', 18200],
  ['North', 'Services', 6700], ['South', 'Services', 4200],
  ['East', 'Platform', 11300], ['West', 'Services', 7800],
  ['North', 'Platform', 9100], ['South', 'Platform', 6500],
  ['East', 'Services', 3900], ['West', 'Platform', 14700]
];
export const formulaPresets = {
  '=SUM(A1:C1)': ({a, b, c}) => a + b + c,
  '=IF(A1>B1,"Above target","Below target")': ({a, b}) => a > b ? 'Above target' : 'Below target',
  '=ROUND(A1/B1,2)': ({a, b}) => b === 0 ? '#DIV/0!' : Math.sign(a / b) * Math.round(Math.abs(a / b) * 100) / 100,
  '=MAX(A1:C1)-MIN(A1:C1)': ({a, b, c}) => Math.max(a, b, c) - Math.min(a, b, c)
};
function number(input, key, min, max) {
  const value = input[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error('Check the sample inputs and try again.');
  return value;
}
export function calculateDemo(kind, input) {
  if (kind === 'revenue') {
    let customers = number(input, 'customers', 1, 1000000);
    const price = number(input, 'price', 0, 100000);
    const growth = number(input, 'growth', 0, 100) / 100;
    const costs = number(input, 'costs', 0, 100000000);
    const rows = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
      if (index) customers = Math.round(customers * (1 + growth));
      return {month, customers, revenue: customers * price, profit: customers * price - costs};
    });
    return {input, rows, revenue: rows.reduce((sum, row) => sum + row.revenue, 0), profit: rows.reduce((sum, row) => sum + row.profit, 0)};
  }
  if (kind === 'sales') {
    const regions = ['North', 'South', 'East', 'West'];
    if (!regions.includes(input.region)) throw new Error('Choose a sample sales region.');
    const minimum = number(input, 'minimum', 0, 100000);
    const rows = salesRecords.filter(([region, , amount]) => region === input.region && amount >= minimum);
    return {input, rows, total: rows.reduce((sum, row) => sum + row[2], 0), regions, totals: regions.map(region => salesRecords.filter(row => row[0] === region).reduce((sum, row) => sum + row[2], 0))};
  }
  if (kind === 'formula') {
    for (const key of ['a', 'b', 'c']) number(input, key, -1e9, 1e9);
    if (!Object.hasOwn(formulaPresets, input.formula)) throw new Error('This preview supports the four example formulas below.');
    const value = formulaPresets[input.formula](input);
    return {input, value, type: value === '#DIV/0!' ? 'error' : typeof value === 'number' ? 'number' : 'text'};
  }
  throw new Error('Unknown example.');
}
