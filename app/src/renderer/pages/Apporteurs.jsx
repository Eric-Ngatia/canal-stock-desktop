import { useEffect, useState } from 'react';
import { apporteursApi } from '../api/bridge.js';

export default function Apporteurs() {
  const [apporteurs, setApporteurs] = useState([]);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');

  const charger = () => apporteursApi.lister().then(setApporteurs);

  useEffect(() => {
    charger();
  }, []);

  const ajouter = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
    await apporteursApi.ajouter({ nom, telephone });
    setNom('');
    setTelephone('');
    charger();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Apporteurs d'affaires</h1>

      <form onSubmit={ajouter} className="card bg-base-100 shadow p-4 flex flex-wrap gap-2 items-end">
        <input className="input input-bordered input-sm" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
        <input className="input input-bordered input-sm" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" />
        <button className="btn btn-primary btn-sm">Ajouter</button>
      </form>

      <div className="overflow-x-auto card bg-base-100 shadow">
        <table className="table table-sm">
          <thead>
            <tr><th>Nom</th><th>Téléphone</th><th>Ventes</th><th>Activés</th><th>Commissions dues</th></tr>
          </thead>
          <tbody>
            {apporteurs.map((a) => (
              <tr key={a.id || a.nom}>
                <td className="font-medium">
                  {a.nom} {a.nonReference && <span className="badge badge-ghost badge-xs">non enregistré</span>}
                </td>
                <td>{a.telephone}</td>
                <td>{a.totalVentes}</td>
                <td>{a.totalActives}</td>
                <td>{(a.totalCommissions || 0).toLocaleString()} F</td>
              </tr>
            ))}
            {apporteurs.length === 0 && (
              <tr><td colSpan={5} className="text-center text-gray-500 py-4">Aucun apporteur pour l'instant</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
