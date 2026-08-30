# Phases de développement — canal-stock-desktop

Chaque phase = une série de tâches, chacune passant par `/task` (Planification → Exécution →
Révision). Reprend le découpage déjà validé pour le design (Dashboard+Stock, puis
Vente&Activation+Import, puis Apporteurs+Objectifs), plus les phases d'infrastructure Electron
propres à cette stack.

| Phase | Contenu | Fichiers principaux |
|---|---|---|
| **0 — Socle Electron** | `main.js`, `preload.js`, ouverture SQLite + migration initiale, fenêtre vide qui charge le renderer Vite | `src/main/*`, `src/main/db/*` |
| **1 — Dashboard + Stock** | Services `decodeurs`, comptages par statut, page Stock avec code couleur, page Dashboard | `decodeurs.service.js`, `pages/Dashboard.jsx`, `pages/Stock.jsx` |
| **2 — Vente & Activation + Import** | Service `ventes` (RG-02, RG-03, RG-05), service `import` (RG-04), pages associées | `ventes.service.js`, `import.service.js`, `pages/VenteActivation.jsx`, `pages/Import.jsx` |
| **3 — Apporteurs + Objectifs** | Services `apporteurs`, `objectifs` (RG-06), pages associées | `apporteurs.service.js`, `objectifs.service.js`, `pages/Apporteurs.jsx`, `pages/Objectifs.jsx` |
| **4 — Export & Packaging** | Service `export` (RG-08), configuration `electron-builder`, test d'installation sur un poste vierge | `export.service.js`, `package.json` (`build`), `release/` |

## Definition of Done par phase

Une phase n'est terminée que si :
- tous les services de la phase ont leur fichier de test (`node --test` vert) ;
- `rules-auditor` ne relève aucun constat **Bloquant** sur le diff complet de la phase ;
- les 3 hooks garde-fous ont été exercés au moins une fois pendant la phase (pas seulement
  testés en isolation lors du scaffold initial) ;
- pour la phase 4 uniquement : un exécutable généré par `npm run build` démarre sur une
  machine sans Node/npm installé, et les données saisies persistent après un redémarrage
  de l'app.
