import { useEffect, useState } from 'react';
import { ventesApi, apporteursApi } from '../api/bridge.js';

export default function VenteActivation() {
  const [tab, setTab] = useState('vente');
  const [numerosVente, setNumerosVente] = useState('');
  const [typeVente, setTypeVente] = useState('equipe');
  const [apporteur, setApporteur] = useState('');
  const [dateVente, setDateVente] = useState(() => new Date().toISOString().slice(0, 10));
  const [destinataire, setDestinataire] = useState('');
  const [apporteursListe, setApporteursListe] = useState([]);
  const [messageVente, setMessageVente] = useState('');

  const [numerosActivation, setNumerosActivation] = useState('');
  const [dateActivation, setDateActivation] = useState(() => new Date().toISOString().slice(0, 10));
  const [messageActivation, setMessageActivation] = useState('');

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
    setMessageVente(`${res.modifies} décodeur(s) marqué(s) vendu(s)`);
    setNumerosVente('');
  };

  const soumettreActivation = async (e) => {
    e.preventDefault();
    const numeros = numerosActivation.split('\n').map((n) => n.trim()).filter(Boolean);
    const res = await ventesApi.marquerActives({ numeros, dateActivation });
    setMessageActivation(`${res.modifies} décodeur(s) marqué(s) activé(s)`);
    setNumerosActivation('');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Vente / Activation manuelle</h1>

      <div role="tablist" className="tabs tabs-boxed w-fit">
        <a role="tab" className={`tab ${tab === 'vente' ? 'tab-active' : ''}`} onClick={() => setTab('vente')}>
          Marquer comme vendu
        </a>
        <a role="tab" className={`tab ${tab === 'activation' ? 'tab-active' : ''}`} onClick={() => setTab('activation')}>
          Marquer comme activé
        </a>
      </div>

      {tab === 'vente' && (
        <form onSubmit={soumettreVente} className="card bg-base-100 shadow p-6 space-y-4 max-w-2xl">
          <textarea
            className="textarea textarea-bordered w-full h-32 font-mono text-sm"
            value={numerosVente}
            onChange={(e) => setNumerosVente(e.target.value)}
            placeholder={'Numéros de série, un par ligne'}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="select select-bordered w-full" value={typeVente} onChange={(e) => setTypeVente(e.target.value)}>
              <option value="equipe">Vente équipe interne</option>
              <option value="apporteur">Via apporteur d'affaires</option>
            </select>
            <input type="date" className="input input-bordered w-full" value={dateVente} onChange={(e) => setDateVente(e.target.value)} />
          </div>
          {typeVente === 'apporteur' && (
            <div>
              <input
                list="liste-apporteurs"
                className="input input-bordered w-full"
                value={apporteur}
                onChange={(e) => setApporteur(e.target.value)}
                placeholder="Nom de l'apporteur"
                required
              />
              <datalist id="liste-apporteurs">
                {apporteursListe.map((a) => (
                  <option key={a.nom} value={a.nom} />
                ))}
              </datalist>
            </div>
          )}
          <input
            type="text"
            className="input input-bordered w-full"
            value={destinataire}
            onChange={(e) => setDestinataire(e.target.value)}
            placeholder="Destinataire / Client (optionnel)"
          />
          <button type="submit" className="btn btn-warning">Marquer comme vendu</button>
          {messageVente && <div className="alert alert-success text-sm">{messageVente}</div>}
        </form>
      )}

      {tab === 'activation' && (
        <form onSubmit={soumettreActivation} className="card bg-base-100 shadow p-6 space-y-4 max-w-2xl">
          <textarea
            className="textarea textarea-bordered w-full h-32 font-mono text-sm"
            value={numerosActivation}
            onChange={(e) => setNumerosActivation(e.target.value)}
            placeholder={'Numéros de série, un par ligne'}
            required
          />
          <input type="date" className="input input-bordered w-full" value={dateActivation} onChange={(e) => setDateActivation(e.target.value)} />
          <button type="submit" className="btn btn-success">Marquer comme activé</button>
          {messageActivation && <div className="alert alert-success text-sm">{messageActivation}</div>}
        </form>
      )}
    </div>
  );
}
