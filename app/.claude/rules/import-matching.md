---
description: Logique de rapprochement du rapport d'activation Canal+ (RG-04). Chargée près du code qui l'implémente.
paths:
  - "src/main/services/import.service.js"
  - "test/import.service.test.js"
---

# Rapprochement de l'import Canal+ — RG-04

- Le format exact du rapport Canal+ n'est **pas garanti** (colonnes variables selon les envois).
  `SERIAL_REGEX` (`/\b\d{8,16}\b/g`) scanne donc **toutes** les cellules de la première feuille,
  sans présumer d'une colonne fixe.
- Un numéro détecté et présent dans `decodeurs` bascule en `active`. Un numéro détecté mais
  absent de la base **n'est jamais inséré** — l'import ne crée jamais de décodeur.
- Idempotence obligatoire : si un numéro est déjà `active`, le réimporter (même fichier ou
  fichier différent) ne modifie ni `date_activation` ni `source_activation`. Vérifier
  `row.statut !== 'active'` avant tout `UPDATE`.
- Chaque appel à `importer()` doit insérer une ligne dans `imports`, **même si**
  `nb_actives = 0` — un import qui n'a rien trouvé doit rester traçable, sinon le responsable
  ne peut pas distinguer « je n'ai pas encore importé » de « j'ai importé un fichier vide de
  correspondances ».

## Le piège silencieux

Resserrer `SERIAL_REGEX` (ex. exiger exactement 12 chiffres) sans revoir les fichiers Canal+
réels peut faire disparaître silencieusement des numéros valides du lot détecté — l'import
réussira quand même, juste avec moins de décodeurs activés que prévu, sans erreur visible.
Toute modification de la regex doit être justifiée par un exemple de fichier réel testé, pas
par une supposition sur le format.

## Obligation de test

`test/import.service.test.js` doit couvrir, sur une base `:memory:` pré-remplie :
1. un numéro présent en base et présent dans le fichier → passe en `active` ;
2. un numéro présent dans le fichier mais absent de la base → aucune ligne créée ;
3. un numéro déjà `active` réimporté → `date_activation` inchangée (test d'idempotence) ;
4. un fichier sans aucune correspondance → une ligne quand même créée dans `imports`,
   `nb_trouves = 0`.
