# canal-stock-desktop

Gestion de stock et de vente de décodeurs/paraboles Canal+ — application desktop **Electron**,
**100% hors ligne**, données stockées localement (SQLite). Voir `ARCHITECTURE.md` pour le
raisonnement complet, `docs/adr/` pour les décisions techniques, `docs/cahier-des-charges.md`
pour la spec fonctionnelle source.

## Démarrage en 3 commandes

```bash
cd app
npm install
npm test        # 14 tests doivent passer
npm run dev     # lance Vite (renderer) + Electron ensemble
```

## Vérifier la configuration Claude Code

Une fois le dépôt ouvert dans Claude Code, avant de commencer à développer :

```
/doctor    # doublons de noms d'agents, coût du listing de skills
/hooks     # confirme que les 3 hooks garde-fous sont bien enregistrés
/context   # ce que consomment CLAUDE.md, les skills, les MCP
/agents    # les 6 agents chargés et leur portée
```

## Workflow de développement

Toute tâche passe par le cycle **Planification → Exécution → Révision** :

```
/task "Ajouter le bouton d'export Excel sur le dashboard"
```

Ou étape par étape : `/plan <tâche>` → approbation humaine → `/exec` → `/review`.

Voir `.claude/skills/task-workflow/SKILL.md` pour le détail, et `.claude/docs/phases.md` pour
le découpage en 5 phases (Socle Electron → Dashboard+Stock → Vente&Activation+Import →
Apporteurs+Objectifs → Export&Packaging).

## Build de l'exécutable

```bash
cd app
npm run build    # build renderer (Vite) puis packaging electron-builder
# produit release/ (nsis pour Windows, dmg pour macOS, AppImage pour Linux)
```
