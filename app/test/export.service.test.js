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
