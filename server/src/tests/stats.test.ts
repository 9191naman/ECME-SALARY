import { describe, it, expect } from 'vitest';
import { summarize, groupSummaries } from '../domain/stats.js';

describe('summarize', () => {
  it('returns zeros for empty input', () => expect(summarize([]).count).toBe(0));
  it('computes min, max, avg, median', () => {
    expect(summarize([10, 20, 30, 40])).toMatchObject({
      count: 4,
      min: 10,
      max: 40,
      avg: 25,
      median: 25,
    });
  });
  it('median of odd list is the middle value', () => expect(summarize([5, 1, 3]).median).toBe(3));
  it('p90 interpolates', () => expect(summarize([0, 100]).p90).toBe(90));
  it('does not mutate input', () => {
    const a = [3, 1, 2];
    summarize(a);
    expect(a).toEqual([3, 1, 2]);
  });
});

describe('groupSummaries', () => {
  it('groups and orders by headcount', () => {
    const g = groupSummaries(
      [
        { k: 'a', v: 1 },
        { k: 'b', v: 5 },
        { k: 'b', v: 7 },
      ],
      (r) => r.k,
      (r) => r.v,
    );
    expect(g.map((x) => x.group)).toEqual(['b', 'a']);
    expect(g[0].avg).toBe(6);
  });
});
