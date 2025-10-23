import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vue.parsers['vue-eslint-parser'],
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2024,
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      parserOptions: { project: true },
    },
  },
  {
    ignores: ['index.d.ts', 'vite.config.ts', 'dist'],
  },
  {
    rules: {
      'vue/multi-word-component-names': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
]
