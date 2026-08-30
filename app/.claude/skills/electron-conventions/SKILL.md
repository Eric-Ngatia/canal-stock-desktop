---
name: electron-conventions
description: Conventions du projet Electron canal-stock-desktop — où va le code, comment ajouter un canal IPC, comment tester un service. Utiliser pour créer un service, ajouter une fonctionnalité, ou décider où va un fichier.
---

# Conventions canal-stock-desktop (Electron + React + SQLite)

## Où va quoi

| Type de code | Emplacement |
|---|---|
| Règle métier, validation, calcul (RG-xx) | `src/main/services/<domaine>.service.js` |
| Requête SQL | Dans le service concerné, jamais dans un handler IPC ni dans le renderer |
| Nouveau canal IPC | `src/main/ipc/handlers.js` (`ipcMain.handle`) |
| Exposition au renderer | `src/main/preload.js` (`contextBridge`), une méthode par action |
| Appel depuis un composant | `src/renderer/api/bridge.js`, jamais `window.api` en direct |
| Écran / page | `src/renderer/pages/` |
| Composant réutilisable | `src/renderer/components/` |
| Changement de schéma SQL | Nouveau fichier `src/main/db/migrations/NNNN_<nom>.sql` |

## Ajouter une fonctionnalité qui touche la base de données

Dans cet ordre — c'est aussi l'ordre que le `planner` doit utiliser pour découper un plan :

1. Si le schéma doit changer : nouvelle migration numérotée dans `src/main/db/migrations/`.
2. Fonction dans le service concerné (`src/main/services/`), avec son test
   (`test/<service>.test.js`, base `:memory:`).
3. Handler IPC dans `src/main/ipc/handlers.js` — un canal nommé `canal:<domaine>:<action>`.
4. Méthode dans `preload.js` qui l'expose sur `window.api.<domaine>.<action>`.
5. Méthode dans `src/renderer/api/bridge.js` qui l'appelle.
6. Composant/page qui utilise le bridge.

Sauter une étape (ex. appeler `ipcRenderer.invoke` directement depuis un composant) casse la
frontière décrite dans l'ADR 0002 et sera bloqué en revue.

## Base de données

- `better-sqlite3` est **synchrone** — pas de `await` sur les requêtes elles-mêmes, seulement
  sur les opérations IPC/fichier autour.
- Toute opération qui touche plusieurs lignes en une fois (import, vente en masse) utilise
  `db.transaction(...)` pour rester atomique.
- Les tests de service ouvrent une base en mémoire (`new Database(':memory:')`) et rejouent
  `0001_init.sql` — jamais le fichier utilisateur réel.

## Tests

- `node --test` (natif Node, pas de framework externe à installer).
- Un fichier de test par service, même nommage : `ventes.service.js` → `ventes.service.test.js`.
- Un test par règle métier couverte, nommé explicitement (`test('RG-03: commission nulle si
  vente équipe', ...)`).
