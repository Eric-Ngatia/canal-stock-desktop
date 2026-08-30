import { useEffect, useState } from 'react';
import { UploadCloud, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { importApi } from '../api/bridge.js';

const EXTENSIONS_ACCEPTEES = ['.xlsx', '.xls', '.csv'];

function extensionValide(nomFichier) {
  const nom = nomFichier.toLowerCase();
  return EXTENSIONS_ACCEPTEES.some((ext) => nom.endsWith(ext));
}

export default function Import() {
  const [cheminFichier, setCheminFichier] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');
  const [historique, setHistorique] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const chargerHistorique = () => importApi.historique().then(setHistorique);

  useEffect(() => {
    chargerHistorique();
  }, []);

  const choisirFichier = async () => {
    const chemin = await importApi.choisirFichier();
    if (chemin) {
      setCheminFichier(chemin);
      setErreur('');
    }
  };

  const gererDepot = (e) => {
    e.preventDefault();
    setDragOver(false);
    const fichier = e.dataTransfer.files?.[0];
    if (!fichier) return;
    // Electron ≤31 (version épinglée du repo) expose encore `.path` sur l'objet File du drop
    // natif — support retiré en v32. Aucun nouveau canal IPC : même flux que "Parcourir…".
    if (!fichier.path) {
      setErreur("Impossible de lire le chemin du fichier déposé. Utilisez « Parcourir… ».");
      return;
    }
    if (!extensionValide(fichier.name)) {
      setErreur(`Format non supporté. Fichiers acceptés : ${EXTENSIONS_ACCEPTEES.join(', ')}`);
      return;
    }
    setErreur('');
    setCheminFichier(fichier.path);
  };

  const importer = async () => {
    if (!cheminFichier) return;
    setLoading(true);
    setErreur('');
    setResultat(null);
    try {
      const nomFichier = cheminFichier.split(/[\\/]/).pop();
      const res = await importApi.importer({ cheminFichier, nomFichier });
      setResultat(res);
      setCheminFichier('');
      chargerHistorique();
    } catch (err) {
      setErreur(err.message || "Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  };

  // "Dernier import" : le résultat frais de cette session, sinon le dernier de l'historique.
  const dernier = resultat
    ? { nbDetectes: resultat.nbDetectes, nbActives: resultat.nbActives, nbNonTrouves: resultat.nbNonTrouves }
    : historique[0]
      ? {
          nbDetectes: historique[0].nb_trouves + historique[0].nb_non_trouves,
          nbActives: historique[0].nb_actives,
          nbNonTrouves: historique[0].nb_non_trouves,
        }
      : null;
  const tauxSucces = dernier && dernier.nbDetectes > 0 ? Math.round((dernier.nbActives / dernier.nbDetectes) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-key-value text-key-value text-on-surface">Import Canal+</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Colonne gauche : dépôt + historique */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-border-color rounded-xl shadow-level-1 p-8 flex flex-col items-center text-center">
            <div
              onClick={choisirFichier}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={gererDepot}
              className={`w-full h-64 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer mb-6 ${
                dragOver ? 'border-primary bg-secondary-container' : 'border-outline-variant bg-surface-container-low/50 hover:bg-surface-container-low'
              }`}
            >
              <UploadCloud size={44} className="text-primary/60 mb-4" />
              <p className="font-subtitle text-subtitle text-on-surface-variant mb-2">
                {cheminFichier
                  ? cheminFichier.split(/[\\/]/).pop()
                  : 'Glissez le rapport Canal+ ici ou cliquez pour parcourir'}
              </p>
              <p className="font-label-metadata text-label-metadata text-outline">
                Fichiers Excel (.xlsx, .xls) et CSV acceptés.
              </p>
            </div>
            <button
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-subtitle text-subtitle hover:bg-primary-container transition-colors w-full sm:w-auto disabled:opacity-50"
              disabled={!cheminFichier || loading}
              onClick={importer}
            >
              {loading ? 'Traitement en cours...' : 'Importer et rapprocher'}
            </button>
            {erreur && (
              <div className="mt-4 w-full flex items-center gap-2 text-status-red-text bg-status-red-bg px-4 py-2 rounded-lg text-sm">
                <AlertTriangle size={16} />
                {erreur}
              </div>
            )}
          </div>

          <div className="bg-surface-container-lowest border border-border-color rounded-xl shadow-level-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-color">
              <h3 className="font-page-title text-page-title text-on-surface">Historique des imports</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-table-header-bg border-b border-border-color text-label-metadata font-label-metadata text-secondary uppercase">
                    <th className="px-4 h-10 font-semibold">Date</th>
                    <th className="px-4 h-10 font-semibold">Fichier</th>
                    <th className="px-4 h-10 font-semibold text-right">Détectés</th>
                    <th className="px-4 h-10 font-semibold text-right">Activés</th>
                    <th className="px-4 h-10 font-semibold text-right">Non trouvés</th>
                  </tr>
                </thead>
                <tbody className="font-body-table text-body-table text-on-surface">
                  {historique.map((h) => (
                    <tr key={h.id} className="border-b border-border-color hover:bg-table-hover-bg transition-colors h-12">
                      <td className="px-4 text-secondary">{h.created_at}</td>
                      <td className="px-4">{h.nom_fichier}</td>
                      <td className="px-4 text-right tabular-nums">{h.nb_trouves + h.nb_non_trouves}</td>
                      <td className="px-4 text-right tabular-nums text-status-green-text font-medium">{h.nb_actives}</td>
                      <td className="px-4 text-right tabular-nums text-status-orange-text">{h.nb_non_trouves}</td>
                    </tr>
                  ))}
                  {historique.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-secondary">
                        Aucun import pour l'instant
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Colonne droite : dernier import */}
        <div className="bg-surface-container-lowest border border-border-color rounded-xl shadow-level-1 p-6 flex flex-col h-fit">
          <h3 className="font-page-title text-page-title text-on-surface border-b border-border-color pb-4 mb-6">
            Dernier import
          </h3>
          {!dernier && <p className="text-sm text-secondary">Aucun import réalisé pour l'instant.</p>}
          {dernier && (
            <>
              <div className="flex flex-col gap-4">
                <div className="bg-surface-container-low p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-outline-variant/30 flex items-center justify-center">
                      <Search size={16} className="text-secondary" />
                    </div>
                    <span className="font-subtitle text-subtitle text-on-surface">Détectés</span>
                  </div>
                  <span className="font-key-value text-[24px] tabular-nums text-on-surface">{dernier.nbDetectes}</span>
                </div>
                <div className="bg-status-green-bg border border-status-green-text/20 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-status-green-text/10 flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-status-green-text" />
                    </div>
                    <span className="font-subtitle text-subtitle text-status-green-text">Activés</span>
                  </div>
                  <span className="font-key-value text-[24px] tabular-nums text-status-green-text">{dernier.nbActives}</span>
                </div>
                <div className="bg-status-orange-bg border border-status-orange-text/20 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-status-orange-text/10 flex items-center justify-center">
                      <AlertTriangle size={16} className="text-status-orange-text" />
                    </div>
                    <span className="font-subtitle text-subtitle text-status-orange-text">Non trouvés</span>
                  </div>
                  <span className="font-key-value text-[24px] tabular-nums text-status-orange-text">{dernier.nbNonTrouves}</span>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border-color">
                <p className="font-label-metadata text-label-metadata text-outline mb-2">Taux de succès</p>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-status-green-text h-full rounded-full transition-all duration-700" style={{ width: `${tauxSucces}%` }} />
                </div>
                <div className="flex justify-between mt-2 font-label-metadata text-label-metadata text-secondary">
                  <span>{tauxSucces}% activés</span>
                  <span>{dernier.nbDetectes} total</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
