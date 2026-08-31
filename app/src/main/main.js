const path = require('path');
const { app, BrowserWindow, Menu } = require('electron');
require('dotenv').config();

const isDev = !app.isPackaged;

/**
 * Isole les données du mode développement de celles de l'app installée. Sans ça,
 * `app.getPath('userData')` résout au même dossier (`%APPDATA%\canal-stock-desktop\`) dans
 * les deux cas — Electron dérive ce chemin du champ `"name"` de `package.json`, identique
 * qu'on lance `electron .` en dev ou l'exécutable packagé — et toute donnée de test créée
 * en dev finit dans la base que l'app "production" relit. Doit être appelé avant tout
 * `getDb()`/`app.getPath('userData')`, donc avant les autres `require` qui en dépendent.
 */
if (isDev) {
  app.setPath('userData', path.join(app.getPath('appData'), 'canal-stock-desktop-dev'));
}

const { enregistrerHandlers } = require('./ipc/handlers');
const { getDb } = require('./db/database');
const exportService = require('./services/export.service');

/**
 * `build/` est un dossier de ressources de build pour electron-builder (icône de l'installeur,
 * etc.) — il n'est jamais inclus dans le paquet final (ni dans app.asar, ni copié à côté).
 * En dev, `__dirname` pointe dans le vrai dossier projet donc `../../build/icon.png` existe
 * réellement ; en production, ce chemin n'existe nulle part et `BrowserWindow({ icon })` échoue
 * silencieusement (l'icône par défaut d'Electron reste affichée). D'où la copie explicite via
 * `extraResources` dans package.json, lue ici via `process.resourcesPath` (hors asar).
 */
const cheminIcone = isDev
  ? path.join(__dirname, '../../build/icon.png')
  : path.join(process.resourcesPath, 'build', 'icon.png');

function creerFenetre() {
  const fenetre = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: cheminIcone,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // ADR 0002 : jamais nodeIntegration côté renderer
      nodeIntegration: false,
    },
  });

  if (isDev) {
    fenetre.loadURL('http://localhost:5173');
    fenetre.webContents.openDevTools();
  } else {
    fenetre.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // Sans ça, Electron affiche son menu par défaut (File/Edit/View/Window/Help) — y compris
  // des entrées "Reload"/"Toggle DevTools" que l'utilisateur final n'a aucune raison de voir.
  // L'app n'a pas de menu personnalisé à proposer, donc autant ne rien afficher.
  Menu.setApplicationMenu(null);

  getDb(); // ouvre le fichier SQLite + joue les migrations avant d'afficher l'UI
  enregistrerHandlers();
  creerFenetre();

  // Sauvegarde automatique locale (RG-08), best-effort : ne doit jamais retarder ni bloquer
  // le démarrage. Différée pour laisser l'UI s'afficher en premier ; toute erreur reste
  // interne à sauvegardeAutomatique() (elle ne lève jamais).
  setTimeout(() => {
    try {
      exportService.sauvegardeAutomatique();
    } catch (erreur) {
      console.error('Sauvegarde automatique : erreur inattendue', erreur);
    }
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
