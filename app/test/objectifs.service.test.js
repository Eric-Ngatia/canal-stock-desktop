const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');
const { setDbForTests } = require('../src/main/db/database');

function creerBaseTest() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const sql = fs.readFileSync(
    path.join(__dirname, '../src/main/db/migrations/0001_init.sql'),
    'utf-8'
  );
  db.exec(sql);
  setDbForTests(db);
  return db;
}

function chargerObjectifsService() {
  delete require.cache[require.resolve('../src/main/services/objectifs.service')];
  return require('../src/main/services/objectifs.service');
}

test('RG-06: definir() sur le meme mois/annee met a jour au lieu de dupliquer', () => {
  const db = creerBaseTest();
  const objectifsService = chargerObjectifsService();

  objectifsService.definir({ mois: 6, annee: 2026, cible: 400 });
  objectifsService.definir({ mois: 6, annee: 2026, cible: 500 }); // re-definition du meme mois

  const lignes = db.prepare('SELECT * FROM objectifs WHERE mois = 6 AND annee = 2026').all();
  assert.equal(lignes.length, 1, 'un seul objectif doit exister pour ce mois/annee');
  assert.equal(lignes[0].cible, 500);
});

test('RG-06: la contrainte UNIQUE(mois, annee) protege meme sans passer par le service', () => {
  const db = creerBaseTest();
  db.prepare('INSERT INTO objectifs (mois, annee, cible) VALUES (?, ?, ?)').run(7, 2026, 300);

  assert.throws(() => {
    db.prepare('INSERT INTO objectifs (mois, annee, cible) VALUES (?, ?, ?)').run(7, 2026, 999);
  }, /UNIQUE/);
});
