---
description: Calcul de la commission apporteur (RG-03). Chargée près du code qui l'implémente.
paths:
  - "src/main/services/ventes.service.js"
  - "test/ventes.service.test.js"
---

# Calcul de la commission — RG-03

- Montant : `COMMISSION_APPORTEUR` (défaut 1500, configurable via variable d'environnement),
  appliqué **uniquement** si `typeVente === 'apporteur'`. `0` dans tous les autres cas.
- Le calcul a lieu **une seule fois**, au moment de `marquerVendus()`. Il n'est jamais
  recalculé à l'affichage (dashboard, page Apporteurs) : ces écrans font un `SUM(commission_due)`
  sur la valeur déjà stockée, ils ne réappliquent jamais la règle.
- Modifier le type de vente d'un décodeur déjà vendu (ex. correction d'une erreur de saisie)
  doit repasser par `marquerVendus()` pour que la commission soit recalculée cohéremment —
  ne jamais faire un `UPDATE` SQL direct sur `type_vente` sans repasser par le service.

## Le piège silencieux

Un composant React qui affiche `ventes * 1500` pour estimer une commission avant sauvegarde
(ex. aperçu dans le formulaire) est acceptable **en lecture seule d'aperçu**, mais ne doit
jamais être la valeur réellement persistée. Si un aperçu de ce type est ajouté côté UI,
le documenter explicitement comme « estimation, la valeur stockée vient du service » pour
qu'un futur agent ne le prenne pas pour la source de vérité.

## Obligation de test

`test/ventes.service.test.js` doit prouver, sur une base `:memory:` :
1. vente `typeVente: 'apporteur'` → `commission_due = COMMISSION_APPORTEUR` ;
2. vente `typeVente: 'equipe'` → `commission_due = 0` ;
3. vente `typeVente: 'apporteur'` sans `apporteur` renseigné → erreur levée, aucune écriture.
