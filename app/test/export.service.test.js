const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const Database = require('better-sqlite3');
const XLSX = require('xlsx');
const { setDbForTests } = require('../src/main/db/database');

function creerBaseAvecUnDecodeur() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const sql = fs.readFileSync(
    path.join(__dirname, '../src/main/db/migrations/0001_init.sql'),
    'utf-8'
  );
  db.exec(sql);
  db.prepare("INSERT INTO decodeurs (numero_serie, carton_code, statut) VALUES (?, ?, ?)").run(
    '24300000089804',
    'O3',
    'en_stock'
  );
  setDbForTests(db);
  return db;
}

test('RG-08: exporterExcel() produit un fichier lisible contenant les decodeurs', () => {
  creerBaseAvecUnDecodeur();
  delete require.cache[require.resolve('../src/main/services/export.service')];
  const exportService = require('../src/main/services/export.service');

  const dest = path.join(os.tmpdir(), `export-test-${Date.now()}.xlsx`);
  exportService.exporterExcel(dest);

  assert.ok(fs.existsSync(dest), "le fichier d'export doit exister");

  const workbook = XLSX.readFile(dest);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].numero_serie, '24300000089804');

  fs.unlinkSync(dest);
});

test('RG-08: copierSauvegarde() copie le fichier source vers un nouveau fichier horodate', () => {
  delete require.cache[require.resolve('../src/main/services/export.service')];
  const exportService = require('../src/main/services/export.service');

  const sourcePath = path.join(os.tmpdir(), `source-test-${Date.now()}.sqlite`);
  const destinationDir = os.tmpdir();
  fs.writeFileSync(sourcePath, 'contenu-sqlite-simule');

  const destination = exportService.copierSauvegarde(destinationDir, sourcePath);

  assert.ok(fs.existsSync(destination), 'le fichier de sauvegarde doit exister');
  assert.match(path.basename(destination), /^canal-stock-sauvegarde-.*\.sqlite$/);
  assert.equal(fs.readFileSync(destination, 'utf-8'), 'contenu-sqlite-simule');

  fs.unlinkSync(sourcePath);
  fs.unlinkSync(destination);
});

function creerFichierSqliteValide(cheminFichier, valeur) {
  const db = new Database(cheminFichier);
  db.exec('CREATE TABLE marqueur (valeur TEXT)');
  db.prepare('INSERT INTO marqueur (valeur) VALUES (?)').run(valeur);
  db.close();
}

test("RG-08: restaurerSauvegarde() remplace la base live et garde une copie de securite", () => {
  delete require.cache[require.resolve('../src/main/services/export.service')];
  const exportService = require('../src/main/services/export.service');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'restaure-test-'));
  const cheminSauvegarde = path.join(dir, 'sauvegarde-a-restaurer.sqlite');
  const destinationPath = path.join(dir, 'base-live.sqlite');

  creerFichierSqliteValide(cheminSauvegarde, 'contenu-sauvegarde');
  creerFichierSqliteValide(destinationPath, 'contenu-live-avant-restauration');

  const resultat = exportService.restaurerSauvegarde(cheminSauvegarde, { destinationPath });

  assert.ok(resultat.backupPrecedent, 'une copie de securite doit avoir ete creee');
  assert.ok(fs.existsSync(resultat.backupPrecedent));
  const dbSecours = new Database(resultat.backupPrecedent, { readonly: true });
  assert.equal(dbSecours.prepare('SELECT valeur FROM marqueur').get().valeur, 'contenu-live-avant-restauration');
  dbSecours.close();

  const dbRestauree = new Database(destinationPath, { readonly: true });
  assert.equal(dbRestauree.prepare('SELECT valeur FROM marqueur').get().valeur, 'contenu-sauvegarde');
  dbRestauree.close();

  fs.rmSync(dir, { recursive: true, force: true });
});

test('RG-08: restaurerSauvegarde() rejette un fichier qui n\'est pas une base SQLite valide, sans rien modifier', () => {
  delete require.cache[require.resolve('../src/main/services/export.service')];
  const exportService = require('../src/main/services/export.service');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'restaure-invalide-test-'));
  const cheminInvalide = path.join(dir, 'pas-une-base.sqlite');
  const destinationPath = path.join(dir, 'base-live.sqlite');

  fs.writeFileSync(cheminInvalide, 'ceci n\'est pas du sqlite');
  creerFichierSqliteValide(destinationPath, 'contenu-live-intact');

  assert.throws(() => exportService.restaurerSauvegarde(cheminInvalide, { destinationPath }), /valide|corrompu/i);

  const dbLive = new Database(destinationPath, { readonly: true });
  assert.equal(dbLive.prepare('SELECT valeur FROM marqueur').get().valeur, 'contenu-live-intact');
  dbLive.close();

  fs.rmSync(dir, { recursive: true, force: true });
});

test('RG-08: sauvegardeAutomatique() ne copie qu\'une fois par intervalle', () => {
  delete require.cache[require.resolve('../src/main/services/export.service')];
  const exportService = require('../src/main/services/export.service');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-test-'));
  const sourcePath = path.join(dir, 'base-live.sqlite');
  const destinationDir = path.join(dir, 'sauvegardes-auto');
  creerFichierSqliteValide(sourcePath, 'contenu');

  const premier = exportService.sauvegardeAutomatique({ sourcePath, destinationDir, intervalleMs: 24 * 60 * 60 * 1000 });
  assert.equal(premier.effectuee, true);
  assert.equal(fs.readdirSync(destinationDir).length, 1);

  const second = exportService.sauvegardeAutomatique({ sourcePath, destinationDir, intervalleMs: 24 * 60 * 60 * 1000 });
  assert.equal(second.effectuee, false);
  assert.equal(fs.readdirSync(destinationDir).length, 1);

  fs.rmSync(dir, { recursive: true, force: true });
});

test('RG-08: sauvegardeAutomatique() applique la retention (garde les N plus recentes)', () => {
  delete require.cache[require.resolve('../src/main/services/export.service')];
  const exportService = require('../src/main/services/export.service');

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-retention-test-'));
  const sourcePath = path.join(dir, 'base-live.sqlite');
  const destinationDir = path.join(dir, 'sauvegardes-auto');
  fs.mkdirSync(destinationDir, { recursive: true });
  creerFichierSqliteValide(sourcePath, 'contenu');

  for (let i = 0; i < 9; i += 1) {
    const chemin = path.join(destinationDir, `canal-stock-sauvegarde-auto-anciennete-${i}.sqlite`);
    fs.writeFileSync(chemin, `sauvegarde-${i}`);
    fs.utimesSync(chemin, new Date(Date.now() - (9 - i) * 60 * 60 * 1000), new Date(Date.now() - (9 - i) * 60 * 60 * 1000));
  }

  const resultat = exportService.sauvegardeAutomatique({ sourcePath, destinationDir, retention: 7, intervalleMs: 0 });

  assert.equal(resultat.effectuee, true);
  assert.equal(fs.readdirSync(destinationDir).length, 7);

  fs.rmSync(dir, { recursive: true, force: true });
});
