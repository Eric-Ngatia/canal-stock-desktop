const { getDb } = require('../db/database');

function lister() {
  const db = getDb();
  const apporteurs = db.prepare('SELECT * FROM apporteurs ORDER BY nom').all();

  const stats = db
    .prepare(
      `SELECT apporteur AS nom, COUNT(*) AS totalVentes, SUM(commission_due) AS totalCommissions,
              SUM(CASE WHEN statut = 'active' THEN 1 ELSE 0 END) AS totalActives
       FROM decodeurs
       WHERE type_vente = 'apporteur' AND apporteur != ''
       GROUP BY apporteur`
    )
    .all();

  const statMap = Object.fromEntries(stats.map((s) => [s.nom, s]));
  const nomsOfficiels = new Set(apporteurs.map((a) => a.nom));

  const officiels = apporteurs.map((a) => ({
    ...a,
    totalVentes: statMap[a.nom]?.totalVentes || 0,
    totalCommissions: statMap[a.nom]?.totalCommissions || 0,
    totalActives: statMap[a.nom]?.totalActives || 0,
  }));

  const nonReferences = stats
    .filter((s) => !nomsOfficiels.has(s.nom))
    .map((s) => ({
      id: null,
      nom: s.nom,
      telephone: '',
      nonReference: true,
      totalVentes: s.totalVentes,
      totalCommissions: s.totalCommissions,
      totalActives: s.totalActives,
    }));

  return [...officiels, ...nonReferences];
}

function ajouter({ nom, telephone }) {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO apporteurs (nom, telephone) VALUES (?, ?)')
    .run(nom, telephone || '');
  return { id: result.lastInsertRowid, nom, telephone: telephone || '' };
}

function supprimer(id) {
  const db = getDb();
  db.prepare('DELETE FROM apporteurs WHERE id = ?').run(id);
}

/**
 * Total des commissions dues aux apporteurs, dû vs déjà payé (colonne `commission_payee`
 * du schéma initial). Lecture seule — aucune action « marquer payé » en Phase 1.
 */
function resumeCommissions() {
  const db = getDb();
  const { totalDu } = db
    .prepare(
      `SELECT COALESCE(SUM(commission_due), 0) AS totalDu
       FROM decodeurs WHERE type_vente = 'apporteur'`
    )
    .get();
  const { totalPaye } = db
    .prepare(
      `SELECT COALESCE(SUM(commission_due), 0) AS totalPaye
       FROM decodeurs WHERE type_vente = 'apporteur' AND commission_payee = 1`
    )
    .get();

  return { totalDu, totalPaye };
}

module.exports = { lister, ajouter, supprimer, resumeCommissions };
