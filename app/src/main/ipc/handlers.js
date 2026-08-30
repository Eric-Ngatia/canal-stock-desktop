const { ipcMain, dialog } = require('electron');
const fs = require('fs');

const decodeursService = require('../services/decodeurs.service');
const ventesService = require('../services/ventes.service');
const importService = require('../services/import.service');
const apporteursService = require('../services/apporteurs.service');
const objectifsService = require('../services/objectifs.service');
const exportService = require('../services/export.service');

/**
 * Enregistre tous les canaux IPC exposés au renderer. Chaque canal appelle UN service,
 * jamais de logique métier écrite ici (voir ADR 0002 et CLAUDE.md).
 */
function enregistrerHandlers() {
  // Décodeurs / stock
  ipcMain.handle('canal:decodeurs:lister', (_e, filtres) => decodeursService.lister(filtres));
  ipcMain.handle('canal:decodeurs:ajouterLot', (_e, payload) => decodeursService.ajouterLot(payload));
  ipcMain.handle('canal:decodeurs:supprimer', (_e, id) => decodeursService.supprimer(id));
  ipcMain.handle('canal:decodeurs:compteurs', () => decodeursService.compteurs());
  ipcMain.handle('canal:decodeurs:repartitionParCarton', () => decodeursService.repartitionParCarton());

  // Vente & activation
  ipcMain.handle('canal:ventes:marquerVendus', (_e, payload) => ventesService.marquerVendus(payload));
  ipcMain.handle('canal:ventes:marquerActives', (_e, payload) => ventesService.marquerActives(payload));

  // Import Canal+
  ipcMain.handle('canal:import:fichier', (_e, { cheminFichier, nomFichier }) => {
    const buffer = fs.readFileSync(cheminFichier);
    return importService.importer({ buffer, nomFichier });
  });
  ipcMain.handle('canal:import:historique', () => importService.historique());
  ipcMain.handle('canal:import:choisirFichier', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Excel / CSV', extensions: ['xlsx', 'xls', 'csv'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // Apporteurs
  ipcMain.handle('canal:apporteurs:lister', () => apporteursService.lister());
  ipcMain.handle('canal:apporteurs:ajouter', (_e, payload) => apporteursService.ajouter(payload));
  ipcMain.handle('canal:apporteurs:supprimer', (_e, id) => apporteursService.supprimer(id));
  ipcMain.handle('canal:apporteurs:resumeCommissions', () => apporteursService.resumeCommissions());

  // Objectifs
  ipcMain.handle('canal:objectifs:definir', (_e, payload) => objectifsService.definir(payload));
  ipcMain.handle('canal:objectifs:lister', () => objectifsService.lister());
  ipcMain.handle('canal:objectifs:courant', () => objectifsService.courant());
  ipcMain.handle('canal:objectifs:supprimer', (_e, id) => objectifsService.supprimer(id));

  // Export / sauvegarde (RG-08)
  ipcMain.handle('canal:export:choisirDossier', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });
  ipcMain.handle('canal:export:sauvegarde', (_e, dossier) => exportService.copierSauvegarde(dossier));
  ipcMain.handle('canal:export:excel', async () => {
    const result = await dialog.showSaveDialog({
      defaultPath: 'export-decodeurs.xlsx',
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    });
    if (result.canceled || !result.filePath) return null;
    return exportService.exporterExcel(result.filePath);
  });
}

module.exports = { enregistrerHandlers };
