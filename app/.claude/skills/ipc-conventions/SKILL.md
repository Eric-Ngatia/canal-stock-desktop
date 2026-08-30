---
name: ipc-conventions
description: Convention de nommage et de sécurité des canaux IPC entre le renderer et le processus principal Electron. Utiliser dès qu'un nouveau canal ipcMain.handle est ajouté ou modifié.
---

# Conventions IPC — canal-stock-desktop

## Nommage des canaux

Format : `canal:<domaine>:<action>`, verbe à l'infinitif ou substantif d'action, en français
pour rester cohérent avec le reste du code métier.

Exemples déjà en place : `canal:decodeurs:lister`, `canal:ventes:marquerVendus`,
`canal:import:fichier`, `canal:export:sauvegarde`.

Un nouveau domaine (ex. `canal:cartons:*`) est acceptable ; un canal qui ne suit pas ce format
(ex. `getData`, `doThing`) doit être renommé en revue.

## Sécurité (ADR 0002)

- `contextIsolation: true`, `nodeIntegration: false` sur toute `BrowserWindow` — non négociable.
- `preload.js` n'expose **jamais** de méthode générique (`invoke(channel, ...args)`). Chaque
  action métier a sa propre méthode explicite sur `window.api`, avec une signature fixe.
- Un handler `ipcMain.handle` ne contient **aucune logique métier** : il déballe les
  arguments, appelle **un seul** service, retourne le résultat. Si un handler grossit au point
  de contenir un `if`/`else` métier, cette logique appartient au service, pas au handler.
- Les dialogues fichier (`dialog.showOpenDialog`, `showSaveDialog`) restent dans
  `src/main/ipc/handlers.js` : c'est une API Electron, pas une règle métier, mais elle a
  besoin du contexte main process — ne pas tenter de l'appeler depuis le renderer.

## Erreurs

Un service qui lève une erreur (ex. `ventes.service.js` sur un type de vente invalide) laisse
l'erreur remonter telle quelle à travers le handler IPC. Electron sérialise l'erreur JS jusqu'au
renderer, où `try/catch` autour de l'appel de bridge la récupère normalement — ne pas
« avaler » l'erreur dans le handler pour retourner `null`, ce qui masquerait un rejet de
règle métier (ex. RG-02) comme si l'opération avait simplement échoué sans raison.
