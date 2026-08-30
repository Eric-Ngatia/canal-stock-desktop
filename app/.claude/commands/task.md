---
description: Cycle complet Planification → Exécution → Révision pour une tâche
argument-hint: <description de la tâche>
---

Exécute le cycle complet canal-stock-desktop pour : $ARGUMENTS

1. **Planification** — agent `planner` : écris le plan dans `.plans/` puis **STOP** et demande
   mon approbation. N'enchaîne pas sans mon feu vert.
2. **Exécution** — après approbation, agent `executor` : implémente le plan + tests.
3. **Révision** — agents `reviewer` et `rules-auditor` : vérifie, teste, rends le verdict.

Respecte le gate d'approbation entre l'étape 1 et l'étape 2. C'est le seul point où une
mauvaise compréhension du besoin peut encore être arrêtée à faible coût.
