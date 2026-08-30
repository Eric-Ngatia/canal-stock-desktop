# canal-stock-desktop — Instructions projet

App **Electron + React (Vite) + SQLite (better-sqlite3)**. Gestion de stock et de vente de
décodeurs/paraboles Canal+, **100% hors ligne**, toutes les données sur le disque de
l'utilisateur.

## Structure

- `src/main/` — processus principal Electron. Seul endroit à toucher le disque (SQLite) ou
  le système de fichiers. Contient `db/`, `services/` (logique métier), `ipc/handlers.js`.
- `src/renderer/` — UI React (Vite). Aucune règle métier, aucun accès DB direct.
- `src/main/preload.js` — la seule porte entre les deux (`window.api.*`).
- `docs/` — cahier des charges et ADR, à la racine du projet (hors de ce dépôt applicatif).

## Règles d'architecture (non négociables)

1. **Le renderer ne parle jamais à SQLite ni au système de fichiers directement.** Tout passe
   par `window.api.*` (preload) → `ipcMain.handle` (`src/main/ipc/handlers.js`) → un service.
   C'est ce qui permet de garder `contextIsolation: true` sans sacrifier la fonctionnalité (ADR 0002).
2. **Une règle métier vit une seule fois, dans un service de `src/main/services/`.** Ni le
   renderer, ni les handlers IPC, ne recalculent une commission ou ne revalident un statut.
3. **Le statut d'un décodeur ne régresse jamais** (`en_stock → vendu → active`, jamais l'inverse
   via l'UI). Utiliser `decodeursService.transitionAutorisee()` avant toute écriture de statut.
4. **Tout changement de schéma SQL est un nouveau fichier** dans `src/main/db/migrations/`,
   jamais une modification d'un fichier de migration déjà livré.
5. **Aucun appel réseau dans `src/main` ou `src/renderer`** pour le fonctionnement courant —
   l'app doit démarrer et fonctionner avion en main (RG-07). Toute exception future (sync,
   cloud) doit être isolée et documentée par un ADR.

## Commandes

- `npm run dev` — lance Vite (renderer) + Electron ensemble, avec rechargement.
- `npm test` — tests Node natifs (`node --test`) sur les services.
- `npm run build` — build renderer puis packaging `electron-builder` (`release/`).
- `npm run lint` — ESLint sur `src/`.

## Workflow OBLIGATOIRE pour toute tâche : Planification → Exécution → Révision

Aucune tâche de développement ne saute d'étape.

1. **Planification** — `/plan` (agent `planner`). Le plan est **écrit dans `.plans/<slug>.md`**
   et **validé par un humain** avant tout code.
2. **Exécution** — `/exec` (agent `executor`). Implémente **strictement** le plan approuvé.
   Un manque découvert → retour au planner, pas d'improvisation.
3. **Révision** — `/review` (agents `reviewer` + `rules-auditor`, en parallèle). Vérifie contre
   le plan et les règles métier, lance les tests, rend un verdict.

Raccourci : `/task <description>` enchaîne les trois avec un gate d'approbation entre Plan
et Exec.

## Règles métier

Les règles **RG-01 à RG-08** font foi — skill `business-rules`. Détail path-scopé dans
`.claude/rules/`. En cas de conflit entre une demande et une règle métier, **signale le
conflit avant d'écrire quoi que ce soit**.

## Conventions

- JavaScript ES2022+, modules CommonJS côté `src/main` (contrainte Electron/better-sqlite3),
  ESM côté `src/renderer` (Vite).
- Commits : Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`).
- Un service = un fichier de test (`test/<service>.test.js`), base SQLite en mémoire
  (`new Database(':memory:')`) pour les tests, jamais le fichier utilisateur réel.

## À ne jamais faire

- Écrire une requête `INSERT`/`UPDATE`/`DELETE` ailleurs que dans `src/main/services/`.
- Activer `nodeIntegration: true` ou désactiver `contextIsolation` sur la fenêtre principale.
- Introduire une dépendance réseau (fetch, axios, appel API distant) dans le chemin critique
  d'une fonctionnalité déjà spécifiée comme hors-ligne.
