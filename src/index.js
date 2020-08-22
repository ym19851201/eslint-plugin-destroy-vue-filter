module.exports = {
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  rules: {
    'convert-filter': require('./rules/convert-filter'),
    'resolve-callee': require('./rules/resolve-callee'),
    'destroy-filter': require('./rules/destroy-filter'),
  },
};
