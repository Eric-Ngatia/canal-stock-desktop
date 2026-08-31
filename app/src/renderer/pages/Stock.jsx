import { useEffect, useState } from 'react';
import { Plus, ScanBarcode, ChevronDown } from 'lucide-react';
import { decodeursApi } from '../api/bridge.js';

const STATUT_LABEL = { en_stock: 'En stock', vendu: 'Vendu', active: 'Activé' };
const BADGE_CLASS = {
  en_stock: 'bg-status-gray-bg text-status-gray-text',
  vendu: 'bg-status-orange-bg text-status-orange-text',
  active: 'bg-status-green-bg text-status-green-text',
};
const PAGE_SIZE = 20;

export default function Stock() {
  const [items, setItems] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [cartonCode, setCartonCode] = useState('');
  const [dateLivraison, setDateLivraison] = useState('');
  const [page, setPage] = useState(1);
  const [filtreCarton, setFiltreCarton] = useState(''); // '' = tous les cartons, sinon un code precis

  const charger = async () => {
    setItems(await decodeursApi.lister({ statut: filtreStatut || undefined, q: q || undefined }));
    setPage(1);
  };

  useEffect(() => {
    charger();
  }, [filtreStatut]);

  // Recherche en direct : recharge automatiquement pendant la frappe, avec un petit debounce
  // pour ne pas relancer une requête à chaque touche.
  useEffect(() => {
    const timeout = setTimeout(() => {
      charger();
    }, 250);
    return () => clearTimeout(timeout);
  }, [q]);

  const ajouterStock = async () => {
    const numeros = bulkText.split('\n').map((n) => n.trim()).filter(Boolean);
    if (numeros.length === 0) return;
    await decodeursApi.ajouterLot({ numeros, cartonCode, dateLivraison });
    setBulkText('');
    setShowAdd(false);
    charger();
  };

  // Les vrais numéros de carton présents dans le stock chargé, pas un simple ordre — permet de
  // sauter directement sur le carton qui nous intéresse (bien plus utile qu'un tri générique).
  const cartonsDisponibles = [...new Set(items.map((d) => d.carton_code).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const itemsAffiches = filtreCarton ? items.filter((d) => d.carton_code === filtreCarton) : items;

  const nbPages = Math.max(1, Math.ceil(itemsAffiches.length / PAGE_SIZE));
  const pageItems = itemsAffiches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="font-page-title text-page-title text-on-surface">Stock ({itemsAffiches.length})</h1>
        <button
          className="bg-primary text-on-primary px-4 py-2 rounded-lg font-subtitle text-subtitle hover:bg-primary-container transition-colors flex items-center gap-2 shadow-sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Plus size={18} />
          Ajouter des décodeurs
        </button>
      </div>

      {showAdd && (
        <div className="bg-surface-container-lowest border border-border-color rounded-xl shadow-level-1 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Code carton (ex: O3, U5, U21)"
              className="h-10 px-4 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-table text-body-table"
              value={cartonCode}
              onChange={(e) => setCartonCode(e.target.value)}
            />
            <input
              type="date"
              className="h-10 px-4 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-table text-body-table"
              value={dateLivraison}
              onChange={(e) => setDateLivraison(e.target.value)}
            />
          </div>
          <textarea
            className="w-full h-32 p-3 border border-outline-variant rounded bg-surface-container-lowest text-on-surface font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            placeholder="Un numéro de série par ligne"
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <button
            className="bg-status-green-text text-white px-4 py-2 rounded-lg font-subtitle text-subtitle hover:opacity-90 transition-opacity"
            onClick={ajouterStock}
          >
            Enregistrer
          </button>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-border-color shadow-level-1 flex flex-wrap gap-4 items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            charger();
          }}
          className="flex gap-4 flex-1"
        >
          <div className="relative w-64">
            <ScanBarcode size={18} className="absolute left-3 top-2.5 text-outline" />
            <input
              type="text"
              placeholder="Rechercher par n° de série"
              className="w-full pl-10 pr-4 h-10 border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-table text-body-table"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="h-10 pl-4 pr-10 border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-table text-body-table appearance-none bg-surface-container-lowest text-on-surface"
              value={filtreCarton}
              onChange={(e) => {
                setFiltreCarton(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tous les cartons</option>
              {cartonsDisponibles.map((code) => (
                <option key={code} value={code}>
                  Carton {code}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3 text-outline pointer-events-none" />
          </div>
          <div className="relative">
            <select
              className="h-10 pl-4 pr-10 border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-body-table text-body-table appearance-none bg-surface-container-lowest text-on-surface"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              <option value="en_stock">En stock</option>
              <option value="vendu">Vendu</option>
              <option value="active">Activé</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-3 text-outline pointer-events-none" />
          </div>
        </form>
        <div className="flex items-center gap-4 text-label-metadata font-label-metadata uppercase text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> En stock
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> Vendu
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Activé
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest rounded-xl border border-border-color shadow-level-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-table-header-bg border-b border-border-color text-label-metadata font-label-metadata text-secondary uppercase tracking-wider">
                <th className="px-4 h-10 font-medium w-[10%]">N° Carton</th>
                <th className="px-4 h-10 font-medium w-[13%]">N° Décodeur</th>
                <th className="px-4 h-10 font-medium w-[10%]">Date livraison</th>
                <th className="px-4 h-10 font-medium w-[9%]">Statut</th>
                <th className="px-4 h-10 font-medium w-[10%]">Date vente</th>
                <th className="px-4 h-10 font-medium w-[19%]">Apporteur/Vendeur</th>
                <th className="px-4 h-10 font-medium w-[10%]">Date activation</th>
                <th className="px-4 h-10 font-medium w-[19%]">Destinataire</th>
              </tr>
            </thead>
            <tbody className="font-body-table text-body-table text-on-surface">
              {pageItems.map((d) => (
                <tr key={d.id} className={`row-${d.statut} border-b border-border-color hover:bg-table-hover-bg transition-colors`}>
                  <td className="px-4 py-2 break-words">{d.carton_code}</td>
                  <td className="px-4 py-2 font-mono text-xs break-all">{d.numero_serie}</td>
                  <td className="px-4 py-2 text-secondary break-words">{d.date_livraison || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`${BADGE_CLASS[d.statut]} px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider whitespace-nowrap`}>
                      {STATUT_LABEL[d.statut]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-secondary break-words">{d.date_vente || '-'}</td>
                  <td className="px-4 py-2 text-secondary break-words">{d.apporteur || '-'}</td>
                  <td className="px-4 py-2 text-secondary break-words">{d.date_activation || '-'}</td>
                  <td className="px-4 py-2 text-secondary break-words">{d.destinataire || '-'}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-secondary">
                    Aucun décodeur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border-color flex items-center justify-between">
          <div className="text-secondary text-sm">
            Affichage {itemsAffiches.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, itemsAffiches.length)} sur {itemsAffiches.length} décodeurs
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-border-color rounded text-secondary hover:bg-surface-container-low disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </button>
            <button
              className="px-3 py-1 border border-border-color rounded text-on-surface hover:bg-surface-container-low disabled:opacity-50"
              disabled={page >= nbPages}
              onClick={() => setPage((p) => Math.min(nbPages, p + 1))}
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
