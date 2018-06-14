const path = require('path');
const libPath = path.resolve(__dirname, 'lib');
const sourcePath = path.resolve(__dirname, 'client', 'source');

module.exports = {
  root: true,
  env: {
    es6: true,
    commonjs: true,
  },
  extends: [
    'airbnb',
    'plugin:vue/recommended',
  ],
  settings: {
    'import/resolver': {
      'alias': [
        ['lib', libPath],
        ['@', sourcePath],
      ],
    },
  },
  rules: {
    'lines-around-directive': ['off'],
    'arrow-body-style': ['error', 'always'],
    'brace-style': ['error', 'stroustrup'],
    'radix': ['error', 'as-needed'],
    'curly': ['error', 'all'],
    'object-property-newline': [
      'error',
      {
        allowAllPropertiesOnSameLine: true,
      },
    ],
    'array-bracket-newline': [
      'error',
      {
        multiline: true,
      },
    ],
    'class-methods-use-this': ['off'],
    'prefer-template': ['off'],
    'quotes': [
      'error',
      'single',
      {
        allowTemplateLiterals: true
      },
    ],
    'max-len': ['off'],
    'no-shadow': ['off'],
    'space-before-function-paren': ['error', 'never'],
    'func-names': ['off'],
    'no-use-before-define': ['off'],
    'no-param-reassign': ['off'],
  },
  overrides: [
    {
      files: [ 'server/**/*.js' ],
      env: {
        node: true,
      },
      rules: {
        'no-console': ['off'],
      },
    },
    {
      files: [ '**/*.test.js' ],
      env: {
        mocha: true,
      },
      rules: {
        'no-console': ['off'],
      },
    },
    {
      files: [ 'client/source/**/*.*' ],
      env: {
        browser: true,
      },
      globals: {
        DEVELOP_MODE: true,
      },
    },
  ],
};
