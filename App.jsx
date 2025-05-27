import { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function MeteoraPortfolio() {
  const [wallet, setWallet] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:3001/api/portfolio/${wallet}`);
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch portfolio.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <input
        type="text"
        placeholder="Enter wallet address"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
        style={{ width: '100%', padding: 8 }}
      />
      <button onClick={fetchPortfolio} style={{ marginTop: 10, padding: 10 }}>Search</button>
      {loading && <p>Loading...</p>}
      {error && <p>{error}</p>}
      {data && (
        <>
          <Line
            data={{
              labels: data.chart.labels,
              datasets: [
                {
                  label: 'PnL',
                  data: data.chart.data,
                  backgroundColor: 'rgba(75,192,192,0.4)',
                  borderColor: 'rgba(75,192,192,1)',
                },
              ],
            }}
          />
          <ul>
            {data.positions.map((pos, i) => (
              <li key={i}>
                <strong>{pos.pair}</strong> | Entry: {pos.entryPrice} | PnL: {pos.pnl.toFixed(2)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}