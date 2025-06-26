// ESLint configuration for TypeScript project
export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
        module: 'writable',
        require: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      // Code quality rules
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'off' // TypeScript handles this
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'no-console': 'off'
    }
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      '**/*.js',
      '**/*.d.ts',
      'coverage/'
    ]
  }
];