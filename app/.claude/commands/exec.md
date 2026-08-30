---
description: Exécuter le dernier plan approuvé
---

Lance l'étape d'**Exécution** avec l'agent `executor`.

Implémente strictement le plan approuvé le plus récent dans `.plans/`, étape par étape, en
cochant l'avancement. Écris les tests en même temps que le code. Respecte la frontière IPC
(aucun accès direct du renderer à SQLite). Si le plan est incomplet, arrête-toi et renvoie
vers `/plan`.
