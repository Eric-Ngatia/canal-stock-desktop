---
name: verify
description: Comment lancer et piloter réellement canal-stock-desktop (Electron) pour vérifier un changement visuel/UI, sans Playwright ni Puppeteer installés.
---

# Vérifier un changement UI dans canal-stock-desktop

L'app est Electron + Vite (renderer) + SQLite. Pas de Playwright/Puppeteer dans les
dépendances — on pilote directement via le protocole CDP (Chrome DevTools Protocol) exposé
par Electron, avec le `WebSocket` natif de Node (22+).

## 1. Piège n°1 : l'ABI native better-sqlite3

`npm test` reconstruit `better-sqlite3` pour l'ABI **Node**. Lancer Electron juste après
plante au démarrage (`NODE_MODULE_VERSION` mismatch, `dlopen` error dans les logs). Avant de
lancer l'app :

```
npx electron-rebuild -f -w better-sqlite3
```

## 2. Piège n°2 : instances Electron fantômes

Un `npm run dev` ou un lancement précédent mal fermé laisse des process `electron.exe` actifs
qui verrouillent `better_sqlite3.node` (le rebuild échoue avec `EBUSY`/`EPERM`) ou squattent
le port de debug CDP choisi. Vérifier et nettoyer avant de commencer :

```powershell
Get-Process | Where-Object { $_.ProcessName -match 'electron' } | Select-Object Id,ProcessName
Get-Process | Where-Object { $_.ProcessName -match 'electron' } | Stop-Process -Force
```

(Confirmer avec l'utilisateur avant de tuer des process s'il est possible qu'il ait l'app
ouverte pour de vrai — pas de perte de données, tout est en SQLite sur disque, mais ça ferme
sa fenêtre.)

## 3. Lancer l'app avec CDP ouvert

Le script `dev` (`concurrently`) ne passe pas de flag CDP. Lancer les deux morceaux
séparément pour ajouter `--remote-debugging-port` :

```bash
# 1) Vite en arrière-plan
(npm run dev:renderer > /tmp/vite.log 2>&1 &)
sleep 3

# 2) Electron directement, avec un port de debug dédié (choisir un port pas déjà pris)
(./node_modules/.bin/electron . --remote-debugging-port=9444 --remote-allow-origins=* > /tmp/electron.log 2>&1 &)
sleep 4
curl -s http://localhost:9444/json   # liste les targets, chercher type:"page" avec l'URL localhost:5173
```

Si `/json` renvoie `[]` ou le port refuse la connexion : relire `/tmp/electron.log` (souvent
l'erreur ABI du point 1, ou le port déjà pris par une instance fantôme du point 2).

## 4. Piloter la page via WebSocket brut (pas de lib CDP)

Node a `fetch` et `WebSocket` en global depuis la 22. Un script jetable suffit :

```js
const target = (await (await fetch('http://localhost:9444/json')).json())
  .find(t => t.type === 'page' && t.url.startsWith('http://localhost:5173'));
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
// Runtime.evaluate / Page.captureScreenshot / Page.reload via send(ws, method, params)
// (voir historique de session pour le helper `send`/`evaluate` complet)
```

Domaines utiles : `Page.enable`, `Runtime.enable`, `Runtime.evaluate` (avec
`returnByValue:true, awaitPromise:true`) pour cliquer/lire le DOM (`document.querySelector(...).click()`,
`location.hash = '#/stock'`), `Page.captureScreenshot` (PNG base64) pour les captures.

**Piège n°3** : ne jamais attendre la réponse d'un `Runtime.evaluate` qui déclenche lui-même
une navigation (`location.reload()`) — le contexte est détruit avant que CDP renvoie la
réponse, la promesse ne se résout jamais (timeout). Séparer : régler l'état sans navigation
via `Runtime.evaluate`, puis naviguer avec la vraie commande `Page.reload` (conçue pour
survivre à la navigation).

Toujours mettre un timeout côté client sur l'attente de réponse CDP (~8s) : une connexion qui
meurt silencieusement sinon bloque le script indéfiniment.

## 5. Nettoyage

Le script CDP est jetable (`.tmp-*.mjs`, `.tmp-screens/`) — à supprimer après usage, ne pas
committer. Retuer les process Electron de vérification à la fin, puis
`npx electron-rebuild -f -w better-sqlite3` avant de relancer `npm test` (sinon même piège
qu'au point 1, dans l'autre sens).
