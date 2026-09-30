export interface Summary {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
  p90: number;
}

const pct = (sorted: number[], p: number) => {
  const i = (sorted.length - 1) * p,
    lo = Math.floor(i),
    hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
};

export function summarize(values: number[]): Summary {
  if (values.length === 0) return { count: 0, min: 0, max: 0, avg: 0, median: 0, p90: 0 };
  const s = [...values].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    count: s.length,
    min: s[0],
    max: s[s.length - 1],
    avg: Math.round(sum / s.length),
    median: Math.round(pct(s, 0.5)),
    p90: Math.round(pct(s, 0.9)),
  };
}

export function groupSummaries<T>(rows: T[], key: (r: T) => string, value: (r: T) => number) {
  const groups = new Map<string, number[]>();
  for (const r of rows) {
    const k = key(r);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(value(r));
  }
  return [...groups]
    .map(([group, vals]) => ({ group, ...summarize(vals) }))
    .sort((a, b) => b.count - a.count);
}
