---
description: Conventions de schéma et de migration SQLite (RG-01, RG-06). Chargée près du code de base de données.
paths:
  - "src/main/db/**"
---

# Schéma et migrations SQLite

- Toute évolution de schéma est un **nouveau fichier** `NNNN_<nom>.sql` dans
  `src/main/db/migrations/`, numéroté à la suite du dernier existant. Ne jamais modifier un
  fichier de migration déjà livré (déjà appliqué sur la base d'un utilisateur, une modification
  rétroactive ne s'appliquerait pas chez lui).
- Les contraintes d'intégrité (`UNIQUE`, `CHECK`) sont la **dernière ligne de défense** pour
  RG-01 (unicité du numéro de série) et RG-06 (un seul objectif par mois) — elles doivent
  rester en base même si le service applicatif valide déjà la même chose en amont.
- `database.js` applique les migrations dans l'ordre alphabétique des noms de fichiers au
  démarrage de l'app, via la table `_migrations`. Un fichier renommé après application casse
  ce suivi — ne jamais renommer une migration déjà livrée.
- Utiliser `db.pragma('foreign_keys = ON')` reste actif (déjà fait dans `database.js`) : toute
  nouvelle table avec une clé étrangère en dépend pour son intégrité référentielle.

## Tester un service sans runtime Electron

`database.js` ne fait `require('electron')` que paresseusement, à l'intérieur de `getDb()`.
Un test de service doit appeler `setDbForTests(maBaseEnMemoire)` **avant** d'importer le
service testé, sinon le premier appel réel à `getDb()` tentera de charger Electron et
échouera hors runtime Electron. Voir `test/decodeurs.service.test.js` pour le patron exact.

## Obligation de test

Toute nouvelle migration doit être exercée par au moins un test qui ouvre une base `:memory:`,
laisse `runMigrations()` s'exécuter, et vérifie que la nouvelle table/colonne existe et que
ses contraintes (`UNIQUE`/`CHECK`) rejettent bien les cas invalides attendus.
