# ADR 0001 — Electron + SQLite locale au lieu de MERN/MongoDB

## Contexte

Le projet a d'abord été spécifié en stack MERN (React, Express, MongoDB) pour un usage web.
Le responsable a ensuite précisé une contrainte non négociable : l'application doit fonctionner
**sans connexion internet**, sur le PC du responsable, avec **toutes les données stockées en
local**. Un serveur MongoDB distant (ou même local nécessitant `mongod` en tâche de fond) ne
répond pas à cette contrainte : soit il faut une connexion réseau, soit il faut packager et
faire tourner un second processus serveur de base de données à côté de l'app, ce qui complique
l'installation pour un utilisateur non technique.

## Décision

L'application devient une **app desktop Electron**, avec :
- **SQLite** comme moteur de stockage, via `better-sqlite3` (API synchrone, pas de serveur à
  lancer, un seul fichier `.sqlite` sur disque).
- La logique métier (services) vit dans le **processus principal Electron** (`src/main`), qui
  est aussi celui qui a accès au disque.
- Le renderer (React) ne fait qu'afficher et appeler cette logique via IPC (voir ADR 0002).

## Conséquences

- Zéro dépendance réseau pour le fonctionnement courant (CRUD, import, calculs, dashboard).
- Installation utilisateur = un exécutable unique (`electron-builder`), pas de base de données
  à installer séparément.
- **Contrainte** : le modèle de données Mongoose (documents) doit être re-pensé en schéma
  relationnel SQL (tables `cartons`, `decodeurs`, `apporteurs`, `objectifs`, `imports` avec
  clés étrangères) — voir `.claude/docs/data-model.md`.
- Coût : perte de la flexibilité de schéma de MongoDB ; toute évolution de structure passe par
  une migration SQL versionnée (`src/main/db/migrations/`).
- Alternative écartée : embarquer un `mongod` local dans le packaging Electron — rejeté pour son
  poids (~100 Mo+), la complexité de packaging multiplateforme, et l'absence de bénéfice réel
  pour un usage mono-utilisateur.
- Alternative écartée : stockage fichier plat (`lowdb`/`nedb`) — rejeté car les stats du
  dashboard (répartition par carton, agrégations d'objectifs) ont besoin de vraies requêtes
  `GROUP BY`/`SUM`, plus fiables et plus rapides en SQL qu'en filtrant du JSON en mémoire à
  chaque affichage.
- À reconsidérer si l'app doit un jour supporter plusieurs postes/utilisateurs synchronisés :
  SQLite mono-fichier ne résout pas la concurrence multi-écriture réseau — il faudrait alors
  réintroduire un serveur (ADR à écrire le moment venu, pas anticipé ici).
