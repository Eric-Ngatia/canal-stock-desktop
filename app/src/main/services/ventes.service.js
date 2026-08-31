const { getDb } = require('../db/database');
const { transitionAutorisee } = require('./decodeurs.service');

const COMMISSION_APPORTEUR = Number(process.env.COMMISSION_APPORTEUR || 1500);

/**
 * Service ventes — propriétaire de RG-02 (champs obligatoires à la vente),
 * RG-03 (calcul de la commission) et applique le garde-fou RG-05 (pas de régression).
 */
function marquerVendus({ numeros, dateVente, typeVente, apporteur, destinataire }) {
  // RG-02 : date de vente et type de vente obligatoires ; apporteur obligatoire si typeVente = apporteur
  if (!Array.isArray(numeros) || numeros.length === 0) {
    throw new Error('Liste de numéros requise');
  }
  if (!typeVente || !['equipe', 'apporteur'].includes(typeVente)) {
    throw new Error('Type de vente invalide (equipe ou apporteur attendu)');
  }
  if (typeVente === 'apporteur' && !apporteur) {
    throw new Error("Nom de l'apporteur requis pour une vente de type apporteur");
  }

  const db = getDb();
  // RG-03 : commission uniquement si vente via apporteur
  const commission = typeVente === 'apporteur' ? COMMISSION_APPORTEUR : 0;
  const date = dateVente || new Date().toISOString().slice(0, 10);

  const getStatut = db.prepare('SELECT statut FROM decodeurs WHERE numero_serie = ?');
  const update = db.prepare(`
    UPDATE decodeurs
    SET statut = 'vendu', date_vente = ?, type_vente = ?, apporteur = ?,
        commission_due = ?, destinataire = ?, updated_at = datetime('now')
    WHERE numero_serie = ?
  `);

  const appliquer = db.transaction((liste) => {
    let modifies = 0;
    const bloques = [];
    const nonTrouves = [];
    for (const numeroSerie of liste) {
      const n = numeroSerie.trim();
      const row = getStatut.get(n);
      if (!row) {
        // RG-01 : un décodeur doit déjà être enregistré (réceptionné en stock) pour pouvoir
        // être vendu — jamais de création implicite depuis la saisie de vente.
        nonTrouves.push(n);
        continue;
      }
      if (!transitionAutorisee(row.statut, 'vendu')) {
        bloques.push(n); // RG-05 : ex. déjà "active", on ne régresse pas
        continue;
      }
      update.run(date, typeVente, apporteur || '', commission, destinataire || '', n);
      modifies += 1;
    }
    return { modifies, bloques, nonTrouves };
  });

  return appliquer(numeros);
}

function marquerActives({ numeros, dateActivation, source = 'manuel' }) {
  if (!Array.isArray(numeros) || numeros.length === 0) {
    throw new Error('Liste de numéros requise');
  }

  const db = getDb();
  const date = dateActivation || new Date().toISOString().slice(0, 10);

  const getStatut = db.prepare('SELECT statut FROM decodeurs WHERE numero_serie = ?');
  const update = db.prepare(`
    UPDATE decodeurs
    SET statut = 'active', date_activation = ?, source_activation = ?, updated_at = datetime('now')
    WHERE numero_serie = ?
  `);

  const appliquer = db.transaction((liste) => {
    let modifies = 0;
    const dejaActifs = [];
    const nonTrouves = [];
    for (const numeroSerie of liste) {
      const n = numeroSerie.trim();
      const row = getStatut.get(n);
      if (!row) {
        // RG-01 : même garde-fou que marquerVendus — un décodeur non enregistré ne peut pas
        // être activé, manuellement ou via import (RG-04).
        nonTrouves.push(n);
        continue;
      }
      if (row.statut === 'active') {
        dejaActifs.push(n); // idempotent, pas une erreur
        continue;
      }
      update.run(date, source, n);
      modifies += 1;
    }
    return { modifies, dejaActifs, nonTrouves };
  });

  return appliquer(numeros);
}

module.exports = { marquerVendus, marquerActives, COMMISSION_APPORTEUR };
