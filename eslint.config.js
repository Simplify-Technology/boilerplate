import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
        },
    },
    {
        ...react.configs.flat.recommended,
        ...react.configs.flat['jsx-runtime'], // Required for React 17+
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                route: 'readonly', // Ziggy route helper
                __dirname: 'readonly', // Node.js __dirname
                vi: 'readonly', // Vitest
                describe: 'readonly', // Vitest
                it: 'readonly', // Vitest
                expect: 'readonly', // Vitest
                beforeEach: 'readonly', // Vitest
                afterEach: 'readonly', // Vitest
                beforeAll: 'readonly', // Vitest
                afterAll: 'readonly', // Vitest
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
            // O default de `<button>` no HTML é `type="submit"`: um botão sem
            // type declarado submete o formulário que por acaso o envolver. É
            // latente até alguém reusar o componente dentro de um <form> — e aí
            // o clique faz duas coisas. A regra cobra o atributo explícito.
            'react/button-has-type': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        plugins: {
            'react-hooks': reactHooks,
        },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
    {
        files: ['**/*.test.*', '**/*.spec.*', '**/test/**/*'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                vi: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'no-constant-binary-expression': 'off',
        },
    },
    {
        ignores: ['vendor', 'node_modules', 'public', 'bootstrap/ssr', 'tailwind.config.js', '.history'],
    },
    prettier, // Turn off all rules that might conflict with Prettier
];
