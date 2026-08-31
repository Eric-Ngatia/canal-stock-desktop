const { getDb } = require('../db/database');
const exportService = require('./export.service');

/**
 * Service de réinitialisation « nouvelle année ». Remet à zéro l'historique transactionnel
 * (ventes, activations, imports, objectifs) tout en conservant :
 *  - le stock non vendu (décodeurs `en_stock`) : il existe physiquement, le supprimer ferait
 *    perdre le suivi d'un vrai inventaire ;
 *  - les apporteurs : ce sont des contacts durables, pas de l'historique — leurs compteurs de
 *    commissions retombent naturellement à zéro puisqu'ils sont recalculés à partir des
 *    décodeurs vendus (qui, eux, disparaissent).
 *
 * Un décodeur `vendu`/`active` porte lui-même les données de la vente (date_vente, apporteur,
 * commission_due...) — il n'existe pas de table `ventes` séparée dans ce schéma — donc
 * « effacer l'historique des ventes » revient à supprimer ces lignes de `decodeurs`.
 */

/**
 * Aperçu, sans rien supprimer, de ce qu'une réinitialisation effacerait — pour afficher un
 * avertissement chiffré avant toute confirmation côté UI.
 */
function apercuReinitialisation() {
  const db = getDb();
  return {
    decodeursASupprimer: db.prepare("SELECT COUNT(*) n FROM decodeurs WHERE statut != 'en_stock'").get().n,
    decodeursConserves: db.prepare("SELECT COUNT(*) n FROM decodeurs WHERE statut = 'en_stock'").get().n,
    imports: db.prepare('SELECT COUNT(*) n FROM imports').get().n,
    objectifs: db.prepare('SELECT COUNT(*) n FROM objectifs').get().n,
  };
}

/**
 * Effectue la réinitialisation. Une sauvegarde complète est TOUJOURS prise juste avant, dans
 * ce même appel — ce n'est pas une option que l'appelant pourrait oublier de cocher (dans le
 * même esprit que RG-08 : jamais de suppression de masse sans copie récupérable).
 *
 * `dossierSauvegarde` est obligatoire : sans lui, on lève avant de toucher à quoi que ce soit.
 * `sourcePath` est optionnel et réservé aux tests (voir `copierSauvegarde()`).
 */
function reinitialiserNouvelleAnnee(dossierSauvegarde, sourcePath) {
  if (!dossierSauvegarde) {
    throw new Error('Un dossier de sauvegarde est requis avant toute réinitialisation.');
  }

  const backup = exportService.copierSauvegarde(dossierSauvegarde, sourcePath);

  const db = getDb();
  const executer = db.transaction(() => {
    const decodeurs = db.prepare("DELETE FROM decodeurs WHERE statut != 'en_stock'").run().changes;
    const imports = db.prepare('DELETE FROM imports').run().changes;
    const objectifs = db.prepare('DELETE FROM objectifs').run().changes;
    return { decodeurs, imports, objectifs };
  });

  const supprimes = executer();
  return { backup, ...supprimes };
}

module.exports = { apercuReinitialisation, reinitialiserNouvelleAnnee };
