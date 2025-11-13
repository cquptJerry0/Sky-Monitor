const eslint = require('@eslint/js')
const globals = require('globals')
const reactHooks = require('eslint-plugin-react-hooks')
const reactRefresh = require('eslint-plugin-react-refresh')
const eslintPrettier = require('eslint-plugin-prettier')
const importSort = require('eslint-plugin-simple-import-sort')

const tseslint = require('typescript-eslint')

const ignores = [
    'dist',
    'build',
    '**/*.js',
    '**/*.mjs',
    '**/*.d.ts',
    'eslint.config.js',
    'apps/frontend/monitor/src/components/ui/**/*',
    'packages/browser-utils/src/metrics/**/*',
]

module.exports = tseslint.config({
    ignores,
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
        prettier: eslintPrettier,
        'simple-import-sort': importSort,
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
    },
    rules: {
        'prettier/prettier': ['warn', {}, { usePrettierrc: true }],
        'simple-import-sort/imports': 'off',
        'prefer-const': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-unused-vars': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
    },
})
