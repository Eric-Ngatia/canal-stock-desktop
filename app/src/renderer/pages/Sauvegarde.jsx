import { useState } from 'react';
import { Save, FileSpreadsheet, RotateCcw, FolderOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { exportApi } from '../api/bridge.js';

/**
 * Heuristique approximative, pas une détection fiable : sert uniquement à encourager
 * l'utilisateur à choisir un dossier hors du disque système (clé USB, disque externe, ou
 * un dossier déjà synchronisé par un client cloud tiers type OneDrive/Google Drive/Dropbox).
 * En cas de panne ou de vol de la machine, seule une copie qui a quitté le disque système
 * protège réellement les données.
 */
function estProbablementDisqueSysteme(chemin) {
  if (!chemin) return false;
  const normalise = chemin.toLowerCase();
  const surDisqueC = /^c:[\\/]/.test(normalise);
  const dossierSynchronise = /(onedrive|google ?drive|dropbox)/.test(normalise);
  return surDisqueC && !dossierSynchronise;
}

export default function Sauvegarde() {
  const [dossierSauvegarde, setDossierSauvegarde] = useState('');
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [derniereSauvegarde, setDerniereSauvegarde] = useState('');
  const [erreurSauvegarde, setErreurSauvegarde] = useState('');

  const [excelEnCours, setExcelEnCours] = useState(false);
  const [dernierExport, setDernierExport] = useState('');

  const [fichierRestauration, setFichierRestauration] = useState('');
  const [restaurationEnCours, setRestaurationEnCours] = useState(false);
  const [erreurRestauration, setErreurRestauration] = useState('');

  const avertissementDisqueSysteme = estProbablementDisqueSysteme(dossierSauvegarde);

  const choisirDossier = async () => {
    const dossier = await exportApi.choisirDossier();
    if (dossier) {
      setDossierSauvegarde(dossier);
      setDerniereSauvegarde('');
      setErreurSauvegarde('');
    }
  };

  const sauvegarderMaintenant = async () => {
    if (!dossierSauvegarde) return;
    setSauvegardeEnCours(true);
    setErreurSauvegarde('');
    try {
      const destination = await exportApi.sauvegarde(dossierSauvegarde);
      setDerniereSauvegarde(destination.split(/[\\/]/).pop());
    } catch (err) {
      setErreurSauvegarde(err.message || 'Échec de la sauvegarde');
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const exporterExcel = async () => {
    setExcelEnCours(true);
    try {
      const destination = await exportApi.excel();
      if (destination) setDernierExport(destination.split(/[\\/]/).pop());
    } finally {
      setExcelEnCours(false);
    }
  };

  const choisirFichierRestauration = async () => {
    const fichier = await exportApi.choisirFichierRestauration();
    if (fichier) {
      setFichierRestauration(fichier);
      setErreurRestauration('');
    }
  };

  const restaurer = async () => {
    if (!fichierRestauration) return;
    const confirme = window.confirm(
      "Cette action remplace toutes les données actuelles par le contenu de la sauvegarde choisie. " +
        "Une copie de sécurité de l'état actuel sera conservée, mais l'application va redémarrer " +
        'immédiatement après. Continuer ?'
    );
    if (!confirme) return;

    setRestaurationEnCours(true);
    setErreurRestauration('');
    try {
      await exportApi.restaurer(fichierRestauration);
      // En cas de succès, l'app redémarre côté processus principal — ce code peut ne jamais
      // s'exécuter jusqu'au bout, et c'est normal.
    } catch (err) {
      setErreurRestauration(err.message || 'Échec de la restauration');
      setRestaurationEnCours(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-page-title text-page-title text-on-surface">Sauvegarde &amp; export</h1>

      <section className="bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Save size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="font-subtitle text-subtitle text-on-surface">Sauvegarder les données</h2>
            <p className="font-label-metadata text-label-metadata text-secondary">
              Copie complète de la base vers un dossier de votre choix.
            </p>
          </div>
        </div>

        <p className="text-sm text-secondary">
          Pour rester protégé en cas de panne ou de perte de cette machine, choisissez un dossier
          <strong className="text-on-surface"> hors du disque système</strong> : une clé USB, un
          disque externe, ou un dossier déjà synchronisé par un client cloud (OneDrive, Google
          Drive, Dropbox…). L'application n'effectue elle-même aucun envoi réseau — elle écrit
          simplement un fichier local à l'endroit choisi.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            type="button"
            onClick={choisirDossier}
            className="h-10 px-4 rounded border border-border-color bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 font-subtitle text-subtitle"
          >
            <FolderOpen size={16} />
            Choisir un dossier
          </button>
          {dossierSauvegarde && (
            <span className="font-label-metadata text-label-metadata text-secondary truncate max-w-full">
              {dossierSauvegarde}
            </span>
          )}
        </div>

        {avertissementDisqueSysteme && (
          <div className="flex items-start gap-2 text-status-orange-text bg-status-orange-bg px-4 py-2.5 rounded-lg text-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>
              Ce dossier semble être sur le disque système. En cas de panne de la machine, cette
              sauvegarde ne sera pas récupérable. Préférez un support externe ou un dossier
              synchronisé.
            </span>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={sauvegarderMaintenant}
            disabled={!dossierSauvegarde || sauvegardeEnCours}
            className="h-10 px-6 rounded bg-primary text-on-primary font-subtitle text-subtitle hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {sauvegardeEnCours ? 'Sauvegarde en cours…' : 'Sauvegarder maintenant'}
          </button>
        </div>

        {derniereSauvegarde && (
          <div className="flex items-center gap-2 text-status-green-text bg-status-green-bg px-4 py-2.5 rounded-lg text-sm">
            <CheckCircle2 size={16} />
            Sauvegarde créée : {derniereSauvegarde}
          </div>
        )}
        {erreurSauvegarde && (
          <div className="flex items-center gap-2 text-status-red-text bg-status-red-bg px-4 py-2.5 rounded-lg text-sm">
            <AlertTriangle size={16} />
            {erreurSauvegarde}
          </div>
        )}
      </section>

      <section className="bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <FileSpreadsheet size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="font-subtitle text-subtitle text-on-surface">Exporter en Excel</h2>
            <p className="font-label-metadata text-label-metadata text-secondary">
              Liste des décodeurs dans un fichier .xlsx lisible.
            </p>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={exporterExcel}
            disabled={excelEnCours}
            className="h-10 px-6 rounded border border-border-color bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50 font-subtitle text-subtitle"
          >
            {excelEnCours ? 'Export en cours…' : 'Exporter en Excel'}
          </button>
        </div>
        {dernierExport && (
          <div className="flex items-center gap-2 text-status-green-text bg-status-green-bg px-4 py-2.5 rounded-lg text-sm">
            <CheckCircle2 size={16} />
            Export créé : {dernierExport}
          </div>
        )}
      </section>

      <section className="bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-status-red-bg flex items-center justify-center shrink-0">
            <RotateCcw size={18} className="text-status-red-text" />
          </div>
          <div>
            <h2 className="font-subtitle text-subtitle text-on-surface">Restaurer une sauvegarde</h2>
            <p className="font-label-metadata text-label-metadata text-secondary">
              Remplace toutes les données actuelles par celles d'un fichier de sauvegarde.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            type="button"
            onClick={choisirFichierRestauration}
            className="h-10 px-4 rounded border border-border-color bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 font-subtitle text-subtitle"
          >
            <FolderOpen size={16} />
            Choisir un fichier .sqlite
          </button>
          {fichierRestauration && (
            <span className="font-label-metadata text-label-metadata text-secondary truncate max-w-full">
              {fichierRestauration.split(/[\\/]/).pop()}
            </span>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={restaurer}
            disabled={!fichierRestauration || restaurationEnCours}
            className="h-10 px-6 rounded bg-status-red-text text-white font-subtitle text-subtitle hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {restaurationEnCours ? 'Restauration en cours…' : 'Restaurer cette sauvegarde'}
          </button>
        </div>

        {erreurRestauration && (
          <div className="flex items-center gap-2 text-status-red-text bg-status-red-bg px-4 py-2.5 rounded-lg text-sm">
            <AlertTriangle size={16} />
            {erreurRestauration}
          </div>
        )}
      </section>
    </div>
  );
}
