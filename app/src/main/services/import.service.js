const XLSX = require('xlsx');
const { getDb } = require('../db/database');

// Un numéro de décodeur Canal+ ressemble à une longue suite de chiffres (8 à 16 chiffres).
// Voir .claude/rules/import-matching.md pour la justification et les cas limites connus.
const SERIAL_REGEX = /\b\d{8,16}\b/g;

/**
 * Service import — propriétaire unique de RG-04.
 * RG-04 : un numéro détecté et présent en base bascule en "active" ; un numéro absent
 * n'est jamais créé ; un décodeur déjà "active" n'est jamais régressé (idempotent).
 */
function extraireNumerosDuClasseur(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
  const found = new Set();
  for (const row of rows) {
    for (const cell of row) {
      if (cell === null || cell === undefined) continue;
      const matches = String(cell).match(SERIAL_REGEX);
      if (matches) matches.forEach((m) => found.add(m));
    }
  }
  return { numeros: Array.from(found), nbLignes: rows.length };
}

function importer({ buffer, nomFichier }) {
  const { numeros, nbLignes } = extraireNumerosDuClasseur(buffer);

  if (numeros.length === 0) {
    throw new Error('Aucun numéro de série reconnu dans le fichier');
  }

  const db = getDb();
  const getStatut = db.prepare('SELECT statut FROM decodeurs WHERE numero_serie = ?');
  const activer = db.prepare(`
    UPDATE decodeurs
    SET statut = 'active', date_activation = datetime('now'), source_activation = ?
    WHERE numero_serie = ?
  `);
  const insererHistorique = db.prepare(`
    INSERT INTO imports (nom_fichier, nb_lignes_fichier, nb_trouves, nb_non_trouves,
                          numeros_non_trouves, numeros_actives)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const appliquer = db.transaction(() => {
    const trouves = [];
    const nonTrouves = [];
    let actives = 0;

    for (const numeroSerie of numeros) {
      const row = getStatut.get(numeroSerie);
      if (!row) {
        nonTrouves.push(numeroSerie); // jamais de création implicite (RG-04)
        continue;
      }
      trouves.push(numeroSerie);
      if (row.statut !== 'active') {
        activer.run(nomFichier, numeroSerie);
        actives += 1;
      }
      // sinon : déjà "active", idempotent, on ne touche à rien (pas de régression)
    }

    const historique = insererHistorique.run(
      nomFichier,
      nbLignes,
      trouves.length,
      nonTrouves.length,
      JSON.stringify(nonTrouves),
      JSON.stringify(trouves)
    );

    return {
      nbDetectes: numeros.length,
      nbTrouvesEnBase: trouves.length,
      nbActives: actives,
      nbNonTrouves: nonTrouves.length,
      numerosNonTrouves: nonTrouves,
      importId: historique.lastInsertRowid,
    };
  });

  return appliquer();
}

function historique(limit = 20) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM imports ORDER BY created_at DESC LIMIT ?')
    .all(limit)
    .map((row) => ({
      ...row,
      numeros_non_trouves: JSON.parse(row.numeros_non_trouves || '[]'),
      numeros_actives: JSON.parse(row.numeros_actives || '[]'),
    }));
}

module.exports = { importer, historique, extraireNumerosDuClasseur };
