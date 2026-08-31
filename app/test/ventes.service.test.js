const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');
const { setDbForTests } = require('../src/main/db/database');

function creerBaseAvecDecodeur(numeroSerie, statutInitial = 'en_stock') {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const sql = fs.readFileSync(
    path.join(__dirname, '../src/main/db/migrations/0001_init.sql'),
    'utf-8'
  );
  db.exec(sql);
  db.prepare('INSERT INTO decodeurs (numero_serie, statut) VALUES (?, ?)').run(
    numeroSerie,
    statutInitial
  );
  setDbForTests(db);
  return db;
}

test('RG-03: commission_due = COMMISSION_APPORTEUR pour une vente via apporteur', () => {
  creerBaseAvecDecodeur('24510284163959');
  // Recharge le service après setDbForTests pour repartir d'un module frais avec la constante lue.
  delete require.cache[require.resolve('../src/main/services/ventes.service')];
  const ventesService = require('../src/main/services/ventes.service');

  const res = ventesService.marquerVendus({
    numeros: ['24510284163959'],
    dateVente: '2026-06-10',
    typeVente: 'apporteur',
    apporteur: 'Edouard Energie',
  });

  assert.equal(res.modifies, 1);
  assert.equal(ventesService.COMMISSION_APPORTEUR, 1500);
});

test('RG-03: commission_due = 0 pour une vente equipe interne', () => {
  const db = creerBaseAvecDecodeur('24510284113146');
  delete require.cache[require.resolve('../src/main/services/ventes.service')];
  const ventesService = require('../src/main/services/ventes.service');

  ventesService.marquerVendus({
    numeros: ['24510284113146'],
    dateVente: '2026-06-10',
    typeVente: 'equipe',
  });

  const row = db.prepare('SELECT commission_due FROM decodeurs WHERE numero_serie = ?').get('24510284113146');
  assert.equal(row.commission_due, 0);
});

test('RG-02: vente apporteur sans nom d\'apporteur leve une erreur, aucune ecriture', () => {
  const db = creerBaseAvecDecodeur('24510281909091');
  delete require.cache[require.resolve('../src/main/services/ventes.service')];
  const ventesService = require('../src/main/services/ventes.service');

  assert.throws(() => {
    ventesService.marquerVendus({
      numeros: ['24510281909091'],
      dateVente: '2026-06-13',
      typeVente: 'apporteur',
      apporteur: '',
    });
  }, /apporteur/i);

  const row = db.prepare('SELECT statut FROM decodeurs WHERE numero_serie = ?').get('24510281909091');
  assert.equal(row.statut, 'en_stock'); // inchange
});

test('RG-01: un numero de serie jamais enregistre ne peut pas etre marque vendu (pas de creation implicite)', () => {
  const db = creerBaseAvecDecodeur('24510284163959'); // decodeur existant, non concerne
  delete require.cache[require.resolve('../src/main/services/ventes.service')];
  const ventesService = require('../src/main/services/ventes.service');

  const res = ventesService.marquerVendus({
    numeros: ['00000000000000'], // jamais ajoute au stock
    dateVente: '2026-06-10',
    typeVente: 'equipe',
  });

  assert.equal(res.modifies, 0);
  assert.deepEqual(res.nonTrouves, ['00000000000000']);
  const row = db.prepare('SELECT * FROM decodeurs WHERE numero_serie = ?').get('00000000000000');
  assert.equal(row, undefined, 'aucun decodeur ne doit avoir ete cree implicitement');
});

test('RG-01: un numero de serie jamais enregistre ne peut pas etre marque active (pas de creation implicite)', () => {
  const db = creerBaseAvecDecodeur('24510284163959');
  delete require.cache[require.resolve('../src/main/services/ventes.service')];
  const ventesService = require('../src/main/services/ventes.service');

  const res = ventesService.marquerActives({
    numeros: ['00000000000000'],
    dateActivation: '2026-06-10',
  });

  assert.equal(res.modifies, 0);
  assert.deepEqual(res.nonTrouves, ['00000000000000']);
  const row = db.prepare('SELECT * FROM decodeurs WHERE numero_serie = ?').get('00000000000000');
  assert.equal(row, undefined, 'aucun decodeur ne doit avoir ete cree implicitement');
});

test('RG-05: un decodeur deja active n\'est pas repasse "vendu"', () => {
  const db = creerBaseAvecDecodeur('24510281884567', 'active');
  delete require.cache[require.resolve('../src/main/services/ventes.service')];
  const ventesService = require('../src/main/services/ventes.service');

  const res = ventesService.marquerVendus({
    numeros: ['24510281884567'],
    dateVente: '2026-06-13',
    typeVente: 'equipe',
  });

  assert.equal(res.modifies, 0);
  assert.deepEqual(res.bloques, ['24510281884567']);
  const row = db.prepare('SELECT statut FROM decodeurs WHERE numero_serie = ?').get('24510281884567');
  assert.equal(row.statut, 'active');
});
