const path = require('path');
const { app, BrowserWindow } = require('electron');
require('dotenv').config();

const { enregistrerHandlers } = require('./ipc/handlers');
const { getDb } = require('./db/database');

const isDev = !app.isPackaged;

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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
