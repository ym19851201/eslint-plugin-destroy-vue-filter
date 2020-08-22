const fs = require('fs');

const rule = require('../../src/rules/resolve-callee');

const eslint = require('eslint');
const RuleTester = eslint.RuleTester;

const parserOptions = {
  ecmaVersion: 11,
  parser: '@typescript-eslint/parser',
  sourceType: 'module',
};

const settings = {
  env: { browser: true, es2020: true },
  parser: require.resolve('vue-eslint-parser'),
  parserOptions,
  plugins: ['vue'],
};
const ruleTester = new RuleTester(settings);

const code = fs.readFileSync(
  './__tests__/rules/fixtures/convert-filter-result.ts',
  'utf8',
);
const output = fs.readFileSync(
  './__tests__/rules/fixtures/resolve-callee-result.ts',
  'utf8',
);

const errors = (n = 1) =>
  [...Array(n).keys()].map(() => ({
    message: 'Vue2 style filters are deprecated',
  }));

const valid = [
  {
    code: `
  const filter = (arg: string) => {
    return arg.toUpperCase();
  };
  `,
  },
];

const testCase = {
  code,
  errors: errors(1),
  output,
};

const invalid = [testCase];

ruleTester.run('resolve-callee', rule, { valid, invalid });
