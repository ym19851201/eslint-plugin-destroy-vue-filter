module.exports = {
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  rules: {
    'destroy-filter': require('./rules/destroy-filter'),
  },
};
