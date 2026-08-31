const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

// Ce test ouvre une base en memoire et rejoue la migration initiale — jamais le fichier
// utilisateur reel. Voir .claude/skills/electron-conventions/SKILL.md.
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

test('RG-01: deux decodeurs ne peuvent pas partager le meme numero de serie', () => {
  const db = creerBaseTest();
  db.prepare('INSERT INTO decodeurs (numero_serie) VALUES (?)').run('24300000089804');

  assert.throws(() => {
    db.prepare('INSERT INTO decodeurs (numero_serie) VALUES (?)').run('24300000089804');
  }, /UNIQUE/);
});

test('RG-01: ajouterLot() rapporte les doublons sans faire echouer tout le lot', () => {
  const { setDbForTests } = require('../src/main/db/database');
  const decodeursService = require('../src/main/services/decodeurs.service');

  setDbForTests(creerBaseTest());

  const premier = decodeursService.ajouterLot({
    numeros: ['24300000089804'],
    cartonCode: 'O3',
    dateLivraison: '2026-01-01',
  });
  assert.equal(premier.crees, 1);

  const deuxieme = decodeursService.ajouterLot({
    numeros: ['24300000089804', '24300000058790'], // le premier est un doublon
    cartonCode: 'O3',
    dateLivraison: '2026-01-01',
  });
  assert.equal(deuxieme.crees, 1);
  assert.deepEqual(deuxieme.doublons, ['24300000089804']);
});

test('modifier() corrige numero de serie, carton, date de livraison et destinataire', () => {
  const { setDbForTests, getDb } = require('../src/main/db/database');
  const decodeursService = require('../src/main/services/decodeurs.service');

  setDbForTests(creerBaseTest());
  decodeursService.ajouterLot({ numeros: ['A1'], cartonCode: 'O3', dateLivraison: '2026-01-01' });
  const db = getDb();
  const { id } = db.prepare('SELECT id FROM decodeurs WHERE numero_serie = ?').get('A1');

  decodeursService.modifier(id, {
    numeroSerie: 'A1-corrige',
    cartonCode: 'U5',
    dateLivraison: '2026-02-15',
    destinataire: 'Client X',
  });

  const ligne = db.prepare('SELECT * FROM decodeurs WHERE id = ?').get(id);
  assert.equal(ligne.numero_serie, 'A1-corrige');
  assert.equal(ligne.carton_code, 'U5');
  assert.equal(ligne.date_livraison, '2026-02-15');
  assert.equal(ligne.destinataire, 'Client X');
});

test('modifier() refuse un numero de serie vide (RG-01), sans ecrire', () => {
  const { setDbForTests, getDb } = require('../src/main/db/database');
  const decodeursService = require('../src/main/services/decodeurs.service');

  setDbForTests(creerBaseTest());
  decodeursService.ajouterLot({ numeros: ['A1'], cartonCode: 'O3' });
  const db = getDb();
  const { id } = db.prepare('SELECT id FROM decodeurs WHERE numero_serie = ?').get('A1');

  assert.throws(() => decodeursService.modifier(id, { numeroSerie: '  ', cartonCode: 'O3' }), /obligatoire/i);

  const ligne = db.prepare('SELECT numero_serie FROM decodeurs WHERE id = ?').get(id);
  assert.equal(ligne.numero_serie, 'A1');
});

test('modifier() refuse un numero de serie deja utilise par un autre decodeur (RG-01)', () => {
  const { setDbForTests, getDb } = require('../src/main/db/database');
  const decodeursService = require('../src/main/services/decodeurs.service');

  setDbForTests(creerBaseTest());
  decodeursService.ajouterLot({ numeros: ['A1', 'A2'], cartonCode: 'O3' });
  const db = getDb();
  const { id } = db.prepare('SELECT id FROM decodeurs WHERE numero_serie = ?').get('A2');

  assert.throws(() => decodeursService.modifier(id, { numeroSerie: 'A1', cartonCode: 'O3' }), /UNIQUE/);
});

test('supprimer() retire un decodeur sans toucher aux autres', () => {
  const { setDbForTests, getDb } = require('../src/main/db/database');
  const decodeursService = require('../src/main/services/decodeurs.service');

  setDbForTests(creerBaseTest());
  decodeursService.ajouterLot({ numeros: ['A1', 'A2'], cartonCode: 'O3' });
  const db = getDb();
  const { id } = db.prepare('SELECT id FROM decodeurs WHERE numero_serie = ?').get('A1');

  decodeursService.supprimer(id);

  assert.equal(db.prepare('SELECT COUNT(*) n FROM decodeurs').get().n, 1);
  assert.equal(db.prepare('SELECT numero_serie FROM decodeurs WHERE numero_serie = ?').get('A2').numero_serie, 'A2');
});

test('RG-05: transitionAutorisee refuse une regression de statut', () => {
  const { transitionAutorisee } = require('../src/main/services/decodeurs.service');

  assert.equal(transitionAutorisee('en_stock', 'vendu'), true);
  assert.equal(transitionAutorisee('vendu', 'active'), true);
  assert.equal(transitionAutorisee('active', 'vendu'), false);
  assert.equal(transitionAutorisee('vendu', 'en_stock'), false);
  assert.equal(transitionAutorisee('active', 'active'), true); // idempotent, pas une regression
});

test('compteurs() agrege le nombre de decodeurs par statut', () => {
  const { setDbForTests } = require('../src/main/db/database');
  const decodeursService = require('../src/main/services/decodeurs.service');

  setDbForTests(creerBaseTest());

  decodeursService.ajouterLot({ numeros: ['A1', 'A2', 'A3'], cartonCode: 'O3' });
  const db = require('../src/main/db/database').getDb();
  db.prepare("UPDATE decodeurs SET statut = 'vendu' WHERE numero_serie = 'A2'").run();
  db.prepare("UPDATE decodeurs SET statut = 'active' WHERE numero_serie = 'A3'").run();

  const compteurs = decodeursService.compteurs();
  assert.deepEqual(compteurs, { enStock: 1, vendu: 1, active: 1, total: 3 });
});

test('compteurs() renvoie des zeros sur une base vide (pas de division/undefined)', () => {
  const { setDbForTests } = require('../src/main/db/database');
  const decodeursService = require('../src/main/services/decodeurs.service');

  setDbForTests(creerBaseTest());

  assert.deepEqual(decodeursService.compteurs(), { enStock: 0, vendu: 0, active: 0, total: 0 });
});

test('repartitionParCarton() regroupe total/vendus/actives par carton', () => {
  const { setDbForTests, getDb } = require('../src/main/db/database');
  const decodeursService = require('../src/main/services/decodeurs.service');

  setDbForTests(creerBaseTest());

  decodeursService.ajouterLot({ numeros: ['B1', 'B2'], cartonCode: 'U5' });
  decodeursService.ajouterLot({ numeros: ['C1'], cartonCode: 'U21' });
  const db = getDb();
  db.prepare("UPDATE decodeurs SET statut = 'vendu' WHERE numero_serie = 'B1'").run();
  db.prepare("UPDATE decodeurs SET statut = 'active' WHERE numero_serie = 'C1'").run();

  const repartition = decodeursService.repartitionParCarton();
  assert.deepEqual(repartition, [
    { cartonCode: 'U21', total: 1, vendus: 1, actives: 1 },
    { cartonCode: 'U5', total: 2, vendus: 1, actives: 0 },
  ]);
});
