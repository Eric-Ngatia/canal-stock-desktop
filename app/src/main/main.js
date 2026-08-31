const path = require('path');
const { app, BrowserWindow } = require('electron');
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

function creerFenetre() {
  const fenetre = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../../build/icon.png'),
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
