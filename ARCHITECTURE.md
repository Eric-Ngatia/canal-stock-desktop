# canal-stock-desktop — Architecture & Configuration Claude Code

> Gestion de stock et de vente de décodeurs/paraboles Canal+, app **desktop Electron**,
> **100% hors ligne**, base **SQLite embarquée**. Séquence imposée pour chaque tâche :
> **Planification → Exécution → Révision**.

---

## 1. Principes directeurs

| # | Principe | Traduction concrète dans le repo |
|---|----------|-----------------------------------|
| 1 | **Zéro dépendance réseau au fonctionnement courant** | Toute la logique tourne dans `src/main`, qui n'accède qu'au disque local (SQLite via `better-sqlite3`). Aucun `fetch`/`axios` dans le chemin critique — RG-07. |
| 2 | **Le renderer ne parle jamais à la base directement** | `contextIsolation: true`, `nodeIntegration: false`. Seul `preload.js` expose une API explicite (`window.api.*`) — ADR 0002. |
| 3 | **Une règle métier vit une seule fois** | RG-01 à RG-08 vivent chacune dans un unique service de `src/main/services/`. Le renderer ne fait qu'afficher et appeler. |
| 4 | **Storage abstrait derrière un point d'entrée unique** | `database.js` est le seul fichier qui ouvre le fichier `.sqlite` ; `getDb()`/`setDbForTests()` permettent de le substituer en test sans toucher aux services. |
| 5 | **Context Claude minimal & ciblé** | `CLAUDE.md` < 200 lignes + règles path-scopées dans `.claude/rules/` (chargées seulement quand un fichier concerné est ouvert). |
| 6 | **Chaque tâche suit Plan → Exec → Review** | 6 sous-agents + 5 slash-commands + un plan écrit sur disque (`.plans/<slug>.md`), qui survit au compactage de contexte. |

---

## 2. Pourquoi Electron + SQLite et pas MERN/MongoDB

Le projet a d'abord été spécifié en MERN (React/Express/MongoDB) pour un usage web classique.
La contrainte **« aucune connexion internet nécessaire, toutes les données en local »** a
changé la donne : un serveur MongoDB (même local) impose un second processus à faire tourner,
ce qui complique l'installation pour un utilisateur non technique. Voir **ADR 0001** pour le
détail et les alternatives écartées (mongod embarqué, lowdb/nedb).

La frontière métier/UI déjà présente dans la version web est conservée : `src/main/services/`
joue le rôle que jouait le backend Express, `src/renderer` celui du frontend React — seul le
transport change (IPC au lieu de HTTP).

---

## 3. Vue d'ensemble de l'arborescence

```text
canal-stock-desktop/                     # racine du projet (un seul dépôt)
├── ARCHITECTURE.md                      # ce document
├── docs/
│   ├── cahier-des-charges.md            # spec fonctionnelle source
│   └── adr/
│       ├── 0001-electron-sqlite-offline.md
│       └── 0002-ipc-boundary-renderer-no-db-access.md
│
└── app/                                 # ── DÉPÔT APPLICATIF ──
    ├── CLAUDE.md                        # règles GLOBALES (< 200 lignes)
    ├── package.json                     # scripts, dépendances réelles, config electron-builder
    ├── vite.config.js / tailwind.config.js / postcss.config.js
    ├── .env.example                     # variables documentées (COMMISSION_APPORTEUR, DB_FILENAME)
    ├── .gitignore                       # inclut .plans/, *.sqlite, .claude/settings.local.json
    │
    ├── .claude/                         # ── CONFIG CLAUDE CODE ──
    │   ├── settings.json                # permissions + hooks — COMMITÉ
    │   ├── settings.local.json          # surcharges perso — GITIGNORÉ
    │   ├── agents/
    │   │   ├── planner.md               # PLANIFICATION
    │   │   ├── executor.md              # EXÉCUTION
    │   │   ├── reviewer.md              # RÉVISION
    │   │   ├── rules-auditor.md         # audite RG-01..08 sur chaque diff
    │   │   ├── electron-ui-builder.md   # spécialiste écrans React du renderer
    │   │   └── import-verifier.md       # audite spécifiquement RG-04 (import Canal+)
    │   ├── commands/
    │   │   ├── plan.md · exec.md · review.md · task.md · new-feature.md
    │   ├── skills/
    │   │   ├── task-workflow/SKILL.md       # LE workflow Plan→Exec→Review
    │   │   ├── business-rules/SKILL.md      # RG-01..RG-08, préchargé dans les agents
    │   │   ├── electron-conventions/SKILL.md # où va quoi, ordre d'ajout d'une feature
    │   │   └── ipc-conventions/SKILL.md      # nommage des canaux, sécurité
    │   ├── rules/                       # path-scopées, chargées à la demande
    │   │   ├── import-matching.md       # RG-04 — paths: src/main/services/import.service.js
    │   │   ├── commission-calcul.md     # RG-03 — paths: src/main/services/ventes.service.js
    │   │   ├── renderer-no-db.md        # ADR 0002 — paths: src/renderer/**
    │   │   └── sqlite-schema.md         # RG-01/06 — paths: src/main/db/**
    │   ├── hooks/
    │   │   ├── guard-plan.sh                    # bloque le code sans plan approuvé
    │   │   ├── guard-secrets.sh                 # bloque .env, certificats de signature
    │   │   └── guard-renderer-db-boundary.sh    # bloque l'accès disque depuis le renderer
    │   └── docs/
    │       ├── data-model.md            # schéma SQLite détaillé
    │       └── phases.md                # planning 5 phases
    │
    ├── src/
    │   ├── main/                        # ── PROCESSUS PRINCIPAL (métier + disque) ──
    │   │   ├── main.js                  # BrowserWindow, contextIsolation: true
    │   │   ├── preload.js               # contextBridge — seule porte vers le renderer
    │   │   ├── db/
    │   │   │   ├── database.js          # getDb() / setDbForTests()
    │   │   │   └── migrations/0001_init.sql
    │   │   ├── services/                # UNE règle métier = UN fichier
    │   │   │   ├── decodeurs.service.js     # RG-01, RG-05
    │   │   │   ├── ventes.service.js        # RG-02, RG-03
    │   │   │   ├── import.service.js        # RG-04
    │   │   │   ├── apporteurs.service.js
    │   │   │   ├── objectifs.service.js     # RG-06
    │   │   │   └── export.service.js        # RG-08
    │   │   └── ipc/handlers.js          # ipcMain.handle, un canal par action métier
    │   │
    │   └── renderer/                    # ── UI REACT (Vite), zéro règle métier ──
    │       ├── main.jsx / App.jsx
    │       ├── api/bridge.js            # SEUL point d'appel à window.api
    │       ├── pages/                   # Dashboard, Stock, VenteActivation, Import, Apporteurs, Objectifs
    │       └── components/Navbar.jsx
    │
    └── test/                            # node --test, base SQLite en mémoire
        ├── decodeurs.service.test.js
        ├── ventes.service.test.js
        ├── import.service.test.js
        ├── objectifs.service.test.js
        └── export.service.test.js
```

