const { contextBridge, ipcRenderer } = require('electron');

/**
 * API exposée au renderer. Une méthode par action métier, jamais d'accès générique
 * (pas de invoke(channel) libre) — voir ADR 0002.
 */
contextBridge.exposeInMainWorld('api', {
  decodeurs: {
    lister: (filtres) => ipcRenderer.invoke('canal:decodeurs:lister', filtres),
    ajouterLot: (payload) => ipcRenderer.invoke('canal:decodeurs:ajouterLot', payload),
    supprimer: (id) => ipcRenderer.invoke('canal:decodeurs:supprimer', id),
    compteurs: () => ipcRenderer.invoke('canal:decodeurs:compteurs'),
    repartitionParCarton: () => ipcRenderer.invoke('canal:decodeurs:repartitionParCarton'),
  },
  ventes: {
    marquerVendus: (payload) => ipcRenderer.invoke('canal:ventes:marquerVendus', payload),
    marquerActives: (payload) => ipcRenderer.invoke('canal:ventes:marquerActives', payload),
  },
  import: {
    fichier: (payload) => ipcRenderer.invoke('canal:import:fichier', payload),
    historique: () => ipcRenderer.invoke('canal:import:historique'),
    choisirFichier: () => ipcRenderer.invoke('canal:import:choisirFichier'),
  },
  apporteurs: {
    lister: () => ipcRenderer.invoke('canal:apporteurs:lister'),
    ajouter: (payload) => ipcRenderer.invoke('canal:apporteurs:ajouter', payload),
    supprimer: (id) => ipcRenderer.invoke('canal:apporteurs:supprimer', id),
    modifier: (id, payload) => ipcRenderer.invoke('canal:apporteurs:modifier', { id, ...payload }),
    resumeCommissions: () => ipcRenderer.invoke('canal:apporteurs:resumeCommissions'),
    marquerCommissionsPayees: (nom) => ipcRenderer.invoke('canal:apporteurs:marquerCommissionsPayees', nom),
  },
  objectifs: {
    definir: (payload) => ipcRenderer.invoke('canal:objectifs:definir', payload),
    lister: () => ipcRenderer.invoke('canal:objectifs:lister'),
    courant: () => ipcRenderer.invoke('canal:objectifs:courant'),
    supprimer: (id) => ipcRenderer.invoke('canal:objectifs:supprimer', id),
  },
  export: {
    choisirDossier: () => ipcRenderer.invoke('canal:export:choisirDossier'),
    sauvegarde: (dossier) => ipcRenderer.invoke('canal:export:sauvegarde', dossier),
    excel: () => ipcRenderer.invoke('canal:export:excel'),
    choisirFichierRestauration: () => ipcRenderer.invoke('canal:export:choisirFichierRestauration'),
    restaurer: (cheminSauvegarde) => ipcRenderer.invoke('canal:export:restaurer', cheminSauvegarde),
  },
});
