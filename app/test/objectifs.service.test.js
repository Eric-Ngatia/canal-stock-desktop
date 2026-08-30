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

test("lister() calcule atteint/realise/pourcentage par mois a partir des vraies ventes, pas seulement le mois en cours", () => {
  const db = creerBaseTest();
  const objectifsService = chargerObjectifsService();

  // Mois 1 (annee 2026) : cible 2, 2 ventes reelles -> atteint.
  objectifsService.definir({ mois: 1, annee: 2026, cible: 2 });
  // Mois 2 (annee 2026) : cible 5, 1 seule vente reelle -> non atteint.
  objectifsService.definir({ mois: 2, annee: 2026, cible: 5 });

  const insererVendu = db.prepare(
    "INSERT INTO decodeurs (numero_serie, statut, date_vente) VALUES (?, 'vendu', ?)"
  );
  insererVendu.run('S1', '2026-01-05');
  insererVendu.run('S2', '2026-01-20');
  insererVendu.run('S3', '2026-02-10');

  const lignes = objectifsService.lister();
  const janvier = lignes.find((l) => l.mois === 1 && l.annee === 2026);
  const fevrier = lignes.find((l) => l.mois === 2 && l.annee === 2026);

  assert.equal(janvier.realise, 2);
  assert.equal(janvier.pourcentage, 100);
  assert.equal(janvier.atteint, true);

  assert.equal(fevrier.realise, 1);
  assert.equal(fevrier.pourcentage, 20);
  assert.equal(fevrier.atteint, false);
});

test('supprimer() retire un objectif de la liste sans toucher aux autres', () => {
  const db = creerBaseTest();
  const objectifsService = chargerObjectifsService();

  objectifsService.definir({ mois: 3, annee: 2026, cible: 200 });
  const { id } = objectifsService.definir({ mois: 4, annee: 2026, cible: 300 });

  objectifsService.supprimer(id);

  const restants = db.prepare('SELECT mois, annee FROM objectifs ORDER BY mois').all();
  assert.deepEqual(restants, [{ mois: 3, annee: 2026 }]);
});
