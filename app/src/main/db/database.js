const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let db = null;

/**
 * Ouvre (ou crée) le fichier SQLite dans le dossier de données utilisateur d'Electron,
 * puis applique les migrations non encore jouées.
 * RG-07 : ceci est la seule dépendance disque de l'app — aucun appel réseau ici.
 *
 * `electron` n'est requis que paresseusement, ici, et jamais en haut du fichier : ça permet
 * aux tests de service (node --test, hors runtime Electron) d'appeler `setDbForTests()` et
 * d'utiliser ce module sans que `require('electron')` échoue au chargement.
 */
function getDb() {
  if (db) return db;

  const { app } = require('electron');
  const userDataPath = app.getPath('userData');
  const dbFilename = process.env.DB_FILENAME || 'canal-stock.sqlite';
  const dbPath = path.join(userDataPath, dbFilename);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);

  return db;
}

/**
 * Réservé aux tests : injecte une base déjà ouverte (typiquement `:memory:`) pour que
 * `getDb()` la retourne au lieu d'essayer d'ouvrir le fichier utilisateur via Electron.
 */
function setDbForTests(customDb) {
  db = customDb;
}

function runMigrations(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const applied = new Set(
    database.prepare('SELECT filename FROM _migrations').all().map((r) => r.filename)
  );

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // 0001_, 0002_... l'ordre alphabétique = l'ordre d'application

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    database.exec(sql);
    database.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(file);
    console.log(`Migration appliquée: ${file}`);
  }
}

module.exports = { getDb, setDbForTests };
