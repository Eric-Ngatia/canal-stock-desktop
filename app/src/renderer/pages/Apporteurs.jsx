import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, HandCoins } from 'lucide-react';
import { apporteursApi } from '../api/bridge.js';

export default function Apporteurs() {
  const [apporteurs, setApporteurs] = useState([]);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [editId, setEditId] = useState(null);

  const charger = () => apporteursApi.lister().then(setApporteurs);

  useEffect(() => {
    charger();
  }, []);

  const soumettre = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
    if (editId != null) {
      await apporteursApi.modifier(editId, { nom, telephone });
    } else {
      await apporteursApi.ajouter({ nom, telephone });
    }
    setNom('');
    setTelephone('');
    setEditId(null);
    charger();
  };

  const modifier = (a) => {
    setEditId(a.id);
    setNom(a.nom);
    setTelephone(a.telephone || '');
  };

  const annulerEdition = () => {
    setEditId(null);
    setNom('');
    setTelephone('');
  };

  const supprimer = async (a) => {
    if (!window.confirm(`Supprimer l'apporteur « ${a.nom} » ? Cette action est irréversible.`)) return;
    await apporteursApi.supprimer(a.id);
    if (editId === a.id) annulerEdition();
    charger();
  };

  const marquerPaye = async (a) => {
    const restant = (a.totalCommissions || 0) - (a.totalPaye || 0);
    if (!window.confirm(`Marquer ${restant.toLocaleString('fr-FR')} FCFA comme payés à « ${a.nom} » ?`)) return;
    await apporteursApi.marquerCommissionsPayees(a.nom);
    charger();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-page-title text-page-title text-on-surface">Apporteurs d'affaires</h1>

      <section className="bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 p-5">
        {editId != null && (
          <div className="mb-3 flex items-center justify-between">
            <span className="font-label-metadata text-label-metadata text-primary uppercase">Modification en cours</span>
            <button type="button" onClick={annulerEdition} className="text-xs text-secondary hover:text-on-surface underline">
              Annuler
            </button>
          </div>
        )}
        <form onSubmit={soumettre} className="flex flex-col md:flex-row items-end gap-4">
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
            {editId != null ? <Pencil size={18} /> : <Plus size={18} />}
            {editId != null ? 'Mettre à jour' : 'Ajouter'}
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
                <th className="py-3 px-4 text-right">Commissions</th>
                <th className="py-3 px-4 w-28" />
              </tr>
            </thead>
            <tbody className="font-body-table text-body-table group/table">
              {apporteurs.map((a) => (
                <tr
                  key={a.id ?? a.nom}
                  className={`border-b border-border-color h-12 hover:bg-table-hover-bg transition-colors group ${
                    editId === a.id ? 'bg-secondary-container' : ''
                  }`}
                >
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
                  <td className="py-2 px-4 text-right">
                    <div className="font-bold text-on-surface tabular-nums">
                      {((a.totalCommissions || 0) - (a.totalPaye || 0)).toLocaleString('fr-FR')} FCFA
                      <span className="text-xs text-secondary font-normal ml-1">dû</span>
                    </div>
                    {a.totalPaye > 0 && (
                      <div className="text-xs text-status-green-text tabular-nums">
                        {a.totalPaye.toLocaleString('fr-FR')} FCFA payé
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(a.totalCommissions || 0) - (a.totalPaye || 0) > 0 && (
                        <button
                          onClick={() => marquerPaye(a)}
                          className="text-secondary hover:text-status-green-text hover:bg-status-green-bg p-1 rounded-full transition-colors"
                          title="Marquer les commissions dues comme payées"
                        >
                          <HandCoins size={16} />
                        </button>
                      )}
                      {a.id != null && (
                        <>
                          <button
                            onClick={() => modifier(a)}
                            className="text-secondary hover:text-primary hover:bg-surface-container-low p-1 rounded-full transition-colors"
                            title="Modifier cet apporteur"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => supprimer(a)}
                            className="text-status-red-text hover:bg-status-red-bg p-1 rounded-full transition-colors"
                            title="Supprimer cet apporteur"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
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
