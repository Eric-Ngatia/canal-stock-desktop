---
description: Frontière renderer/main — aucun accès direct à SQLite ou au disque depuis le renderer (ADR 0002). Chargée près du code UI.
paths:
  - "src/renderer/**"
---

# Le renderer ne touche jamais SQLite ni le disque — ADR 0002

- Aucun composant ou page de `src/renderer/` n'importe `better-sqlite3`, `fs`, ni aucun module
  Node d'accès disque. La seule source de données est `src/renderer/api/bridge.js`.
- Aucun appel `window.api.*` en dehors de `bridge.js` — un composant qui a besoin d'une nouvelle
  action l'ajoute d'abord au bridge (qui lui-même s'appuie sur une méthode déjà exposée par
  `preload.js`), jamais un accès direct au composant.
- Aucun `fetch`/`axios`/appel réseau dans le renderer — toute donnée transite par IPC vers le
  processus principal, qui est la seule couche autorisée à toucher le disque (RG-07).

## Le piège silencieux

`window.api` est un objet global accessible depuis n'importe quel composant sans import
explicite — rien n'empêche techniquement de l'appeler directement dans un `useEffect` sans
passer par `bridge.js`. Ce n'est pas une erreur de compilation, juste une frontière
architecturale non respectée. C'est précisément ce que le hook
`guard-renderer-db-boundary.sh` et l'agent `reviewer` vérifient à chaque tour.

## Obligation de test

Pas de test automatisé dédié à cette règle (c'est une convention d'organisation, pas un
comportement runtime) — elle est vérifiée par lecture en revue et par le hook `PreToolUse`
qui bloque toute écriture dans `src/renderer/**` dont le contenu référence
`better-sqlite3` ou `require('fs')`.
