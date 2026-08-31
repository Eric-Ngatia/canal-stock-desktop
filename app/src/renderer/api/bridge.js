/**
 * Couche d'accès unique aux données côté renderer. Aucun composant React n'appelle
 * `window.api` directement — tout passe par ce fichier (voir ADR 0002 et
 * .claude/rules/renderer-no-db.md).
 */
const api = window.api;

export const decodeursApi = {
  lister: (filtres) => api.decodeurs.lister(filtres),
  ajouterLot: (payload) => api.decodeurs.ajouterLot(payload),
  supprimer: (id) => api.decodeurs.supprimer(id),
  compteurs: () => api.decodeurs.compteurs(),
  repartitionParCarton: () => api.decodeurs.repartitionParCarton(),
};

export const ventesApi = {
  marquerVendus: (payload) => api.ventes.marquerVendus(payload),
  marquerActives: (payload) => api.ventes.marquerActives(payload),
};

export const importApi = {
  choisirFichier: () => api.import.choisirFichier(),
  importer: (payload) => api.import.fichier(payload),
  historique: () => api.import.historique(),
};

export const apporteursApi = {
  lister: () => api.apporteurs.lister(),
  ajouter: (payload) => api.apporteurs.ajouter(payload),
  supprimer: (id) => api.apporteurs.supprimer(id),
  modifier: (id, payload) => api.apporteurs.modifier(id, payload),
  resumeCommissions: () => api.apporteurs.resumeCommissions(),
  marquerCommissionsPayees: (nom) => api.apporteurs.marquerCommissionsPayees(nom),
};

export const objectifsApi = {
  definir: (payload) => api.objectifs.definir(payload),
  lister: () => api.objectifs.lister(),
  courant: () => api.objectifs.courant(),
  supprimer: (id) => api.objectifs.supprimer(id),
};

export const exportApi = {
  choisirDossier: () => api.export.choisirDossier(),
  sauvegarde: (dossier) => api.export.sauvegarde(dossier),
  excel: () => api.export.excel(),
  choisirFichierRestauration: () => api.export.choisirFichierRestauration(),
  restaurer: (cheminSauvegarde) => api.export.restaurer(cheminSauvegarde),
};
