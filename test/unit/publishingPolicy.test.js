'use strict';

const policy = require('../../services/publishingPolicy');

describe('publishing policy registry', () => {
  it('ships with the rules the assignment requires', () => {
    expect(policy.listRules()).toEqual(expect.arrayContaining(['bannedPseudonym']));
  });

  it('allows an ordinary author', () => {
    expect(policy.evaluate({ user: { authorPseudonym: 'Lohgarra' }, book: {} })).toEqual([]);
  });

  it.each([['Darth Vader'], ['darth vader'], ['  DARTH   VADER  ']])(
    'refuses %p regardless of case and spacing',
    (pseudonym) => {
      const reasons = policy.evaluate({ user: { authorPseudonym: pseudonym }, book: {} });
      expect(reasons).toHaveLength(1);
      expect(reasons[0]).toMatch(/may not publish/);
    }
  );

  it('accepts a new rule without any change to the book service', () => {
    const unregister = policy.registerRule('noSequels', ({ book }) =>
      /part ii/i.test(book.title || '') ? 'Sequels are on hiatus' : null
    );

    try {
      expect(policy.evaluate({ user: {}, book: { title: 'Kashyyyk Part II' } })).toEqual([
        'Sequels are on hiatus',
      ]);
      expect(policy.evaluate({ user: {}, book: { title: 'Kashyyyk' } })).toEqual([]);
    } finally {
      unregister();
    }

    expect(policy.listRules()).not.toContain('noSequels');
  });

  it('rejects a rule that is not callable', () => {
    expect(() => policy.registerRule('broken', 'nope')).toThrow(TypeError);
  });
});
