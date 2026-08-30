const { getDb } = require('../db/database');

/**
 * Service objectifs — propriétaire de RG-06 (un seul objectif actif par mois/année).
 */
function definir({ mois, annee, cible }) {
  const db = getDb();
  db.prepare(
    `INSERT INTO objectifs (mois, annee, cible) VALUES (?, ?, ?)
     ON CONFLICT (mois, annee) DO UPDATE SET cible = excluded.cible`
  ).run(mois, annee, cible);

  return db.prepare('SELECT * FROM objectifs WHERE mois = ? AND annee = ?').get(mois, annee);
}

function lister() {
  const db = getDb();
  return db.prepare('SELECT * FROM objectifs ORDER BY annee DESC, mois DESC').all();
}

function courant() {
  const db = getDb();
  const now = new Date();
  const mois = now.getMonth() + 1;
  const annee = now.getFullYear();

  const objectif = db.prepare('SELECT * FROM objectifs WHERE mois = ? AND annee = ?').get(mois, annee);

  const debutMois = `${annee}-${String(mois).padStart(2, '0')}-01`;
  const finMois =
    mois === 12
      ? `${annee + 1}-01-01`
      : `${annee}-${String(mois + 1).padStart(2, '0')}-01`;

  const { realise } = db
    .prepare(
      `SELECT COUNT(*) AS realise FROM decodeurs
       WHERE statut IN ('vendu', 'active') AND date_vente >= ? AND date_vente < ?`
    )
    .get(debutMois, finMois);

  const cible = objectif?.cible || 0;

  return {
    mois,
    annee,
    cible,
    realise,
    pourcentage: cible ? Math.round((realise / cible) * 100) : 0,
  };
}

module.exports = { definir, lister, courant };
