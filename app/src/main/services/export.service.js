const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Database = require('better-sqlite3');
const { getDb, fermerDb } = require('../db/database');

/**
 * Service export — propriétaire de RG-08.
 * L'utilisateur doit toujours pouvoir récupérer ses données sans dépendre d'un tiers :
 * copie brute du fichier SQLite, export Excel lisible, restauration d'une sauvegarde
 * antérieure, et sauvegarde automatique locale avec rétention.
 *
 * `electron` n'est requis que paresseusement là où c'est nécessaire, pour que les fonctions
 * qui n'en ont pas besoin restent testables en node --test pur (même contrainte que
 * `database.js`/`setDbForTests()`).
 */

const PREFIXE_SAUVEGARDE_MANUELLE = 'canal-stock-sauvegarde-';
const PREFIXE_SAUVEGARDE_AUTO = 'canal-stock-sauvegarde-auto-';
const DOSSIER_SAUVEGARDES_AUTO = 'sauvegardes-auto';
const DOSSIER_AVANT_RESTAURATION = 'avant-restauration';
const RETENTION_SAUVEGARDES_AUTO_PAR_DEFAUT = 7;
const INTERVALLE_SAUVEGARDE_AUTO_MS_PAR_DEFAUT = 24 * 60 * 60 * 1000;

/**
 * Résout le chemin du fichier SQLite « live » de l'app. Réservé en interne aux fonctions
 * de ce fichier ; `sourcePath` explicite réservé aux tests.
 */
function resoudreCheminBaseLive(sourcePath) {
  if (sourcePath) return sourcePath;
  const { app } = require('electron');
  const userDataPath = app.getPath('userData');
  const dbFilename = process.env.DB_FILENAME || 'canal-stock.sqlite';
  return path.join(userDataPath, dbFilename);
}

function horodatage() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/**
 * `sourcePath` est optionnel et réservé aux tests : en production, `ipc/handlers.js` appelle
 * toujours cette fonction avec un seul argument, et le chemin réel est résolu ci-dessous via
 * Electron.
 */
function copierSauvegarde(destinationDir, sourcePath) {
  const source = resoudreCheminBaseLive(sourcePath);
  const destination = path.join(
    destinationDir,
    `${PREFIXE_SAUVEGARDE_MANUELLE}${horodatage()}.sqlite`
  );

  fs.copyFileSync(source, destination);
  return destination;
}

function exporterExcel(destinationPath) {
  const db = getDb();
  const decodeurs = db.prepare('SELECT * FROM decodeurs ORDER BY carton_code, numero_serie').all();

  const worksheet = XLSX.utils.json_to_sheet(decodeurs);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Décodeurs');
  XLSX.writeFile(workbook, destinationPath);

  return destinationPath;
}

/**
 * Vérifie qu'un fichier est bien une base SQLite lisible et non corrompue, via une instance
 * `better-sqlite3` indépendante (lecture seule, immédiatement refermée). Ne touche jamais à
 * la base live.
 */
function verifierIntegriteSqlite(cheminFichier) {
  let dbTest;
  try {
    dbTest = new Database(cheminFichier, { readonly: true });
    const resultat = dbTest.pragma('integrity_check', { simple: true });
    return resultat === 'ok';
  } catch {
    return false;
  } finally {
    if (dbTest) dbTest.close();
  }
}

/**
 * Restaure une sauvegarde `.sqlite` en remplaçant la base live, avec deux garde-fous :
 *  1. vérification d'intégrité du fichier à restaurer avant toute écriture ;
 *  2. copie de sécurité de la base live actuelle avant de l'écraser.
 *
 * Ferme le handle SQLite ouvert (`fermerDb()`) avant l'écrasement : sous Windows,
 * `better-sqlite3` garde sinon le fichier verrouillé et `copyFileSync` échoue (EBUSY/EPERM).
 * L'appelant (handler IPC) doit relancer l'app après un succès pour que `getDb()` réouvre le
 * fichier fraîchement restauré.
 *
 * `options.destinationPath` est réservé aux tests (chemin de la base live simulée).
 */
function restaurerSauvegarde(cheminSauvegarde, options = {}) {
  if (!fs.existsSync(cheminSauvegarde)) {
    throw new Error(`Fichier de sauvegarde introuvable : ${cheminSauvegarde}`);
  }
  if (!verifierIntegriteSqlite(cheminSauvegarde)) {
    throw new Error("Le fichier sélectionné n'est pas une base SQLite valide ou est corrompu.");
  }

  const destinationPath = resoudreCheminBaseLive(options.destinationPath);

  let backupPrecedent = null;
  if (fs.existsSync(destinationPath)) {
    const dossierAvantRestauration = path.join(
      path.dirname(destinationPath),
      DOSSIER_AVANT_RESTAURATION
    );
    fs.mkdirSync(dossierAvantRestauration, { recursive: true });
    backupPrecedent = path.join(
      dossierAvantRestauration,
      `canal-stock-avant-restauration-${horodatage()}.sqlite`
    );
    fs.copyFileSync(destinationPath, backupPrecedent);
  }

  fermerDb();
  fs.copyFileSync(cheminSauvegarde, destinationPath);

  return { backupPrecedent, restaure: destinationPath };
}

/**
 * Sauvegarde automatique locale, silencieuse et sans risque pour le démarrage de l'app :
 * ne copie qu'une fois par `intervalleMs` (24h par défaut) et applique une rétention (garde
 * les `retention` sauvegardes les plus récentes, supprime le reste). Ne lève jamais
 * d'exception — toute erreur est renvoyée dans le résultat pour ne jamais empêcher le
 * démarrage de l'app.
 *
 * `options.destinationDir`/`options.sourcePath` réservés aux tests.
 */
function sauvegardeAutomatique(options = {}) {
  const {
    retention = RETENTION_SAUVEGARDES_AUTO_PAR_DEFAUT,
    intervalleMs = INTERVALLE_SAUVEGARDE_AUTO_MS_PAR_DEFAUT,
  } = options;

  try {
    const source = resoudreCheminBaseLive(options.sourcePath);
    if (!fs.existsSync(source)) {
      return { effectuee: false, erreur: null };
    }

    const destinationDir =
      options.destinationDir || path.join(path.dirname(source), DOSSIER_SAUVEGARDES_AUTO);
    fs.mkdirSync(destinationDir, { recursive: true });

    const existantes = fs
      .readdirSync(destinationDir)
      .filter((f) => f.startsWith(PREFIXE_SAUVEGARDE_AUTO) && f.endsWith('.sqlite'))
      .map((f) => ({ nom: f, chemin: path.join(destinationDir, f), mtime: fs.statSync(path.join(destinationDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    const derniere = existantes[0];
    const doitCopier = !derniere || Date.now() - derniere.mtime >= intervalleMs;

    let chemin = null;
    if (doitCopier) {
      chemin = path.join(destinationDir, `${PREFIXE_SAUVEGARDE_AUTO}${horodatage()}.sqlite`);
      fs.copyFileSync(source, chemin);
      existantes.unshift({ nom: path.basename(chemin), chemin, mtime: Date.now() });
    }

    for (const ancienne of existantes.slice(retention)) {
      fs.unlinkSync(ancienne.chemin);
    }

    return { effectuee: doitCopier, chemin };
  } catch (erreur) {
    return { effectuee: false, erreur: erreur.message };
  }
}

module.exports = {
  copierSauvegarde,
  exporterExcel,
  restaurerSauvegarde,
  sauvegardeAutomatique,
};
