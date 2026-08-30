import { useEffect, useState } from 'react';
import { importApi } from '../api/bridge.js';

export default function Import() {
  const [cheminFichier, setCheminFichier] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');
  const [historique, setHistorique] = useState([]);

  const chargerHistorique = () => importApi.historique().then(setHistorique);

  useEffect(() => {
    chargerHistorique();
  }, []);

  const choisirFichier = async () => {
    const chemin = await importApi.choisirFichier();
    if (chemin) setCheminFichier(chemin);
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
      chargerHistorique();
    } catch (err) {
      setErreur(err.message || "Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Import du rapport d'activation Canal+</h1>

      <div className="card bg-base-100 shadow p-6 space-y-4 max-w-xl">
        <p className="text-sm text-gray-500">
          Sélectionnez le fichier Excel/CSV envoyé par Canal+. Le système recherche automatiquement,
          dans toutes les colonnes, les numéros de série déjà enregistrés, et les passe au statut <b>Activé</b>.
        </p>
        <div className="flex gap-2">
          <input type="text" readOnly className="input input-bordered flex-1" value={cheminFichier} placeholder="Aucun fichier sélectionné" />
          <button className="btn" onClick={choisirFichier}>Parcourir…</button>
        </div>
        <button className="btn btn-primary" disabled={!cheminFichier || loading} onClick={importer}>
          {loading ? 'Traitement en cours...' : 'Importer et rapprocher'}
        </button>
      </div>

      {erreur && <div className="alert alert-error max-w-xl">{erreur}</div>}

      {resultat && (
        <div className="card bg-base-100 shadow p-6 max-w-xl space-y-2">
          <h3 className="font-semibold text-lg">Résultat de l'import</h3>
          <ul className="text-sm space-y-1">
            <li>📄 Numéros détectés : <b>{resultat.nbDetectes}</b></li>
            <li>✅ Activés : <b className="text-success">{resultat.nbActives}</b></li>
            <li>❓ Non trouvés : <b className="text-warning">{resultat.nbNonTrouves}</b></li>
          </ul>
        </div>
      )}

      <div className="card bg-base-100 shadow p-6">
        <h3 className="font-semibold mb-3">Historique des imports</h3>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr><th>Date</th><th>Fichier</th><th>Activés</th><th>Non trouvés</th></tr>
            </thead>
            <tbody>
              {historique.map((h) => (
                <tr key={h.id}>
                  <td>{h.created_at}</td>
                  <td>{h.nom_fichier}</td>
                  <td className="text-success font-medium">{h.nb_trouves}</td>
                  <td className="text-warning">{h.nb_non_trouves}</td>
                </tr>
              ))}
              {historique.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-500 py-4">Aucun import pour l'instant</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
