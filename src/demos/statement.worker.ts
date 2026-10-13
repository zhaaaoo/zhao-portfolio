// Parses the demo statement off the main thread, reporting each stage as it goes.
const rules: [RegExp, string][] = [
  [/GRAB\*RIDE|GOJEK|SMRT|BUS\/MRT/, 'Transport'],
  [/GRAB\*FOOD|FOODPANDA|KOPITIAM|TOAST BOX|MCDONALD/, 'Food'],
  [/FAIRPRICE|SHENG SIONG|COLD STORAGE/, 'Groceries'],
  [/NETFLIX|SPOTIFY|ICLOUD/, 'Subscriptions'],
  [/UNIQLO|SHOPEE|LAZADA/, 'Shopping'],
  [/BOULDER|CLIMB/, 'Bouldering'],
];

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

self.onmessage = async (e: MessageEvent<{ text: string; delay: number }>) => {
  const { text, delay } = e.data;
  const rows = text
    .split('\n')
    .map((line) => line.match(/^(\d{2} \w{3})\s+(.+?)\s+(-?\d+\.\d{2})$/))
    .filter((m) => m !== null)
    .map(([, date, shop, amount]) => ({ date, shop, amount: Number(amount), category: '' }));
  postMessage({ stage: 'parsed', rows });
  await pause(delay);

  for (const row of rows) row.category = rules.find(([re]) => re.test(row.shop))?.[1] ?? 'Ask the LLM';
  postMessage({ stage: 'categorised', rows });
  await pause(delay);

  const totals: Record<string, number> = {};
  for (const row of rows) totals[row.category] = (totals[row.category] ?? 0) + row.amount;
  postMessage({ stage: 'totalled', rows, totals });
};
