# ADR 0002 — Frontière IPC stricte : le renderer ne parle jamais à SQLite directement

## Contexte

Electron permet techniquement d'activer `nodeIntegration: true` dans la fenêtre renderer, ce
qui donnerait à React un accès direct à `better-sqlite3` et au système de fichiers. C'est le
chemin le plus rapide à coder, mais il casse deux garanties qu'on veut conserver : l'isolation
de sécurité d'Electron (un renderer qui exécute du contenu web ne devrait jamais avoir un accès
disque complet), et la séparation UI/métier déjà retenue pour ce projet (les composants React ne
doivent contenir aucune règle métier — cf. `CLAUDE.md`).

## Décision

- `contextIsolation: true` et `nodeIntegration: false` sur la fenêtre principale (`src/main/main.js`).
- Un script `preload.js` expose une API restreinte et explicite sur `window.api` via
  `contextBridge.exposeInMainWorld`, une méthode par action métier (`window.api.listerDecodeurs()`,
  `window.api.vendreDecodeurs(...)`, etc.) — jamais un accès générique du type `window.api.query(sql)`.
- Côté processus principal, chaque méthode exposée correspond à un handler
  `ipcMain.handle('canal:xxx', ...)` déclaré dans `src/main/ipc/handlers.js`, qui appelle le
  service métier correspondant (`src/main/services/*.js`).
- Le renderer (`src/renderer`) n'importe **jamais** `better-sqlite3` ni aucun module Node
  d'accès disque — uniquement `src/renderer/api/bridge.js`, une fine couche qui appelle
  `window.api.*`.

## Conséquences

- Sécurité : même si le renderer charge un jour du contenu non maîtrisé (ex. prévisualisation
  d'un fichier importé), il ne peut pas exécuter de code Node arbitraire ni lire le disque
  librement.
- Le renderer reste strictement présentation + orchestration d'état (comme l'UI mobile de
  l'app de référence TimeFlow, qui ne réimplémente jamais une règle métier).
- **Contrainte** : toute nouvelle fonctionnalité ajoute un canal IPC nommé (`canal:<action>`),
  un handler, et une méthode de bridge — trois fichiers à toucher ensemble, jamais un accès
  direct depuis un composant React.
- Coût : un peu de boilerplate IPC répétitif par fonctionnalité (compensé par le hook
  `guard-renderer-db-boundary.sh` qui empêche mécaniquement la régression la plus tentante :
  un `require('better-sqlite3')` glissé dans un composant pour « aller plus vite »).
- Alternative écartée : `nodeIntegration: true` avec accès direct — rejetée malgré la simplicité,
  car le coût de sécurité n'est pas justifié par le gain de vitesse de développement, y compris
  pour un usage mono-utilisateur (un fichier importé malveillant reste un vecteur possible).
- À reconsidérer seulement si le rendu de contenu externe non fiable devient impossible à isoler
  autrement — pas anticipé dans le périmètre actuel (import Excel/CSV traité côté main, jamais
  rendu tel quel dans le DOM).
