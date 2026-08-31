import { useEffect, useState } from 'react';
import { ShoppingCart, CheckCircle2, CalendarDays, AlertTriangle } from 'lucide-react';
import { ventesApi, apporteursApi } from '../api/bridge.js';

const inputClass =
  'w-full border border-outline-variant rounded-lg p-3 bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all';

function compterLignes(texte) {
  return texte.split('\n').map((l) => l.trim()).filter(Boolean).length;
}

// RG-01 : un décodeur doit déjà être enregistré (réceptionné en stock) pour pouvoir être vendu
// ou activé — jamais de création implicite. `ventes.service.js` applique ce garde-fou et
// renvoie `nonTrouves`/`bloques`/`dejaActifs` ; ces fonctions transforment ça en message lisible.
function resumeVente(res) {
  const parts = [`${res.modifies} décodeur(s) marqué(s) vendu(s)`];
  if (res.nonTrouves?.length) {
    parts.push(`${res.nonTrouves.length} numéro(s) non reconnu(s) (jamais enregistré au stock) : ${res.nonTrouves.join(', ')}`);
  }
  if (res.bloques?.length) {
    parts.push(`${res.bloques.length} déjà activé(s), non modifié(s) : ${res.bloques.join(', ')}`);
  }
  return { texte: parts.join(' — '), attention: res.nonTrouves?.length > 0 || res.bloques?.length > 0 };
}

function resumeActivation(res) {
  const parts = [`${res.modifies} décodeur(s) marqué(s) activé(s)`];
  if (res.nonTrouves?.length) {
    parts.push(`${res.nonTrouves.length} numéro(s) non reconnu(s) (jamais enregistré au stock) : ${res.nonTrouves.join(', ')}`);
  }
  if (res.dejaActifs?.length) {
    parts.push(`${res.dejaActifs.length} déjà activé(s) (ignoré) : ${res.dejaActifs.join(', ')}`);
  }
  return { texte: parts.join(' — '), attention: res.nonTrouves?.length > 0 || res.dejaActifs?.length > 0 };
}

