module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    env: {
        es6: true,
        node: true,
        mongo: true
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
            forOf: true,
            spread: true,
            modules: true,
            classes: true,
            generators: true,
            restParams: true,
            regexUFlag: true,
            regexYFlag: true,
            globalReturn: true,
            destructuring: true,
            impliedStrict: true,
            blockBindings: true,
            defaultParams: true,
            octalLiterals: true,
            arrowFunctions: true,
            binaryLiterals: true,
            templateStrings: true,
            superInFunctions: true,
            unicodeCodePointEscapes: true,
            objectLiteralShorthandMethods: true,
            objectLiteralComputedProperties: true,
            objectLiteralDuplicateProperties: true,
            objectLiteralShorthandProperties: true
        }
    },
    rules: {
        '@typescript-eslint/adjacent-overload-signatures': 'warn',
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/no-array-constructor': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-empty-function': 'error',
        '@typescript-eslint/class-name-casing': 'warn',
        '@typescript-eslint/no-extra-semi': 'error',
        '@typescript-eslint/no-namespace': ['error', { 'allowDeclarations': true }],
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/brace-style': ['error', 'stroustrup'],
        '@typescript-eslint/ban-types': ['warn', {
            types: {
                'String': {
                    'message': 'Use "string" instead of "String"',
                    'fixWith': 'string'
                }
            }
        }],
        'object-curly-spacing': ['error', 'always', { objectsInObjects: false }],
        'no-duplicate-imports': 'error',
        'space-in-parens': ['error', 'never'],
        'no-new-wrappers': 'error',
        'no-debugger': 'error',
        'no-new-func': 'error',
        'no-caller': 'error',
        'no-with': 'error',
        indent: ['error', 2, { SwitchCase: 1 }],
        quotes: ['error', 'single'],
        semi: ['error', 'always']
    },
    globals: {
        _config: false,
        console: true
    }
}