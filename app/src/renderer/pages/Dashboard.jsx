import { useEffect, useState } from 'react';
import { ExternalLink, FileSpreadsheet, DatabaseBackup, CheckCircle2, AlertTriangle } from 'lucide-react';
import { decodeursApi, objectifsApi, apporteursApi, exportApi } from '../api/bridge.js';

function StatCard({ label, valeur, badge }) {
  return (
    <div className="bg-surface-container-lowest border border-border-color rounded-lg p-4 shadow-level-1 flex flex-col justify-between h-full">
      <span className="font-label-metadata text-label-metadata text-secondary uppercase">{label}</span>
      <div className="flex items-center justify-between mt-2">
        <span className="font-key-value text-key-value text-on-surface tabular-nums">{valeur}</span>
        {badge}
      </div>
    </div>
  );
}

function Badge({ bg, text, children }) {
  return (
    <span
      className={`${bg} ${text} px-2 py-1 rounded font-label-metadata text-[10px] uppercase font-bold`}
    >
      {children}
    </span>
  );
}

export default function Dashboard() {
  const [compteurs, setCompteurs] = useState({ enStock: 0, vendu: 0, active: 0, total: 0 });
  const [objectif, setObjectif] = useState(null);
  const [commissions, setCommissions] = useState({ totalDu: 0, totalPaye: 0 });
  const [apporteurs, setApporteurs] = useState([]);
  const [cartons, setCartons] = useState([]);
  const [exportMessage, setExportMessage] = useState(null); // { type: 'success' | 'error', texte }
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, o, com, aps, rep] = await Promise.all([
        decodeursApi.compteurs(),
        objectifsApi.courant(),
        apporteursApi.resumeCommissions(),
        apporteursApi.lister(),
        decodeursApi.repartitionParCarton(),
      ]);
      setCompteurs(c);
      setObjectif(o);
      setCommissions(com);
      setApporteurs(aps);
      setCartons(rep);
    })();
  }, []);

  const topApporteurs = apporteurs
    .slice()
    .sort((a, b) => b.totalVentes - a.totalVentes)
    .slice(0, 5);

  const initiales = (nom) =>
    nom
      .split(' ')
      .map((m) => m[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const exporterExcel = async () => {
    setExportLoading(true);
    setExportMessage(null);
    try {
      const chemin = await exportApi.excel();
      if (chemin) setExportMessage({ type: 'success', texte: `Export Excel enregistré : ${chemin}` });
    } catch (err) {
      setExportMessage({ type: 'error', texte: err.message || "Erreur lors de l'export Excel" });
    } finally {
      setExportLoading(false);
    }
  };

  const sauvegarderBase = async () => {
    setExportLoading(true);
    setExportMessage(null);
    try {
      const dossier = await exportApi.choisirDossier();
      if (!dossier) return;
      const chemin = await exportApi.sauvegarde(dossier);
      setExportMessage({ type: 'success', texte: `Sauvegarde effectuée : ${chemin}` });
    } catch (err) {
      setExportMessage({ type: 'error', texte: err.message || 'Erreur lors de la sauvegarde' });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <StatCard label="Total décodeurs" valeur={compteurs.total} />
        <StatCard
          label="En stock"
          valeur={compteurs.enStock}
          badge={<Badge bg="bg-status-gray-bg" text="text-status-gray-text">Stock</Badge>}
        />
        <StatCard
          label="Vendus non activés"
          valeur={compteurs.vendu}
          badge={<Badge bg="bg-status-orange-bg" text="text-status-orange-text">Vendu</Badge>}
        />
        <StatCard
          label="Activés"
          valeur={compteurs.active}
          badge={<Badge bg="bg-status-green-bg" text="text-status-green-text">Activé</Badge>}
        />
      </div>

      {/* Objectif + Commissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest border border-border-color rounded-lg p-6 shadow-level-1 lg:col-span-2 flex flex-col justify-center">
          <h2 className="font-subtitle text-subtitle text-on-surface mb-6">
            Objectif du mois {objectif ? `(${objectif.mois}/${objectif.annee})` : ''}
          </h2>
          {objectif && !objectif.defini ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-status-orange-text bg-status-orange-bg px-4 py-3 rounded-lg w-fit">
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">Aucun objectif défini pour ce mois</span>
              </div>
              <span className="font-body-table text-body-table text-secondary">
                {objectif.realise} décodeur(s) vendu(s) ce mois-ci, sans cible à comparer.
              </span>
              {objectif.prochain && (
                <span className="font-body-table text-body-table text-secondary">
                  Objectif du mois prochain ({objectif.prochain.mois}/{objectif.prochain.annee}) déjà défini :{' '}
                  <span className="font-medium text-on-surface">{objectif.prochain.cible} décodeurs</span>.
                </span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-end gap-6 mb-4 flex-wrap">
                <span className="text-6xl font-bold tracking-tighter text-status-green-text tabular-nums leading-none">
                  {objectif?.pourcentage ?? 0}%
                </span>
                <div className="pb-1">
                  <span className="font-body-table text-body-table text-secondary block mb-1">
                    Décodeurs vendus ce mois
                  </span>
                  <span className="font-subtitle text-subtitle text-on-surface tabular-nums">
                    {objectif?.realise ?? 0}{' '}
                    <span className="text-secondary font-body-table text-body-table">/ {objectif?.cible ?? 0}</span>
                  </span>
                </div>
              </div>
              <div className="w-full bg-border-color rounded-full h-4 overflow-hidden">
                <div
                  className="bg-status-green-text h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(objectif?.pourcentage ?? 0, 100)}%` }}
                />
              </div>
            </>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-border-color rounded-lg p-6 shadow-level-1 flex flex-col">
          <h2 className="font-subtitle text-subtitle text-on-surface mb-6">
            Commissions dues aux apporteurs
          </h2>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div>
              <span className="font-label-metadata text-label-metadata text-secondary uppercase block mb-1">
                Montant total
              </span>
              <span className="font-key-value text-[24px] leading-tight text-on-surface tabular-nums block">
                {commissions.totalDu.toLocaleString('fr-FR')}{' '}
                <span className="text-secondary font-body-table text-body-table">FCFA</span>
              </span>
            </div>
            <div className="h-px w-full bg-border-color" />
            <div>
              <span className="font-label-metadata text-label-metadata text-secondary uppercase block mb-1">
                Déjà payé
              </span>
              <span className="font-key-value text-[24px] leading-tight text-status-green-text tabular-nums block">
                {commissions.totalPaye.toLocaleString('fr-FR')}{' '}
                <span className="text-secondary font-body-table text-body-table">FCFA</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top apporteurs + Répartition par carton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border-color">
            <h2 className="font-subtitle text-subtitle text-on-surface">Top apporteurs</h2>
          </div>
          <div className="flex-1">
            {topApporteurs.length === 0 && (
              <p className="text-sm text-secondary p-4">Aucune vente via apporteur pour l'instant</p>
            )}
            <ul className="divide-y divide-border-color">
              {topApporteurs.map((a, i) => (
                <li
                  key={a.nom}
                  className="flex items-center justify-between p-4 hover:bg-table-hover-bg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-label-metadata text-label-metadata text-secondary w-4 text-center">
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                      {initiales(a.nom)}
                    </div>
                    <span className="font-body-table text-body-table text-on-surface font-medium truncate">
                      {a.nom}
                    </span>
                  </div>
                  <span className="bg-surface-container-high text-on-surface px-2 py-1 rounded-full font-label-metadata text-label-metadata tabular-nums shrink-0">
                    {a.totalVentes} ventes
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-surface-container-lowest border border-border-color rounded-lg shadow-level-1 lg:col-span-2 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border-color flex justify-between items-center">
            <h2 className="font-subtitle text-subtitle text-on-surface">Répartition par carton</h2>
            <a
              href="#/stock"
              className="text-primary hover:bg-surface-container-low px-3 py-1.5 rounded-md font-body-table text-body-table transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Voir tout
            </a>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-table-header-bg border-b border-border-color">
                  <th className="p-4 font-label-metadata text-label-metadata text-secondary uppercase font-semibold">
                    Carton
                  </th>
                  <th className="p-4 font-label-metadata text-label-metadata text-secondary uppercase font-semibold text-right">
                    Total
                  </th>
                  <th className="p-4 font-label-metadata text-label-metadata text-secondary uppercase font-semibold text-right">
                    Vendus
                  </th>
                  <th className="p-4 font-label-metadata text-label-metadata text-secondary uppercase font-semibold text-right">
                    Activés
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {cartons.map((c) => (
                  <tr key={c.cartonCode} className="h-[48px] hover:bg-table-hover-bg transition-colors">
                    <td className="px-4 py-2 font-body-table text-body-table text-on-surface font-medium">
                      {c.cartonCode}
                    </td>
                    <td className="px-4 py-2 font-body-table text-body-table text-on-surface text-right tabular-nums">
                      {c.total}
                    </td>
                    <td className="px-4 py-2 font-body-table text-body-table text-status-orange-text text-right tabular-nums">
                      {c.vendus}
                    </td>
                    <td className="px-4 py-2 font-body-table text-body-table text-status-green-text text-right tabular-nums">
                      {c.actives}
                    </td>
                  </tr>
                ))}
                {cartons.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-secondary">
                      Aucun carton enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Export & Sauvegarde — RG-08, pas de dépendance réseau (copie locale / fichier local) */}
      <div className="bg-surface-container-lowest border border-border-color rounded-lg p-6 shadow-level-1">
        <h2 className="font-subtitle text-subtitle text-on-surface mb-1">Export & Sauvegarde</h2>
        <p className="font-body-table text-body-table text-secondary mb-4">
          Toutes les données restent locales à ce poste — pensez à exporter ou sauvegarder régulièrement.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exporterExcel}
            disabled={exportLoading}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-subtitle text-subtitle hover:bg-primary-container transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            Exporter en Excel
          </button>
          <button
            onClick={sauvegarderBase}
            disabled={exportLoading}
            className="bg-surface-container-lowest text-on-surface border border-outline-variant px-4 py-2 rounded-lg font-subtitle text-subtitle hover:bg-surface-container-low transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <DatabaseBackup size={18} />
            Sauvegarder la base
          </button>
        </div>
        {exportMessage && (
          <div
            className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm w-fit ${
              exportMessage.type === 'success'
                ? 'text-status-green-text bg-status-green-bg'
                : 'text-status-red-text bg-status-red-bg'
            }`}
          >
            {exportMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {exportMessage.texte}
          </div>
        )}
      </div>
    </div>
  );
}
