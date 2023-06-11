'use strict';

const CENTS_PER_UNIT = 100;

/** Convert a decimal amount (12.99) to whole cents (1299). */
function toCents(amount) {
  return Math.round(Number(amount) * CENTS_PER_UNIT);
}

/** Convert whole cents (1299) back to a decimal amount (12.99). */
function toDecimal(cents) {
  return Number.parseFloat((Number(cents) / CENTS_PER_UNIT).toFixed(2));
}

module.exports = { toCents, toDecimal, CENTS_PER_UNIT };
