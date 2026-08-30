---
name: task-workflow
description: Discipline de travail Planification → Exécution → Révision pour canal-stock-desktop. Utiliser dès qu'une tâche de développement, un ajout de feature, un fix ou un refactor commence, avant d'écrire du code.
---

# Workflow obligatoire : Planification → Exécution → Révision

Toute tâche de développement suit ces trois étapes, dans l'ordre, sans exception.

## 1. Planification (avant tout code)

- Lancer `/plan <tâche>` (agent `planner`).
- Le plan est **écrit dans `.plans/<slug>.md`** — il survit au compactage du contexte en
  session longue, ce qu'un plan resté dans la conversation ne fait pas.
- Le plan liste : contexte, règles métier concernées (RG-01..08), fichiers touchés et leur
  ordre, étapes atomiques, tests, risques, Definition of Done.
- **Gate humain** : ne pas exécuter avant approbation explicite.

### Ce qu'est un plan acceptable

Chaque étape nomme un fichier, une action, et **comment on saura qu'elle est réussie**.
« Ajouter l'export Excel » n'est pas une étape. « Ajouter `exporterExcel()` dans
`export.service.js`, brancher le canal IPC `canal:export:excel`, tester avec une base
en mémoire contenant 3 décodeurs et vérifier que le fichier produit contient 3 lignes »
en est une.

Un plan sans critère d'acceptation vérifiable est incomplet : le reprendre, pas le livrer.

## 2. Exécution

- Lancer `/exec` (agent `executor`) seulement après approbation.
- Suivre le plan **strictement**, étape par étape, en cochant l'avancement.
- Écrire les tests **en même temps** que le code.
- Un manque dans le plan ⇒ retour au planner, jamais d'improvisation.

## 3. Révision

- Lancer `/review` : agents `reviewer` **et** `rules-auditor` en parallèle.
- Vérifier contre le plan ET les règles métier ; lancer `npm test`.
- Verdict : APPROUVÉ / APPROUVÉ AVEC RÉSERVES / REJETÉ.

## Pourquoi cette discipline

- Le projet a une frontière stricte (renderer ↔ main via IPC uniquement) qu'il est très facile
  de casser « pour aller plus vite » sur une fonctionnalité pressée — planifier d'abord force
  à nommer le canal IPC avant d'écrire le composant qui en aura besoin.
- Les règles RG-03 (commission) et RG-05 (progression de statut) se violent sans casser la
  compilation : un recalcul de commission ajouté par erreur dans un composant React tourne
  très bien, et donne un résultat visuellement correct — jusqu'à ce que la logique diverge
  de celle du service. La revue systématique est le seul filet contre ça.
- Sauver le plan sur disque = source de vérité stable pour une session longue.

## Raccourci

`/task <tâche>` enchaîne les trois étapes avec le gate d'approbation intégré entre Plan
et Exec.
