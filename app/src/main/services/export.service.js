const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { getDb } = require('../db/database');

/**
 * Service export — propriétaire de RG-08.
 * L'utilisateur doit toujours pouvoir récupérer ses données sans dépendre d'un tiers :
 * copie brute du fichier SQLite, ou export Excel lisible.
 *
 * `electron` n'est requis que paresseusement dans copierSauvegarde(), pour que
 * exporterExcel() (qui n'en a pas besoin) reste testable en node --test pur.
 */
/**
 * `sourcePath` est optionnel et réservé aux tests : en production, `ipc/handlers.js` appelle
 * toujours cette fonction avec un seul argument, et le chemin réel est résolu ci-dessous via
 * Electron. Sans ça, `copierSauvegarde()` ne serait pas testable hors runtime Electron (même
 * contrainte que `database.js`/`setDbForTests()`).
 */
function copierSauvegarde(destinationDir, sourcePath) {
  if (!sourcePath) {
    // eslint-disable-next-line global-require
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    const dbFilename = process.env.DB_FILENAME || 'canal-stock.sqlite';
    sourcePath = path.join(userDataPath, dbFilename);
  }

  const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = path.join(destinationDir, `canal-stock-sauvegarde-${horodatage}.sqlite`);

  fs.copyFileSync(sourcePath, destination);
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

module.exports = { copierSauvegarde, exporterExcel };
