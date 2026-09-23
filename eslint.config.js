// ESLint config enforcing consistent code style: small functions, low complexity, no bare string
// literals (use named constants), and functions that do one thing.
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

const restrictedStringLiteralSelectors = [
  {
    selector: 'TSLiteralType > TSStringLiteral',
    message: 'No string-literal types. Use a named constant set and derive a type from it.',
  },
  {
    // typeof comparisons are exempt, so this excludes either side being a `typeof` unary.
    selector:
      "BinaryExpression[operator=/^(===|!==)$/][left.operator!='typeof'][right.operator!='typeof'] > Literal[raw=/^['\"]/]",
    message: 'No string-literal operands in comparisons. Compare against a named constant member.',
  },
  {
    selector: 'SwitchCase > Literal',
    message: 'No string-literal case labels. Switch over named constant members.',
  },
];

export default [
  {
    // apps/* are throwaway demo/playground code, not the published packages this config's
    // strict conventions exist to enforce.
    ignores: ['**/dist/**', 'coverage/**', '**/node_modules/**', '**/*.d.ts', 'apps/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['packages/core/tsconfig.json', 'packages/react/tsconfig.json'],
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 20, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 2],
      'max-params': ['error', 3],
      // Complexity limit tuned so real validation/parse functions pass while keeping functions
      // focused. Set at 8 to reject overly-complex branching.
      complexity: ['error', 8],
      'import/no-default-export': 'error',
      'import/no-cycle': 'error',
      'no-restricted-syntax': ['error', ...restrictedStringLiteralSelectors],
      'no-magic-numbers': ['error', { ignore: [0, 1], ignoreArrayIndexes: true, enforceConst: true }],
      '@typescript-eslint/naming-convention': [
        'error',
        // React components use PascalCase; hooks and plain functions use camelCase, enforced by
        // the `use`-prefix convention for hooks and verb-name conventions for functions.
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
  {
    // JSX is denser than plain TypeScript, so allow 30 lines per function in .tsx vs. 20 in .ts.
    files: ['**/*.tsx'],
    rules: {
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      complexity: 'off',
      'no-magic-numbers': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Closed-set files: constant definitions. The one place a literal string is authored,
    // next to its constant name. String-literal restrictions are disabled here.
    files: ['**/OpType.ts', '**/RejectReason.ts', '**/ChangeKind.ts', '**/IssueKind.ts', '**/*Type.ts', '**/*Key.ts', '**/*Kind.ts', '**/*Mode.ts', '**/*Phase.ts', '**/*Status.ts', '**/*Reason.ts', '**/CssVar.ts', '**/DataAttr.ts', '**/DomEvent.ts', '**/AriaRole.ts', '**/Direction.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Type assertions are allowed only in branded-ID constructors, dispatchers, unit helpers,
    // and widget definitions where they're necessary to narrow types.
    files: ['**/BoardsState.ts', '**/dispatchByType.ts', '**/ids/*.ts', '**/units/*.ts', '**/cssVars.ts', '**/defineWidget.ts'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': 'off',
    },
  },
  {
    // Build-tool config files (vite/vitest, tsdown, …) require a default export by convention.
    files: ['*.config.ts', '*.config.js'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
];
