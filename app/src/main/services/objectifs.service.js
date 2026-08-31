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

/**
 * Nombre de décodeurs vendus (statut vendu ou active, donc au moins vendus) sur un mois donné.
 * Factorisé pour être utilisé aussi bien par `courant()` (mois en cours) que par `lister()`
 * (chaque mois historique, pour savoir si son objectif a été atteint).
 */
function realiseDuMois(mois, annee) {
  const db = getDb();
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

  return realise;
}

/**
 * Historique des objectifs, enrichi du réalisé/taux/atteinte de CHAQUE mois (pas seulement le
 * mois en cours) — nécessaire pour afficher un statut "atteint/non atteint" honnête par ligne.
 */
function lister() {
  const db = getDb();
  const objectifs = db.prepare('SELECT * FROM objectifs ORDER BY annee DESC, mois DESC').all();

  return objectifs.map((o) => {
    const realise = realiseDuMois(o.mois, o.annee);
    return {
      ...o,
      realise,
      pourcentage: o.cible ? Math.round((realise / o.cible) * 100) : 0,
      atteint: o.cible > 0 && realise >= o.cible,
    };
  });
}

function courant() {
  const db = getDb();
  const now = new Date();
  const mois = now.getMonth() + 1;
  const annee = now.getFullYear();

  const objectif = db.prepare('SELECT * FROM objectifs WHERE mois = ? AND annee = ?').get(mois, annee);
  const cible = objectif?.cible || 0;
  const realise = realiseDuMois(mois, annee);

  // Si rien n'est défini pour le mois en cours, un objectif existe parfois déjà pour le mois
  // suivant (saisi en avance, ex. fin de mois) — le signaler évite de faire croire que la
  // saisie a été perdue quand le dashboard affiche juste "aucun objectif pour ce mois-ci".
  const moisProchain = mois === 12 ? 1 : mois + 1;
  const anneeProchain = mois === 12 ? annee + 1 : annee;
  const objectifProchain = db
    .prepare('SELECT * FROM objectifs WHERE mois = ? AND annee = ?')
    .get(moisProchain, anneeProchain);

  return {
    mois,
    annee,
    cible,
    realise,
    pourcentage: cible ? Math.round((realise / cible) * 100) : 0,
    defini: !!objectif,
    prochain: objectifProchain ? { mois: moisProchain, annee: anneeProchain, cible: objectifProchain.cible } : null,
  };
}

function supprimer(id) {
  const db = getDb();
  db.prepare('DELETE FROM objectifs WHERE id = ?').run(id);
}

module.exports = { definir, lister, courant, realiseDuMois, supprimer };
