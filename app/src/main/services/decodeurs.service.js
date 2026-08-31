const { getDb } = require('../db/database');

/**
 * Service décodeurs — propriétaire de RG-01 (unicité) et RG-05 (progression de statut).
 */

const ORDRE_STATUT = { en_stock: 0, vendu: 1, active: 2 };

function ajouterLot({ numeros, cartonCode, dateLivraison }) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT INTO decodeurs (numero_serie, carton_code, date_livraison)
    VALUES (?, ?, ?)
  `);

  const inserer = db.transaction((liste) => {
    const resultats = { crees: 0, doublons: [] };
    for (const numeroSerie of liste) {
      const n = numeroSerie.trim();
      if (!n) continue;
      try {
        insert.run(n, cartonCode || '', dateLivraison || null);
        resultats.crees += 1;
      } catch (err) {
        // RG-01 : contrainte UNIQUE violée = doublon, pas une erreur fatale du lot
        if (String(err.message).includes('UNIQUE')) {
          resultats.doublons.push(n);
        } else {
          throw err;
        }
      }
    }
    return resultats;
  });

  return inserer(numeros);
}

function lister({ statut, cartonCode, apporteur, q, limit = 500 } = {}) {
  const db = getDb();
  const clauses = [];
  const params = [];

  if (statut) {
    clauses.push('statut = ?');
    params.push(statut);
  }
  if (cartonCode) {
    clauses.push('carton_code = ?');
    params.push(cartonCode);
  }
  if (apporteur) {
    clauses.push('apporteur = ?');
    params.push(apporteur);
  }
  if (q) {
    clauses.push('numero_serie LIKE ?');
    params.push(`%${q}%`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  params.push(limit);

  return db
    .prepare(`SELECT * FROM decodeurs ${where} ORDER BY created_at DESC LIMIT ?`)
    .all(...params);
}

/**
 * RG-05 : vérifie qu'une transition de statut ne fait jamais régresser un décodeur.
 * Retourne true si la transition est autorisée.
 */
function transitionAutorisee(statutActuel, statutCible) {
  return ORDRE_STATUT[statutCible] >= ORDRE_STATUT[statutActuel];
}

/**
 * Corrige les champs d'identité/logistique d'un décodeur (numéro de série, carton, date de
 * livraison, destinataire). Volontairement limité à ces champs : le statut, la vente et
 * l'activation passent par leurs propres flux (`ventes.service.js`, `import.service.js`,
 * `transitionAutorisee()`) pour ne pas contourner RG-02/RG-03/RG-05.
 */
function modifier(id, { numeroSerie, cartonCode, dateLivraison, destinataire } = {}) {
  const n = (numeroSerie || '').trim();
  if (!n) {
    throw new Error('Le numéro de série est obligatoire.'); // RG-01, message explicite avant la contrainte DB
  }

  const db = getDb();
  db.prepare(
    `UPDATE decodeurs
     SET numero_serie = ?, carton_code = ?, date_livraison = ?, destinataire = ?,
         updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    n,
    cartonCode || '',
    dateLivraison || null,
    destinataire || '',
    id
  );
}

function supprimer(id) {
  const db = getDb();
  db.prepare('DELETE FROM decodeurs WHERE id = ?').run(id);
}

/**
 * Comptages par statut pour le dashboard. Remplace le hack `lister({limit:1}).length`
 * utilisé provisoirement par la Phase 0.
 */
function compteurs() {
  const db = getDb();
  const lignes = db
    .prepare('SELECT statut, COUNT(*) AS n FROM decodeurs GROUP BY statut')
    .all();

  const parStatut = Object.fromEntries(lignes.map((l) => [l.statut, l.n]));
  const enStock = parStatut.en_stock || 0;
  const vendu = parStatut.vendu || 0;
  const active = parStatut.active || 0;

  return { enStock, vendu, active, total: enStock + vendu + active };
}

/**
 * Répartition par carton (total / vendus / activés) pour le dashboard.
 */
function repartitionParCarton() {
  const db = getDb();
  return db
    .prepare(
      `SELECT carton_code AS cartonCode,
              COUNT(*) AS total,
              SUM(CASE WHEN statut IN ('vendu', 'active') THEN 1 ELSE 0 END) AS vendus,
              SUM(CASE WHEN statut = 'active' THEN 1 ELSE 0 END) AS actives
       FROM decodeurs
       WHERE carton_code != ''
       GROUP BY carton_code
       ORDER BY carton_code`
    )
    .all();
}

module.exports = { ajouterLot, lister, transitionAutorisee, modifier, supprimer, compteurs, repartitionParCarton };
