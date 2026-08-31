const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const Database = require('better-sqlite3');
const { setDbForTests, getDb, fermerDb } = require('../src/main/db/database');

// Base de test sur disque (pas :memory:) : copierSauvegarde() a besoin d'un vrai fichier
// source pour fs.copyFileSync().
function creerBaseTest() {
  const fichier = path.join(os.tmpdir(), `reinit-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  const db = new Database(fichier);
  db.pragma('foreign_keys = ON');
  const migrationsDir = path.join(__dirname, '../src/main/db/migrations');
  for (const f of fs.readdirSync(migrationsDir).filter((n) => n.endsWith('.sql')).sort()) {
    db.exec(fs.readFileSync(path.join(migrationsDir, f), 'utf-8'));
  }
  setDbForTests(db);
  return fichier;
}

test("apercuReinitialisation() compte ce qui serait supprime/conserve, sans rien toucher", () => {
  const fichier = creerBaseTest();
  delete require.cache[require.resolve('../src/main/services/reinitialisation.service')];
  const reinitialisationService = require('../src/main/services/reinitialisation.service');

  const db = getDb();
  db.prepare("INSERT INTO decodeurs (numero_serie, statut) VALUES (?, 'en_stock')").run('A1');
  db.prepare("INSERT INTO decodeurs (numero_serie, statut) VALUES (?, 'vendu')").run('A2');
  db.prepare("INSERT INTO decodeurs (numero_serie, statut) VALUES (?, 'active')").run('A3');
  db.prepare("INSERT INTO imports (nom_fichier, nb_trouves, nb_non_trouves, nb_actives) VALUES ('x.xlsx', 1, 0, 1)").run();
  db.prepare('INSERT INTO objectifs (mois, annee, cible) VALUES (1, 2026, 10)').run();

  const apercu = reinitialisationService.apercuReinitialisation();
  assert.deepEqual(apercu, { decodeursASupprimer: 2, decodeursConserves: 1, imports: 1, objectifs: 1 });
  assert.equal(db.prepare('SELECT COUNT(*) n FROM decodeurs').get().n, 3, 'apercu ne doit rien supprimer');

  fermerDb();
  fs.unlinkSync(fichier);
});

test('reinitialiserNouvelleAnnee() exige un dossier de sauvegarde, sans quoi rien ne bouge', () => {
  const fichier = creerBaseTest();
  delete require.cache[require.resolve('../src/main/services/reinitialisation.service')];
  const reinitialisationService = require('../src/main/services/reinitialisation.service');

  const db = getDb();
  db.prepare("INSERT INTO decodeurs (numero_serie, statut) VALUES (?, 'vendu')").run('A1');

  assert.throws(() => reinitialisationService.reinitialiserNouvelleAnnee(), /dossier de sauvegarde/i);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM decodeurs').get().n, 1);

  fermerDb();
  fs.unlinkSync(fichier);
});

test('reinitialiserNouvelleAnnee() sauvegarde puis supprime vendu/active/imports/objectifs, garde en_stock et apporteurs', () => {
  const fichier = creerBaseTest();
  delete require.cache[require.resolve('../src/main/services/reinitialisation.service')];
  const reinitialisationService = require('../src/main/services/reinitialisation.service');

  const db = getDb();
  db.prepare("INSERT INTO decodeurs (numero_serie, statut) VALUES (?, 'en_stock')").run('A1');
  db.prepare("INSERT INTO decodeurs (numero_serie, statut) VALUES (?, 'vendu')").run('A2');
  db.prepare("INSERT INTO decodeurs (numero_serie, statut) VALUES (?, 'active')").run('A3');
  db.prepare("INSERT INTO imports (nom_fichier, nb_trouves, nb_non_trouves, nb_actives) VALUES ('x.xlsx', 1, 0, 1)").run();
  db.prepare('INSERT INTO objectifs (mois, annee, cible) VALUES (1, 2026, 10)').run();
  db.prepare("INSERT INTO apporteurs (nom) VALUES ('Jean Dupont')").run();

  const dossierSauvegarde = fs.mkdtempSync(path.join(os.tmpdir(), 'reinit-backup-'));
  const resultat = reinitialisationService.reinitialiserNouvelleAnnee(dossierSauvegarde, fichier);

  assert.equal(resultat.decodeurs, 2);
  assert.equal(resultat.imports, 1);
  assert.equal(resultat.objectifs, 1);
  assert.ok(fs.existsSync(resultat.backup), 'la sauvegarde doit exister sur disque');

  const dbSauvegarde = new Database(resultat.backup, { readonly: true });
  assert.equal(dbSauvegarde.prepare('SELECT COUNT(*) n FROM decodeurs').get().n, 3, 'la sauvegarde garde tout, prise avant suppression');
  dbSauvegarde.close();

  assert.deepEqual(
    db.prepare('SELECT numero_serie, statut FROM decodeurs').all(),
    [{ numero_serie: 'A1', statut: 'en_stock' }]
  );
  assert.equal(db.prepare('SELECT COUNT(*) n FROM imports').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM objectifs').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM apporteurs').get().n, 1, 'les apporteurs sont conserves');

  fs.rmSync(dossierSauvegarde, { recursive: true, force: true });
  fermerDb();
  fs.unlinkSync(fichier);
});
