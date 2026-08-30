import { useEffect, useState } from 'react';
import { objectifsApi } from '../api/bridge.js';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function Objectifs() {
  const [objectifs, setObjectifs] = useState([]);
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [cible, setCible] = useState('');

  const charger = () => objectifsApi.lister().then(setObjectifs);

  useEffect(() => {
    charger();
  }, []);

  const enregistrer = async (e) => {
    e.preventDefault();
    if (!cible) return;
    await objectifsApi.definir({ mois, annee, cible: Number(cible) });
    setCible('');
    charger();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Objectifs de vente</h1>

      <form onSubmit={enregistrer} className="card bg-base-100 shadow p-4 flex flex-wrap gap-2 items-end">
        <select className="select select-bordered select-sm" value={mois} onChange={(e) => setMois(Number(e.target.value))}>
          {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="input input-bordered input-sm w-24" value={annee} onChange={(e) => setAnnee(Number(e.target.value))} />
        <input type="number" className="input input-bordered input-sm w-32" value={cible} onChange={(e) => setCible(e.target.value)} placeholder="ex: 500" />
        <button className="btn btn-primary btn-sm">Enregistrer</button>
      </form>

      <div className="overflow-x-auto card bg-base-100 shadow">
        <table className="table table-sm">
          <thead><tr><th>Mois</th><th>Année</th><th>Objectif</th></tr></thead>
          <tbody>
            {objectifs.map((o) => (
              <tr key={o.id}><td>{MOIS[o.mois - 1]}</td><td>{o.annee}</td><td>{o.cible}</td></tr>
            ))}
            {objectifs.length === 0 && (
              <tr><td colSpan={3} className="text-center text-gray-500 py-4">Aucun objectif défini</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