---

## 4. La frontière renderer ↔ main (règle d'or)

```
┌─────────────────────┐        IPC        ┌──────────────────────────┐
│   src/renderer       │  window.api.*  │   src/main                │
│   (React, Vite)       │ ─────────────▶ │   preload.js → handlers.js│
│   AUCUN accès disque  │                │   → services/*.js         │
│   AUCUNE règle métier │ ◀───────────── │   → SQLite (better-sqlite3)│
└─────────────────────┘   résultat JSON  └──────────────────────────┘
```

**Interdit** : `nodeIntegration: true`, un composant qui importe `better-sqlite3` ou `fs`,
un appel `window.api.*` fait ailleurs que dans `src/renderer/api/bridge.js`. Voir **ADR 0002**
et `.claude/rules/renderer-no-db.md`. Mécaniquement bloqué par
`.claude/hooks/guard-renderer-db-boundary.sh`.

---

## 5. Configuration Claude Code — le workflow Plan → Exec → Review

### 5.1 Les agents (`.claude/agents/`)

| Agent | Outils | Sortie | Ne fait PAS |
|---|---|---|---|
| `planner` | Read, Grep, Glob | Plan dans `.plans/<slug>.md` | N'écrit aucun code de prod |
| `executor` | Read, Write, Edit, Grep, Glob, Bash | Code + tests | Ne redéfinit pas le périmètre |
| `reviewer` | Read, Grep, Glob, Bash, Edit | Rapport + verdict | Ne re-scope pas la feature |
| `rules-auditor` | Read, Grep, Glob, Bash | Liste de constats RG-01..08 | Ne corrige rien, constate seulement |
| `electron-ui-builder` | Read, Write, Edit, Grep, Glob, Bash | Écrans React | N'ajoute jamais de logique métier dans un composant |
| `import-verifier` | Read, Grep, Glob, Bash | Audit RG-04 | Ne modifie pas `import.service.js` |

### 5.2 Les commandes (`.claude/commands/`)

