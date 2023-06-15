'use strict';

const { parsePagination, buildPage } = require('../../utils/pagination');
const { toCents, toDecimal } = require('../../utils/money');

describe('parsePagination', () => {
  it('defaults to the first page', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('computes skip from page and limit', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps the limit to the configured maximum', () => {
    expect(parsePagination({ limit: '5000' }).limit).toBe(100);
  });

  it.each([['0'], ['-4'], ['banana'], [undefined]])('ignores a nonsense page %p', (page) => {
    expect(parsePagination({ page }).page).toBe(1);
  });
});

describe('buildPage', () => {
  it('reports totals and whether another page exists', () => {
    const page = buildPage({ items: [1, 2], total: 5, page: 1, limit: 2 });

    expect(page.meta).toEqual({
      page: 1,
      limit: 2,
      total: 5,
      totalPages: 3,
      hasNextPage: true,
    });
  });

  it('knows when it is on the last page', () => {
    expect(buildPage({ items: [1], total: 5, page: 3, limit: 2 }).meta.hasNextPage).toBe(false);
  });
});

describe('money', () => {
  it('round-trips a decimal amount through cents', () => {
    expect(toDecimal(toCents(12.99))).toBe(12.99);
  });

  it('avoids float drift that plain arithmetic would introduce', () => {
    expect(toCents(0.1) + toCents(0.2)).toBe(30);
    expect(toDecimal(toCents(0.1) + toCents(0.2))).toBe(0.3);
  });
});