export default function VenteActivation() {
  const [tab, setTab] = useState('vente');
  const [numerosVente, setNumerosVente] = useState('');
  const [typeVente, setTypeVente] = useState('equipe');
  const [apporteur, setApporteur] = useState('');
  const [dateVente, setDateVente] = useState(() => new Date().toISOString().slice(0, 10));
  const [destinataire, setDestinataire] = useState('');
  const [apporteursListe, setApporteursListe] = useState([]);
  const [messageVente, setMessageVente] = useState(null);

  const [numerosActivation, setNumerosActivation] = useState('');
  const [dateActivation, setDateActivation] = useState(() => new Date().toISOString().slice(0, 10));
  const [messageActivation, setMessageActivation] = useState(null);

  useEffect(() => {
    apporteursApi.lister().then(setApporteursListe);
  }, []);

  const soumettreVente = async (e) => {
    e.preventDefault();
    const numeros = numerosVente.split('\n').map((n) => n.trim()).filter(Boolean);
    const res = await ventesApi.marquerVendus({
      numeros,
      dateVente,
      typeVente,
      apporteur: typeVente === 'apporteur' ? apporteur : '',
      destinataire,
    });
    setMessageVente(resumeVente(res));
    setNumerosVente('');
  };

  const soumettreActivation = async (e) => {
    e.preventDefault();
    const numeros = numerosActivation.split('\n').map((n) => n.trim()).filter(Boolean);
    const res = await ventesApi.marquerActives({ numeros, dateActivation });
    setMessageActivation(resumeActivation(res));
    setNumerosActivation('');
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-page-title text-page-title text-on-surface">Vente & Activation</h1>

      {/* Onglets pilule */}
      <div className="flex justify-center w-full">
        <div className="inline-flex bg-surface-container-low p-1 rounded-full border border-outline-variant/50">
          <button
            type="button"
            onClick={() => setTab('vente')}
            className={`px-6 py-2 rounded-full font-subtitle text-subtitle text-sm transition-all flex items-center gap-2 ${
              tab === 'vente'
                ? 'bg-white shadow-sm text-status-orange-text ring-1 ring-outline-variant/20'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <ShoppingCart size={16} />
            Marquer comme vendu
          </button>
          <button
            type="button"
            onClick={() => setTab('activation')}
            className={`px-6 py-2 rounded-full font-subtitle text-subtitle text-sm transition-all flex items-center gap-2 ${
              tab === 'activation'
                ? 'bg-white shadow-sm text-status-green-text ring-1 ring-outline-variant/20'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            <CheckCircle2 size={16} />
            Marquer comme activé
          </button>
        </div>
      </div>

      {tab === 'vente' && (
        <form
          onSubmit={soumettreVente}
          className="max-w-[640px] mx-auto w-full bg-surface-container-lowest rounded-xl border border-border-color shadow-level-1 p-8 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label className="font-label-metadata text-label-metadata text-secondary uppercase">
              Numéros de série (un par ligne)
            </label>
            <textarea
              className={`${inputClass} font-mono text-sm leading-5 resize-none`}
              rows={6}
              value={numerosVente}
              onChange={(e) => setNumerosVente(e.target.value)}
              placeholder={'Ex: 03214569874\n03214569875\n03214569876'}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-label-metadata text-label-metadata text-secondary uppercase">
                Type de vente
              </label>
              <select className={inputClass} value={typeVente} onChange={(e) => setTypeVente(e.target.value)}>
                <option value="equipe">Équipe interne</option>
                <option value="apporteur">Apporteur d'affaires</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-metadata text-label-metadata text-secondary uppercase">
                Date de vente
              </label>
              <input type="date" className={inputClass} value={dateVente} onChange={(e) => setDateVente(e.target.value)} />
            </div>
          </div>

          {typeVente === 'apporteur' && (
            <div className="flex flex-col gap-2">
              <label className="font-label-metadata text-label-metadata text-secondary uppercase">
                Nom de l'apporteur
              </label>
              <input
                list="liste-apporteurs"
                className={inputClass}
                value={apporteur}
                onChange={(e) => setApporteur(e.target.value)}
                placeholder="Rechercher un apporteur..."
                required
              />
              <datalist id="liste-apporteurs">
                {apporteursListe.map((a) => (
                  <option key={a.nom} value={a.nom} />
                ))}
              </datalist>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="font-label-metadata text-label-metadata text-secondary uppercase">
              Destinataire / Client <span className="normal-case opacity-60">(Optionnel)</span>
            </label>
            <input
              type="text"
              className={inputClass}
              value={destinataire}
              onChange={(e) => setDestinataire(e.target.value)}
              placeholder="Nom du client final"
            />
          </div>

          <div className="pt-2 flex flex-col gap-4">
            <button
              type="submit"
              className="w-full bg-status-orange-text text-white font-subtitle text-subtitle py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Marquer comme vendu
            </button>
            {messageVente && (
              <div
                className={`flex items-start gap-2 px-4 py-2 rounded-lg mx-auto ${
                  messageVente.attention ? 'text-status-orange-text bg-status-orange-bg' : 'text-status-green-text bg-status-green-bg'
                }`}
              >
                {messageVente.attention ? <AlertTriangle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
                <span className="text-sm font-medium">{messageVente.texte}</span>
              </div>
            )}
          </div>
        </form>
      )}

      {tab === 'activation' && (
        <form
          onSubmit={soumettreActivation}
          className="max-w-[640px] mx-auto w-full bg-surface-container-lowest rounded-xl border border-border-color shadow-level-1 p-8 flex flex-col gap-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border-color">
            <div className="w-10 h-10 rounded-full bg-status-green-bg flex items-center justify-center text-status-green-text">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="font-subtitle text-subtitle text-on-surface">Activation des équipements</h3>
              <p className="font-label-metadata text-label-metadata text-secondary mt-1">
                Saisissez les numéros de série et la date.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-subtitle text-subtitle text-on-surface flex justify-between items-end">
              Numéros de série à activer
              <span className="font-label-metadata text-label-metadata text-secondary font-normal">
                {compterLignes(numerosActivation)} ligne(s) détectée(s)
              </span>
            </label>
            <textarea
              className={`${inputClass} font-mono text-sm leading-5 resize-none`}
              rows={8}
              value={numerosActivation}
              onChange={(e) => setNumerosActivation(e.target.value)}
              placeholder={'043298471203\n043298471204\n043298471205'}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-subtitle text-subtitle text-on-surface">Date d'activation</label>
            <div className="relative">
              <CalendarDays size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
              <input
                type="date"
                className={`${inputClass} pl-10`}
                value={dateActivation}
                onChange={(e) => setDateActivation(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full h-12 bg-status-green-text text-white rounded-lg font-subtitle text-subtitle font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            Marquer comme activé
          </button>
          {messageActivation && (
            <div
              className={`flex items-start gap-2 px-4 py-2 rounded-lg mx-auto ${
                messageActivation.attention ? 'text-status-orange-text bg-status-orange-bg' : 'text-status-green-text bg-status-green-bg'
              }`}
            >
              {messageActivation.attention ? <AlertTriangle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
              <span className="text-sm font-medium">{messageActivation.texte}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
