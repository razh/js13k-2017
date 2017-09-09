module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:flowtype/recommended',
  ],
  env: {
    browser: true,
  },
  parser: 'babel-eslint',
  plugins: [
    'flowtype',
  ],
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  globals: {
    WeakMap: false,
  },
  rules: {
    'arrow-parens': ['error', 'as-needed'],
    'comma-dangle': ['error', 'always-multiline'],
    'func-style': ['error', 'expression'],
    'no-multi-spaces': 'error',
    'object-curly-spacing': ['error', 'always'],
    'object-shorthand': ['error', 'always'],
    'padded-blocks': ['error', 'never'],
    semi: ['error', 'always'],
    'space-before-function-paren': ['error', 'never'],
    'space-in-parens': ['error', 'never'],
  },
};
