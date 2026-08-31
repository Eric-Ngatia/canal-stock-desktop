import { useEffect, useState } from 'react';
import { Flag, CheckCircle2, PieChart, Hourglass, Check, X, Pencil, Trash2 } from 'lucide-react';
import { objectifsApi } from '../api/bridge.js';

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function StatCard({ icon: Icon, label, valeur, children }) {
  return (
    <div className="bg-surface-container-lowest border border-border-color rounded-lg p-5 shadow-level-1">
      <div className="flex justify-between items-start mb-2">
        <span className="font-label-metadata text-label-metadata text-secondary uppercase tracking-wider">{label}</span>
        <Icon size={20} className="text-outline" />
      </div>
      <div className="font-key-value text-key-value text-on-surface tabular-nums">{valeur}</div>
      {children}
    </div>
  );
}

export default function Objectifs() {
  const [historique, setHistorique] = useState([]);
  const [objectif, setObjectif] = useState(null);
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [cible, setCible] = useState('');
  const [editId, setEditId] = useState(null);

  const charger = () => {
    objectifsApi.lister().then(setHistorique);
    objectifsApi.courant().then(setObjectif);
  };

  useEffect(() => {
    charger();
  }, []);

  const enregistrer = async (e) => {
    e.preventDefault();
    if (!cible) return;
    await objectifsApi.definir({ mois, annee, cible: Number(cible) });
    setCible('');
    setEditId(null);
    charger();
  };

  const modifier = (h) => {
    setEditId(h.id);
    setMois(h.mois);
    setAnnee(h.annee);
    setCible(String(h.cible));
  };

  const annulerEdition = () => {
    setEditId(null);
    setCible('');
  };

  const supprimer = async (h) => {
    if (!window.confirm(`Supprimer l'objectif de ${MOIS[h.mois - 1]} ${h.annee} ? Cette action est irréversible.`)) return;
    await objectifsApi.supprimer(h.id);
    if (editId === h.id) annulerEdition();
    charger();
  };

  const reste = objectif ? Math.max(objectif.cible - objectif.realise, 0) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-page-title text-page-title text-on-surface">Objectifs Mensuels</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <StatCard icon={Flag} label="Objectif" valeur={objectif?.cible ?? 0}>
          <div className="mt-2 h-2 rounded bg-border-color overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '100%' }} />
          </div>
        </StatCard>
        <StatCard icon={CheckCircle2} label="Réalisé" valeur={objectif?.realise ?? 0}>
          <div className="mt-2 text-xs text-secondary">
            {objectif ? `${objectif.mois}/${objectif.annee}` : ''}
          </div>
        </StatCard>
        <StatCard icon={PieChart} label="Taux de réalisation" valeur={`${objectif?.pourcentage ?? 0}%`}>
          <div className="mt-2 h-2 rounded bg-border-color overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(objectif?.pourcentage ?? 0, 100)}%` }}
            />
          </div>
        </StatCard>
        <StatCard icon={Hourglass} label="Reste" valeur={reste}>
          <div className="mt-2 text-xs text-secondary">Unités à atteindre</div>
        </StatCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Formulaire */}
        <div className="lg:col-span-1 bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 p-5 h-fit">
          <h3 className="font-subtitle text-subtitle text-on-surface mb-6 border-b border-border-color pb-3 flex items-center justify-between">
            {editId ? 'Modifier un objectif' : 'Définir un objectif'}
            {editId && (
              <button type="button" onClick={annulerEdition} className="text-xs font-normal text-secondary hover:text-on-surface underline">
                Annuler
              </button>
            )}
          </h3>
          <form onSubmit={enregistrer} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-metadata text-label-metadata text-secondary">Mois</label>
                <select
                  className="w-full h-10 border border-border-color rounded bg-surface-container-lowest text-on-surface text-body-table focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  value={mois}
                  onChange={(e) => setMois(Number(e.target.value))}
                >
                  {MOIS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-label-metadata text-label-metadata text-secondary">Année</label>
                <input
                  type="number"
                  className="w-full h-10 px-3 border border-border-color rounded bg-surface-container-lowest text-on-surface text-body-table focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                  value={annee}
                  onChange={(e) => setAnnee(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-label-metadata text-label-metadata text-secondary">Cible</label>
              <input
                type="number"
                min="0"
                className="w-full h-10 px-3 border border-border-color rounded bg-surface-container-lowest text-on-surface text-body-table font-mono focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                value={cible}
                onChange={(e) => setCible(e.target.value)}
                placeholder="ex: 500"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full h-10 bg-primary text-on-primary rounded font-subtitle text-subtitle hover:bg-primary-container transition-colors"
            >
              {editId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </form>
        </div>

        {/* Historique */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border-color">
            <h3 className="font-subtitle text-subtitle text-on-surface">Historique des objectifs</h3>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-table-header-bg border-b border-border-color text-label-metadata font-label-metadata text-secondary uppercase tracking-wider">
                  <th className="py-3 px-4">Mois</th>
                  <th className="py-3 px-4">Année</th>
                  <th className="py-3 px-4">Objectif</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="font-body-table text-body-table text-on-surface">
                {historique.map((h) => (
                  <tr key={h.id} className={`border-b border-border-color h-12 hover:bg-table-hover-bg transition-colors ${editId === h.id ? 'bg-secondary-container' : ''}`}>
                    <td className="py-2 px-4">{MOIS[h.mois - 1]}</td>
                    <td className="py-2 px-4 tabular-nums">{h.annee}</td>
                    <td className="py-2 px-4 font-mono tabular-nums">{h.cible}</td>
                    <td className="py-2 px-4 text-center">
                      <div
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          h.atteint ? 'bg-status-green-bg text-status-green-text' : 'bg-status-red-bg text-status-red-text'
                        }`}
                        title={`${h.realise} / ${h.cible} (${h.pourcentage}%)`}
                      >
                        {h.atteint ? <Check size={14} /> : <X size={14} />}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => modifier(h)}
                          className="text-secondary hover:text-primary hover:bg-surface-container-low p-1.5 rounded-full transition-colors"
                          title="Modifier cet objectif"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => supprimer(h)}
                          className="text-secondary hover:text-status-red-text hover:bg-status-red-bg p-1.5 rounded-full transition-colors"
                          title="Supprimer cet objectif"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {historique.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-secondary">
                      Aucun objectif défini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
