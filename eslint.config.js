// .eslintrc.cjs
module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'], // Убрал 'server' отсюда
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', {
      'vars': 'all',
      'args': 'after-used',
      'ignoreRestSiblings': false,
      'varsIgnorePattern': '^_',
      'argsIgnorePattern': '^_',
    }],
  },
  overrides: [
    {
      files: ['server/**/*.cjs'], // Указываем .cjs для серверных файлов
      env: { node: true, es2020: true },
      parserOptions: { sourceType: 'commonjs' },
      rules: {
        // Здесь можно добавить специфичные правила для Node.js или отключить браузерные
        // no-undef для require, module, __dirname, process уже должен обрабатываться env: { node: true }
        // Если все еще есть проблемы, можно явно добавить:
        // 'no-undef': 'off',
      }
    },
    {
      files: ['*.config.js', '*.cjs'], // Для vite.config.js, postcss.config.js, tailwind.config.js, eslintrc.cjs
      env: { node: true, es2020: true },
      // sourceType для .config.js (ESM) и .cjs (CommonJS) будет разный.
      // ESLint должен сам определить по расширению или настройкам package.json
      // Для явности можно разделить:
    },
    {
      files: ['*.config.js'], // vite.config.js, tailwind.config.js, postcss.config.js (если они ESM)
      env: { node: true, es2020: true },
      parserOptions: { sourceType: 'module' },
    },
    {
      files: ['*.cjs'], // eslintrc.cjs, серверные .cjs
      env: { node: true, es2020: true },
      parserOptions: { sourceType: 'commonjs' },
    }
  ]
};