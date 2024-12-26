import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      react,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    ignores: ['dist/**/*', 'assets/**/*'],
  }
);