`/plan <tâche>` · `/exec` · `/review` (lance `reviewer` + `rules-auditor` en parallèle) ·
`/task <tâche>` (orchestre les trois, gate d'approbation entre Plan et Exec) ·
`/new-feature <nom>` (branche + emplacements de fichiers, puis renvoie sur `/plan`).

### 5.3 Les skills

`task-workflow` (la discipline P→E→R) et `business-rules` (RG-01..08, préchargé dans les
agents via `skills:`) sont partagés. `electron-conventions` et `ipc-conventions` sont
spécifiques à ce dépôt.

### 5.4 Les hooks de garde-fou

| Hook | Effet | Testé |
|---|---|---|
| `guard-plan.sh` | Bloque toute écriture de code source (`src/**/*.js`, `*.jsx`, `*.sql`) tant qu'aucun plan n'existe dans `.plans/` | ✅ voir §8 |
| `guard-secrets.sh` | Bloque l'écriture de `.env`, `.env.*`, certificats de signature (`.p12`/`.pfx`) | ✅ voir §8 |
| `guard-renderer-db-boundary.sh` | Bloque toute écriture dans `src/renderer/**` qui importerait `better-sqlite3`/`fs`, ou qui appellerait `window.api.*` hors de `bridge.js` | ✅ voir §8 |

---

## 6. Mapping règles métier → fichier propriétaire → test

| Règle | Description courte | Fichier propriétaire | Test |
|---|---|---|---|
| RG-01 | Numéro de série unique et obligatoire | `db/migrations/0001_init.sql` (contrainte) + `decodeurs.service.js` | ✅ `decodeurs.service.test.js` |
| RG-02 | Champs obligatoires à la vente (date, type, apporteur si type=apporteur) | `ventes.service.js` | ✅ `ventes.service.test.js` |
| RG-03 | Commission = 1500F si vente via apporteur, sinon 0 | `ventes.service.js` | ✅ `ventes.service.test.js` |
| RG-04 | Import Canal+ : active sans créer, jamais de régression, idempotent | `import.service.js` | ✅ `import.service.test.js` |
| RG-05 | Progression stricte `en_stock → vendu → active` | `decodeurs.service.js` (`transitionAutorisee`) | ✅ `decodeurs.service.test.js` |
| RG-06 | Un seul objectif actif par (mois, année) | `objectifs.service.js` + contrainte `UNIQUE` | ✅ `objectifs.service.test.js` |
| RG-07 | Zéro appel réseau requis au fonctionnement courant | Architecture-level, contrôlé par `rules-auditor` (grep) | — pas de test unitaire dédié |
| RG-08 | Données toujours exportables (sauvegarde/Excel) | `export.service.js` | ✅ `export.service.test.js` |

> RG-02 et RG-05 sont vérifiées **volontairement deux fois** — une fois en base (`CHECK`), une
> fois côté service (message d'erreur explicite). C'est documenté dans le skill
> `business-rules` pour qu'un futur agent ne supprime pas l'une des deux croyant factoriser.

---

## 7. Mapping phases → séquence Claude Code

Détail complet dans `.claude/docs/phases.md`. Résumé :

| Phase | Contenu | Services/fichiers principaux |
|---|---|---|
| 0 — Socle Electron | Fenêtre, SQLite, migration initiale | `main.js`, `preload.js`, `db/*` |
| 1 — Dashboard + Stock | Comptages, code couleur | `decodeurs.service.js`, `pages/Dashboard.jsx`, `pages/Stock.jsx` |
| 2 — Vente & Activation + Import | RG-02/03/04/05 | `ventes.service.js`, `import.service.js` |
| 3 — Apporteurs + Objectifs | RG-06 | `apporteurs.service.js`, `objectifs.service.js` |
| 4 — Export & Packaging | RG-08, `electron-builder` | `export.service.js`, `package.json` |

---

## 8. Vérification effectuée avant livraison

- **JSON valide** : `settings.json`, `settings.local.json`, `package.json` — tous parsés sans
  erreur.
- **Bash syntaxiquement correct** : `bash -n` sur les 3 hooks — tous OK.
- **Tests unitaires réels** : `npm test` exécute **14 tests sur les vrais services** (pas des
  mocks), base SQLite en mémoire à chaque fois. **14/14 passent.**
- **Hooks testés avec payloads simulés** (cas qui doit bloquer + cas qui doit passer, pour
  chacun des 3 hooks) — résultats détaillés dans le `README.md`.
- **Permissions d'exécution** : les 3 scripts de `.claude/hooks/` sont `chmod +x`.

## 9. Ce qui est garanti et ce qui ne l'est pas

**Garanti mécaniquement** par ce scaffold :
- Aucun code source ne peut être écrit sans plan approuvé dans `.plans/` (hook `guard-plan.sh`).
- Aucun secret ne peut être écrit par erreur dans un fichier suivi par git (`guard-secrets.sh`).
- Le renderer ne peut pas importer `better-sqlite3`/`fs`, ni appeler `window.api` hors du
  bridge (`guard-renderer-db-boundary.sh`).
- Les contraintes RG-01 (unicité) et RG-06 (un objectif par mois) sont imposées par SQLite
  lui-même, indépendamment de ce que fait le code applicatif.

**Reste au jugement humain** :
- La **qualité** du plan écrit par `planner` — le gate d'approbation existe précisément parce
  que ce jugement ne s'automatise pas.
- La justesse de `SERIAL_REGEX` (RG-04) face aux **vrais** fichiers Canal+ — le format exact
  n'était pas connu à la conception ; premier import réel à valider avec attention (voir
  `.claude/rules/import-matching.md`).
- Le packaging final (`electron-builder`) sur chaque OS cible n'a pas été exercé dans cet
  environnement de scaffold — seuls les tests Node purs l'ont été.
