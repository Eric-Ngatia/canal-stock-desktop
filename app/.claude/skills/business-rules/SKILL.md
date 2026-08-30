---
name: business-rules
description: Les 8 règles métier non négociables de canal-stock-desktop (RG-01 à RG-08) et leur mode de vérification. À appliquer dès qu'il est question de vente, activation, import Canal+, commission, objectifs ou export de données.
user-invocable: false
---

# Règles métier canal-stock-desktop — source de vérité

> Ce skill est de la **connaissance**, pas une commande. Il est préchargé dans les agents
> via leur champ `skills:`. Ne pas y ajouter `disable-model-invocation: true` : cela
> empêcherait le préchargement.

- **RG-01** — **Numéro de série unique et obligatoire.** Un décodeur ne peut exister sans
  `numero_serie`, et deux décodeurs ne peuvent jamais partager le même numéro. Vérifié par la
  contrainte `UNIQUE` en base (`schema.sql`), pas seulement par une validation applicative.

- **RG-02** — **Champs obligatoires à la vente.** Date de vente et type de vente
  (`equipe`/`apporteur`) obligatoires pour passer un décodeur en statut `vendu`. Si
  `type_vente = apporteur`, le nom de l'apporteur est obligatoire.

- **RG-03** — **Calcul de la commission.** 1 500 F (configurable via `COMMISSION_APPORTEUR`)
  uniquement si `type_vente = apporteur`, sinon 0. Calculée **une seule fois**, dans
  `ventes.service.js` — jamais recalculée dans un handler IPC ou côté renderer.

- **RG-04** — **Rapprochement de l'import Canal+.** Un numéro de série détecté dans le fichier
  importé et présent en base bascule en `active` avec `date_activation` = maintenant. Un
  numéro absent de la base n'est **jamais créé automatiquement**. L'opération est
  **idempotente** : réimporter le même fichier, ou un fichier qui contient un numéro déjà
  activé, ne change rien pour ce numéro.

- **RG-05** — **Progression de statut strictement croissante.** `en_stock → vendu → active`,
  jamais l'inverse via l'UI ou l'import. Toute écriture de statut doit passer par
  `decodeursService.transitionAutorisee()` avant l'`UPDATE`.

- **RG-06** — **Un seul objectif actif par mois.** Contrainte `UNIQUE(mois, annee)` en base ;
  l'écriture applicative est un `upsert` (`ON CONFLICT DO UPDATE`), jamais un `INSERT` qui
  laisserait des doublons.

- **RG-07** — **Fonctionnement 100% hors ligne.** Aucun appel réseau requis pour les
  opérations courantes (CRUD, import, calculs, dashboard). Toute dépendance réseau future
  (synchronisation, sauvegarde cloud) doit rester optionnelle et clairement isolée dans un
  module dédié, jamais mêlée aux services existants.

- **RG-08** — **Données toujours exportables.** L'utilisateur doit pouvoir sauvegarder
  (copie du fichier SQLite) ou exporter (Excel) ses données à tout moment, sans dépendre
  d'un service tiers. Propriété de `export.service.js`.

## Où vit chaque règle

| Règle | Fichier propriétaire | Test |
|---|---|---|
| RG-01 | `src/main/db/migrations/0001_init.sql` (contrainte) + `decodeurs.service.js` | `test/decodeurs.service.test.js` |
| RG-02 | `src/main/services/ventes.service.js` | `test/ventes.service.test.js` |
| RG-03 | `src/main/services/ventes.service.js` | `test/ventes.service.test.js` |
| RG-04 | `src/main/services/import.service.js` | `test/import.service.test.js` |
| RG-05 | `src/main/services/decodeurs.service.js` (`transitionAutorisee`) | `test/decodeurs.service.test.js` |
| RG-06 | `src/main/services/objectifs.service.js` | `test/objectifs.service.test.js` |
| RG-07 | Architecture-level — aucun fichier dédié, contrôlé par `rules-auditor` (grep réseau) | — |
| RG-08 | `src/main/services/export.service.js` | `test/export.service.test.js` |

RG-02 et RG-05 sont volontairement vérifiées **deux fois** dans certains flux : une fois en
base (contraintes `CHECK`), une fois côté service (message d'erreur explicite avant d'atteindre
la base). C'est intentionnel — la contrainte base est le filet de sécurité final, le contrôle
service donne un message utile au lieu d'une erreur SQL brute. Ne pas « factoriser » en
supprimant l'un des deux.

En cas de conflit entre une demande et une règle métier, **signaler le conflit avant
d'écrire quoi que ce soit**.
