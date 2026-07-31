module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
    jest: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }]
  }
};