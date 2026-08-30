import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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

  const supprimer = async (a) => {
    if (!window.confirm(`Supprimer l'apporteur « ${a.nom} » ? Cette action est irréversible.`)) return;
    await apporteursApi.supprimer(a.id);
    charger();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-page-title text-page-title text-on-surface">Apporteurs d'affaires</h1>

      <section className="bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 p-5">
        <form onSubmit={ajouter} className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block font-label-metadata text-label-metadata text-secondary mb-1 uppercase" htmlFor="nom">
              Nom
            </label>
            <input
              id="nom"
              className="w-full h-10 px-3 rounded border border-border-color focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body-table text-body-table"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Jean Dupont"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block font-label-metadata text-label-metadata text-secondary mb-1 uppercase" htmlFor="telephone">
              Téléphone
            </label>
            <input
              id="telephone"
              className="w-full h-10 px-3 rounded border border-border-color focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all font-body-table text-body-table"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: +225 0102030405"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-6 rounded bg-primary text-on-primary font-subtitle text-subtitle hover:bg-primary-container transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </form>
      </section>

      <section className="bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-table-header-bg border-b border-border-color text-label-metadata font-label-metadata text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Nom</th>
                <th className="py-3 px-4">Téléphone</th>
                <th className="py-3 px-4 text-right">Ventes</th>
                <th className="py-3 px-4 text-right">Activés</th>
                <th className="py-3 px-4 text-right">Commissions dues</th>
                <th className="py-3 px-4 w-12" />
              </tr>
            </thead>
            <tbody className="font-body-table text-body-table group/table">
              {apporteurs.map((a) => (
                <tr key={a.id ?? a.nom} className="border-b border-border-color h-12 hover:bg-table-hover-bg transition-colors group">
                  <td className="py-2 px-4 text-on-surface font-medium">
                    {a.nom}{' '}
                    {a.nonReference && (
                      <span className="bg-status-gray-bg text-status-gray-text text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ml-1">
                        non enregistré
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-secondary tabular-nums">{a.telephone || '-'}</td>
                  <td className="py-2 px-4 text-on-surface tabular-nums text-right">{a.totalVentes}</td>
                  <td className="py-2 px-4 text-on-surface tabular-nums text-right">{a.totalActives}</td>
                  <td className="py-2 px-4 text-on-surface tabular-nums text-right font-bold">
                    {(a.totalCommissions || 0).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="py-2 px-4 text-right">
                    {a.id != null && (
                      <button
                        onClick={() => supprimer(a)}
                        className="opacity-0 group-hover:opacity-100 text-status-red-text hover:bg-status-red-bg p-1 rounded-full transition-opacity"
                        title="Supprimer cet apporteur"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {apporteurs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-secondary">
                    Aucun apporteur pour l'instant
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
