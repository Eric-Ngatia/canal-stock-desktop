const test = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { setDbForTests, fermerDb, getDb } = require('../src/main/db/database');

test('fermerDb() ferme le handle courant puis getDb() en recree un nouveau via setDbForTests', () => {
  const premiere = new Database(':memory:');
  setDbForTests(premiere);
  assert.equal(getDb(), premiere);

  fermerDb();
  assert.throws(() => premiere.prepare('SELECT 1').get(), /database connection is not open/i);

  const seconde = new Database(':memory:');
  setDbForTests(seconde);
  assert.equal(getDb(), seconde);

  fermerDb();
});

test('fermerDb() est sans effet si aucun handle n\'est ouvert', () => {
  fermerDb();
  assert.doesNotThrow(() => fermerDb());
});
