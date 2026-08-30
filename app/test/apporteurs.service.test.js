const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

// Meme patron que test/decodeurs.service.test.js : base en memoire, jamais le fichier reel.
function creerBaseTest() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const sql = fs.readFileSync(
    path.join(__dirname, '../src/main/db/migrations/0001_init.sql'),
    'utf-8'
  );
  db.exec(sql);
  return db;
}

test('lister() calcule ventes/commissions/actives par apporteur enregistre', () => {
  const { setDbForTests, getDb } = require('../src/main/db/database');
  const apporteursService = require('../src/main/services/apporteurs.service');

  setDbForTests(creerBaseTest());
  const db = getDb();

  apporteursService.ajouter({ nom: 'Jean Dupont', telephone: '0700000000' });
  db.prepare(
    `INSERT INTO decodeurs (numero_serie, statut, type_vente, apporteur, commission_due, commission_payee)
     VALUES (?, 'vendu', 'apporteur', 'Jean Dupont', 1500, 0)`
  ).run('SN1');
  db.prepare(
    `INSERT INTO decodeurs (numero_serie, statut, type_vente, apporteur, commission_due, commission_payee)
     VALUES (?, 'active', 'apporteur', 'Jean Dupont', 1500, 1)`
  ).run('SN2');

  const [jean] = apporteursService.lister();
  assert.equal(jean.nom, 'Jean Dupont');
  assert.equal(jean.totalVentes, 2);
  assert.equal(jean.totalActives, 1);
  assert.equal(jean.totalCommissions, 3000);
});

test('lister() marque "non enregistre" un apporteur texte-libre utilise a la vente mais absent de la liste officielle', () => {
  const { setDbForTests, getDb } = require('../src/main/db/database');
  const apporteursService = require('../src/main/services/apporteurs.service');

  setDbForTests(creerBaseTest());
  const db = getDb();
  db.prepare(
    `INSERT INTO decodeurs (numero_serie, statut, type_vente, apporteur, commission_due)
     VALUES (?, 'vendu', 'apporteur', 'Sans Nom SARL', 1500)`
  ).run('SN3');

  const [apporteur] = apporteursService.lister();
  assert.equal(apporteur.nom, 'Sans Nom SARL');
  assert.equal(apporteur.nonReference, true);
});

test('resumeCommissions() distingue le total du deja paye (colonne commission_payee)', () => {
  const { setDbForTests, getDb } = require('../src/main/db/database');
  const apporteursService = require('../src/main/services/apporteurs.service');

  setDbForTests(creerBaseTest());
  const db = getDb();
  db.prepare(
    `INSERT INTO decodeurs (numero_serie, statut, type_vente, apporteur, commission_due, commission_payee)
     VALUES (?, 'vendu', 'apporteur', 'Jean Dupont', 1500, 0)`
  ).run('SN1');
  db.prepare(
    `INSERT INTO decodeurs (numero_serie, statut, type_vente, apporteur, commission_due, commission_payee)
     VALUES (?, 'active', 'apporteur', 'Jean Dupont', 1500, 1)`
  ).run('SN2');
  // Vente equipe : ne doit pas compter dans les commissions dues aux apporteurs.
  db.prepare(
    `INSERT INTO decodeurs (numero_serie, statut, type_vente, commission_due)
     VALUES (?, 'vendu', 'equipe', 0)`
  ).run('SN4');

  assert.deepEqual(apporteursService.resumeCommissions(), { totalDu: 3000, totalPaye: 1500 });
});

test('resumeCommissions() renvoie des zeros sur une base sans vente apporteur', () => {
  const { setDbForTests } = require('../src/main/db/database');
  const apporteursService = require('../src/main/services/apporteurs.service');

  setDbForTests(creerBaseTest());

  assert.deepEqual(apporteursService.resumeCommissions(), { totalDu: 0, totalPaye: 0 });
});
