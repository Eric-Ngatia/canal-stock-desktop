const js = require('@eslint/js');

/**
 * ESLint 9 (flat config). Scaffold initial n'avait jamais ajouté ce fichier — `npm run lint`
 * échouait avant même de lire un fichier source. Config volontairement minimale (pas de
 * dépendance ajoutée) : règles recommandées d'ESLint + globals adaptés à chaque frontière déjà
 * documentée dans CLAUDE.md (CommonJS côté src/main, ESM+JSX côté src/renderer).
 */
module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'release/**', '.plans/**'],
  },
  js.configs.recommended,
  {
    // src/main + test/ : CommonJS, runtime Node/Electron.
    files: ['src/main/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        exports: 'writable',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
  },
  {
    // src/renderer : ESM, JSX, exécuté dans le navigateur (fenêtre Electron).
    files: ['src/renderer/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    rules: {
      // JSX : une variable utilisée seulement en <Composant /> n'est pas détectée comme un
      // usage par la règle de base sans le parseur JSX d'un plugin dédié (non installé ici,
      // pour rester sans nouvelle dépendance) — évite les faux positifs sur les imports
      // d'icônes/composants, y compris quand ils arrivent via une déstructuration de paramètre
      // (`{ icon: Icon }`), d'où `argsIgnorePattern` en plus de `varsIgnorePattern`.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z]', argsIgnorePattern: '^[A-Z]' }],
    },
  },
];
