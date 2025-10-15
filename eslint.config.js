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
    'commitlint.config.js',
    'apps/frontend/monitor/src/components/ui/**/*',
    'packages/browser-utils/src/metrics/**/*',
]

const frontendMonitorConfig = {
    files: ['apps/frontend/monitor/**/*.{ts,tsx}'],
    ignores: ['apps/frontend/monitor/src/components/ui/**/*'],
    languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
    },
    plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
    },
    rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        'no-console': 'error',
    },
}

const backendMonitorConfig = {
    files: ['apps/backend/**/*.ts'],
    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.jest,
        },
        parser: tseslint.parser,
    },
    rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'error',
    },
}

module.exports = tseslint.config(
    {
        ignores,
        extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
        plugins: {
            prettier: eslintPrettier,
            'simple-import-sort': importSort,
        },
        rules: {
            'prettier/prettier': 'error',
            'simple-import-sort/imports': 'error',
        },
    },
    frontendMonitorConfig,
    backendMonitorConfig
)
