import { useState, useEffect } from 'react';

export default function App() {
  const [userName, setUserName] = useState('');
  const [distance, setDistance] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadHistory(name) {
    if (!name) return;

    const response = await fetch(
      `http://localhost:3001/api/vma/${encodeURIComponent(name)}/history`
    );

    if (response.ok) {
      setHistory(await response.json());
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    const distanceM = Number(distance);

    if (!userName.trim() || !Number.isFinite(distanceM) || distanceM <= 0) {
      setError('Entrez un nom et une distance supérieure à 0.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/vma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: userName.trim(), distanceM })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement.');
      }

      setResult(data);
      await loadHistory(userName.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (userName.trim()) {
      loadHistory(userName.trim());
    }
  }, [userName]);

  return (
    <main className="container">
      <h1>Estimation de votre VMA</h1>
      <p>
        Effectuez un test de Cooper : courez la plus grande distance possible
        pendant 12 minutes, puis saisissez la distance parcourue.
      </p>

      <form onSubmit={submit}>
        <label>
          Nom
          <input
            value={userName}
            onChange={(event) => setUserName(event.target.value)}
            placeholder="Ex. Laurent"
            required
          />
        </label>

        <label>
          Distance parcourue en 12 minutes (mètres)
          <input
            type="number"
            min="1"
            step="1"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
            placeholder="Ex. 2800"
            required
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Calcul en cours…' : 'Calculer et enregistrer'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="result">
          <h2>Votre VMA estimée</h2>
          <p className="vma">{result.vma_kmh.toFixed(2)} km/h</p>
          <p>
            Basée sur {result.distance_m} m parcourus en 12 minutes.
          </p>
        </section>
      )}

      {history.length > 0 && (
        <section>
          <h2>Historique</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Distance</th>
                <th>VMA</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.created_at).toLocaleString('fr-FR')}</td>
                  <td>{item.distance_m} m</td>
                  <td>{item.vma_kmh.toFixed(2)} km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}