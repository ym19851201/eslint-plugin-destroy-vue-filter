module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: ['plugin:vue/essential'],
  parserOptions: {
    ecmaVersion: 11,
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: [],
  rules: {
    'convert-filter': 1,
    'resolve-callee': 1,
    'destroy-filter': ['error', 'xxx/xxx'],
  },
};
