'use strict';

const { config } = require('../config/env');

/**
 * Publishing policy registry — the extension seam of this codebase.
 *
 * Wookie Books has editorial rules about what may go on sale. Today there is
 * one ("the user Darth Vader is unable to publish his work on Wookie Books");
 * tomorrow there will be others — banned words, price ceilings, a cover-image
 * allow-list. Each rule is an independent function of (user, book) that returns
 * `null` to allow or a human-readable reason to refuse.
 *
 * Adding a rule means writing one function and registering it. Nothing in the
 * book service changes, and each rule is unit-testable on its own.
 */

/** @typedef {(context: {user: object, book: object}) => (string|null)} PublishingRule */

function normalise(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** Refuse anyone writing under a pen name on the banned list. */
const bannedPseudonymRule = ({ user }) => {
  const pseudonym = normalise(user?.authorPseudonym);
  const banned = config.bannedAuthorPseudonyms.map(normalise);
  if (banned.includes(pseudonym)) {
    return `The author "${user.authorPseudonym}" may not publish on Wookie Books`;
  }
  return null;
};

/** Sanity rule: a listed book must carry a non-negative price. */
const nonNegativePriceRule = ({ book }) => {
  if (book && typeof book.priceCents === 'number' && book.priceCents < 0) {
    return 'A book price may not be negative';
  }
  return null;
};

/** @type {Map<string, PublishingRule>} */
const rules = new Map();

function registerRule(name, rule) {
  if (typeof rule !== 'function') {
    throw new TypeError(`Publishing rule "${name}" must be a function`);
  }
  rules.set(name, rule);
  return () => rules.delete(name);
}

function listRules() {
  return [...rules.keys()];
}

/**
 * Run every registered rule.
 * @returns {string[]} the reasons publishing was refused; empty means allowed.
 */
function evaluate(context) {
  const reasons = [];
  for (const rule of rules.values()) {
    const reason = rule(context);
    if (reason) reasons.push(reason);
  }
  return reasons;
}

registerRule('bannedPseudonym', bannedPseudonymRule);
registerRule('nonNegativePrice', nonNegativePriceRule);

module.exports = { registerRule, listRules, evaluate, bannedPseudonymRule, nonNegativePriceRule };
