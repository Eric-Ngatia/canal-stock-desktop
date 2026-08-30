# Modèle de données — canal-stock-desktop

Schéma SQLite complet dans `src/main/db/migrations/0001_init.sql`. Résumé ici pour référence
rapide — le fichier SQL fait foi en cas d'écart.

## Tables

### `cartons`
Un carton/lot de décodeurs reçu du siège.
| Colonne | Type | Note |
|---|---|---|
| id | INTEGER PK | |
| code | TEXT UNIQUE | ex: O3, U5, U21 |
| date_reception | TEXT | ISO 8601 |
| notes | TEXT | |

### `decodeurs`
Table centrale — un décodeur = une ligne, du stock à l'activation.
| Colonne | Type | Note |
|---|---|---|
| id | INTEGER PK | |
| numero_serie | TEXT UNIQUE NOT NULL | RG-01 |
| carton_id / carton_code | FK / TEXT | dénormalisé pour affichage |
| date_livraison | TEXT | |
| statut | TEXT CHECK | `en_stock`\|`vendu`\|`active` — RG-05 |
| date_vente, type_vente, apporteur | | RG-02 |
| commission_due, commission_payee | INTEGER | RG-03 |
| date_activation, source_activation | | RG-04 |
| destinataire | TEXT | client final si connu |

### `apporteurs`
Liste officielle des apporteurs d'affaires (nom, téléphone). Un décodeur peut référencer un
nom d'apporteur qui n'existe pas (encore) dans cette table — géré côté service
(`nonReference: true` dans la réponse de `apporteurs.service.js:lister()`).

### `objectifs`
Un objectif = (mois, année, cible), `UNIQUE(mois, annee)` — RG-06.

### `imports`
Historique de chaque import de rapport Canal+ — RG-04, traçabilité.

## Relations

```
cartons (1) ──< decodeurs (N)      -- via carton_id (nullable, dénormalisé en carton_code)
apporteurs.nom ~ decodeurs.apporteur -- lien logique par nom, pas de FK stricte
                                        (permet un apporteur "texte libre" non encore enregistré)
```

## Pourquoi pas de FK stricte apporteurs → decodeurs

Un responsable doit pouvoir enregistrer une vente avec le nom d'un nouvel apporteur avant
d'avoir pris le temps de créer sa fiche officielle (page Apporteurs). Une FK stricte
bloquerait cette saisie rapide. Le rapprochement se fait par nom en lecture
(`apporteurs.service.js`), pas par contrainte d'intégrité en écriture — décision assumée,
documentée ici pour qu'elle ne soit pas « corrigée » par erreur en ajoutant une FK plus tard.
