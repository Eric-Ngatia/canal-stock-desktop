# Spécification fonctionnelle — App Gestion Stock & Vente Décodeurs Canal+

## 1. Contexte
Application web (MERN) permettant à un responsable de zone de gérer la réception, la vente et
le suivi d'activation de décodeurs/paraboles Canal+, avec un réseau de vente mixte (équipe
interne + apporteurs d'affaires) et un suivi d'objectifs fixés par le siège.

## 2. Stack technique

**Application desktop Electron**, pour un usage **entièrement hors ligne** — toutes les données
restent stockées localement sur le PC du responsable, sans dépendance à une connexion internet.

- **Electron** : conteneur applicatif, packagé en exécutable installable (`.exe` / `.dmg` via
  electron-builder)
- **React + Vite** : interface, rendue dans la fenêtre Electron (reprend le design validé avec
  Claude Design)
- **SQLite** (base de données locale, fichier unique) en remplacement de MongoDB — plus adapté à
  un usage embarqué sans serveur réseau
- **Logique métier** intégrée au processus principal Electron (pas d'API HTTP séparée nécessaire)
- **Lecture des fichiers Import Excel/CSV** : accès direct au système de fichiers local (plus
  simple qu'un upload web)

**Conséquences à anticiper :**
- Prévoir une fonctionnalité d'**export/sauvegarde des données** (copie du fichier local ou export
  Excel) puisqu'il n'y a plus de base distante — en cas de problème sur le PC, les données non
  sauvegardées seraient perdues.
- Usage **mono-poste** confirmé : pas de synchronisation multi-appareils à prévoir en V1.

## 3. Utilisateurs
- **V1 : un seul utilisateur (le responsable), pas d'authentification multi-rôle.**
- Les apporteurs d'affaires n'ont pas d'accès à l'appli ; ils sont uniquement référencés comme
  données (nom, coordonnées, commissions).

## 4. Entités principales

| Entité | Champs clés |
|---|---|
| **Carton** | code (ex: O3, U5, U21), date de réception, notes |
| **Décodeur** | numéro de série (unique), carton d'origine, date de livraison, statut (`en_stock` / `vendu` / `activé`), date de vente, type de vente (équipe/apporteur), apporteur, commission due, date d'activation, source d'activation (manuel/import), destinataire/client |
| **Apporteur** | nom, téléphone, notes, ventes totales (calculé), commissions dues/payées (calculé) |
| **Objectif** | mois, année, cible (nombre de décodeurs) |
| **Import** (historique) | nom du fichier, date, nb lignes, nb décodeurs trouvés/activés, nb non reconnus, liste des non reconnus |

## 5. Fonctionnalités par module

### 5.1 Gestion du stock
- Ajouter un lot de décodeurs (réception d'un carton) : coller une liste de numéros de série
  (un par ligne), associer un code carton et une date de livraison.
- Lister tous les décodeurs avec filtres : par statut, par carton, recherche par numéro de série.
- Table façon Excel avec **code couleur automatique par statut** :
  - Blanc/neutre = en stock
  - Orange = vendu, en attente d'activation
  - Vert = activé
- Colonnes affichées : N° carton, N° décodeur, date livraison, statut, date vente, apporteur/vendeur,
  date activation, destinataire.
- Suppression/correction d'un décodeur (erreur de saisie).

### 5.2 Vente (manuelle, en masse)
- Formulaire : coller une liste de numéros de série à marquer "vendu".
- Choix du type de vente : équipe interne ou apporteur d'affaires.
- Si apporteur : champ avec **autocomplétion** suggérant les apporteurs déjà enregistrés, tout
  en acceptant un nom libre non enregistré au préalable.
- Date de vente (par défaut aujourd'hui, modifiable).
- Champ optionnel : destinataire/client final.
- Calcul automatique de la commission (1500F/décodeur si vente via apporteur), configurable.

### 5.3 Activation
- **Import automatique** : upload d'un fichier Excel/CSV (rapport Canal+, format non fixé/variable).
  Le système scanne toutes les colonnes du fichier à la recherche de numéros ressemblant à des
  numéros de série, les compare à la base, et bascule en "activé" tous les numéros trouvés.
  Résumé après import : nb détectés, nb activés, nb non reconnus (avec liste consultable).
- **Saisie manuelle** : coller une liste de numéros de série à marquer "activé" directement,
  sans passer par un fichier, avec date d'activation.
- Historique des imports consultable (date, fichier, résultats).

### 5.4 Apporteurs d'affaires
- Liste des apporteurs enregistrés (nom, téléphone).
- Ajout/suppression d'un apporteur.
- Pour chaque apporteur : nombre de ventes, nombre d'activés parmi ses ventes, total des
  commissions dues (calculé automatiquement à partir des décodeurs vendus).
- Les apporteurs "texte libre" utilisés lors d'une vente mais non enregistrés dans la liste
  officielle apparaissent quand même dans le suivi (marqués "non enregistré").

### 5.5 Objectifs & suivi de performance
- **Objectif mensuel global** (fixé par le siège) : cible en nombre de décodeurs vendus.
- Calcul automatique du réalisé du mois en cours et du taux d'atteinte (%).
- *(Point ouvert — voir section 7)* : possibilité d'objectifs détaillés par point de vente (PDV)
  et par groupe (ex: VAD / Boutiques / Direct), avec taux de réalisation individuel, taux de
  réalisation global (contribution au total), et reste à faire — sur le modèle d'un rapport de
  performance hebdomadaire/mensuel par réseau.

### 5.6 Dashboard (écran d'accueil)
- Vue synthétique : total décodeurs, répartition en_stock/vendu/activé.
- Progression de l'objectif du mois (barre de progression + %).
- Commissions dues aux apporteurs (total + déjà payées).
- Top apporteurs du mois.
- Répartition par carton (tableau récapitulatif).

## 6. Workflow à l'ouverture de l'application

1. **Écran d'accueil = Dashboard.** Le responsable voit immédiatement, sans action requise :
   - où en est l'objectif du mois (progression visuelle claire, alerte si en retard) ;
   - la répartition actuelle du parc (combien en stock / vendus / activés) ;
   - les commissions à payer aux apporteurs ;
   - un aperçu des cartons en cours.
2. **Actions rapides depuis le dashboard** (raccourcis attendus) :
   - Importer le dernier rapport Canal+ (activation).
   - Saisir une vente ou une activation manuelle.
   - Ajouter un nouveau carton reçu.
3. **Navigation secondaire** (menu latéral) vers les vues détaillées : Stock complet, Vente &
   Activation, Import, Apporteurs, Objectifs.
4. **Fréquence d'usage typique** :
   - À la réception d'un carton → ajout du stock.
   - Au fil des ventes (quotidien) → saisie manuelle des numéros vendus + apporteur.
   - À réception du rapport Canal+ (périodique, ex: hebdo) → import pour mise à jour des
     activations.
   - Suivi continu de l'objectif via le dashboard.

## 7. Points encore à trancher avant/pendant le développement (Objectifs détaillés par PDV)

Ces questions n'ont pas encore de réponse ferme et impactent le modèle de données :

1. **Qu'est-ce qu'un "PDV" chez vous ?** — un apporteur individuel, une boutique/agence physique
   distincte des apporteurs, un carton, ou autre chose ?
2. **Le "Réalisé" du rapport de performance correspond à quoi ?** — décodeurs vendus, décodeurs
   activés uniquement, ou un indicateur différent (recrutement/abonnements) pas forcément lié
   1 pour 1 aux décodeurs ?
3. **Structure réseau/groupes (ex: ANASAT → VAD/Boutiques/DA)** : fixe pour l'instant, ou doit
   être configurable (création libre de réseaux/groupes/PDV) ?
4. **Cette vue détaillée remplace-t-elle la page Objectifs actuelle ou s'ajoute-t-elle en plus ?**

Tant que ces points ne sont pas tranchés, le module Objectifs peut être développé dans sa version
simple (objectif global mensuel, section 5.5 première partie) et étendu ensuite.
