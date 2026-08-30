const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');
const XLSX = require('xlsx');
const { setDbForTests } = require('../src/main/db/database');

function creerBaseAvecDecodeurs(rows) {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const migrationsDir = path.join(__dirname, '../src/main/db/migrations');
  for (const file of fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(fs.readFileSync(path.join(migrationsDir, file), 'utf-8'));
  }
  const insert = db.prepare('INSERT INTO decodeurs (numero_serie, statut) VALUES (?, ?)');
  for (const [numeroSerie, statut] of rows) insert.run(numeroSerie, statut || 'en_stock');
  setDbForTests(db);
  return db;
}

function chargerImportService() {
  delete require.cache[require.resolve('../src/main/services/import.service')];
  return require('../src/main/services/import.service');
}

function classeurBuffer(numeros) {
  const worksheet = XLSX.utils.aoa_to_sheet([['Numero decodeur'], ...numeros.map((n) => [n])]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Activations');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

test('RG-04: numero present en base ET dans le fichier passe en active', () => {
  const db = creerBaseAvecDecodeurs([['24510284163959', 'vendu']]);
  const importService = chargerImportService();

  const buffer = classeurBuffer(['24510284163959']);
  const res = importService.importer({ buffer, nomFichier: 'rapport-test.xlsx' });

  assert.equal(res.nbActives, 1);
  const row = db.prepare('SELECT statut FROM decodeurs WHERE numero_serie = ?').get('24510284163959');
  assert.equal(row.statut, 'active');
});

test('RG-04: numero present dans le fichier mais absent de la base ne cree rien', () => {
  const db = creerBaseAvecDecodeurs([]);
  const importService = chargerImportService();

  const buffer = classeurBuffer(['99999999999999']);
  const res = importService.importer({ buffer, nomFichier: 'rapport-test.xlsx' });

  assert.equal(res.nbActives, 0);
  assert.deepEqual(res.numerosNonTrouves, ['99999999999999']);
  const total = db.prepare('SELECT COUNT(*) AS n FROM decodeurs').get().n;
  assert.equal(total, 0, 'aucun decodeur ne doit avoir ete cree');
});

test('RG-04: idempotence - reimporter un numero deja active ne modifie rien', () => {
  const db = creerBaseAvecDecodeurs([['24510281903031', 'active']]);
  const importService = chargerImportService();

  const avant = db.prepare('SELECT date_activation, source_activation FROM decodeurs WHERE numero_serie = ?').get('24510281903031');

  const buffer = classeurBuffer(['24510281903031']);
  const res = importService.importer({ buffer, nomFichier: 'rapport-reimport.xlsx' });

  const apres = db.prepare('SELECT date_activation, source_activation FROM decodeurs WHERE numero_serie = ?').get('24510281903031');

  assert.equal(res.nbTrouvesEnBase, 1); // trouvé, mais pas re-activé
  assert.deepEqual(avant, apres, 'idempotence violee : date_activation ou source_activation modifiee');
});

test("RG-04: un import sans aucune correspondance reste trace dans l'historique", () => {
  const db = creerBaseAvecDecodeurs([]);
  const importService = chargerImportService();

  const buffer = classeurBuffer(['11112222333344']); // absent de la base
  importService.importer({ buffer, nomFichier: 'rapport-vide.xlsx' });

  const row = db.prepare('SELECT * FROM imports WHERE nom_fichier = ?').get('rapport-vide.xlsx');
  assert.ok(row, "l'import doit laisser une ligne dans imports même sans correspondance");
  assert.equal(row.nb_trouves, 0);
});

test('nb_actives stocke le nombre reellement active par CET import, distinct de nb_trouves', () => {
  // Un numero deja "active" avant cet import (idempotent, ne compte pas dans nb_actives)
  // et un numero "vendu" qui, lui, bascule reellement en "active" par cet import.
  const db = creerBaseAvecDecodeurs([
    ['24510281903031', 'active'],
    ['24510284163959', 'vendu'],
  ]);
  const importService = chargerImportService();

  const buffer = classeurBuffer(['24510281903031', '24510284163959']);
  const res = importService.importer({ buffer, nomFichier: 'rapport-mixte.xlsx' });

  assert.equal(res.nbTrouvesEnBase, 2); // les deux sont connus en base
  assert.equal(res.nbActives, 1); // un seul reellement active par CET import

  const row = db.prepare('SELECT * FROM imports WHERE nom_fichier = ?').get('rapport-mixte.xlsx');
  assert.equal(row.nb_trouves, 2);
  assert.equal(row.nb_actives, 1, 'nb_actives ne doit pas etre confondu avec nb_trouves');
});
