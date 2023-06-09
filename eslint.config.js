'use strict';

const js = require('@eslint/js');

/**
 * Flat ESLint config (ESLint 9).
 *
 * The rules that are switched on are the ones that would have caught the
 * defects actually found in this codebase: an unused self-require, a module
 * that required itself, stray `console.log` of user credentials, and variables
 * shadowing each other across the auth callbacks.
 */
module.exports = [
  {
    ignores: ['node_modules/**', 'coverage/**', 'docs/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        __dirname: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        global: 'writable',
        fetch: 'readonly',
      },
    },
    rules: {
      'no-console': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^next$', varsIgnorePattern: '^_' }],
      'no-shadow': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
      curly: ['error', 'multi-line'],
      'no-return-await': 'error',
      'consistent-return': 'off',
      strict: ['error', 'global'],
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
  },
];
