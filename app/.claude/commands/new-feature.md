---
description: Scaffolder une nouvelle feature (dossiers + branche git)
argument-hint: <nom-feature>
---

Prépare le terrain pour la feature « $ARGUMENTS » :
1. Crée la branche `git checkout -b feat/$ARGUMENTS`.
2. Propose l'emplacement des fichiers selon l'architecture : service dans
   `src/main/services/` d'abord si la feature porte une règle métier, puis handler IPC,
   puis bridge, puis UI dans `src/renderer/`.
3. NE code pas encore : enchaîne sur `/plan $ARGUMENTS`.
