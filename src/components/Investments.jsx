import { useState, useEffect } from 'react';
import { getCurrentUser, loadUserInvestments, saveUserInvestments } from './auth';

export default function Investments() {
  const user = getCurrentUser();
  const [items, setItems] = useState(() => (user ? loadUserInvestments(user.email) : []));
  const [form, setForm] = useState({ name: '', amount: '', date: '' });
  const [market] = useState([
    { id: 'm1', title: 'Nifty 50 - Market Update' },
    { id: 'm2', title: 'Bond Yields and Outlook' },
    { id: 'm3', title: 'Top Performing Funds' }
  ]);

  useEffect(() => {
    if (user) saveUserInvestments(user.email, items);
  }, [items, user]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function addInvestment(e) {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    const newItem = {
      id: Date.now().toString(),
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      date: form.date || new Date().toISOString().slice(0,10)
    };
    setItems(prev => [newItem, ...prev]);
    setForm({ name: '', amount: '', date: '' });
  }

  function removeInvestment(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const total = items.reduce((sum, i) => sum + (isNaN(i.amount) ? 0 : i.amount), 0);

  // Mutual Fund API state (mfapi.in)
  const [mfLoading, setMfLoading] = useState(false);
  const [mfError, setMfError] = useState(null);
  const [mfData, setMfData] = useState(null);

  useEffect(() => {
    // fetch data for scheme code 100121 on mount
    let mounted = true;
    async function fetchMf() {
      setMfLoading(true);
      setMfError(null);
      try {
        const res = await fetch('https://api.mfapi.in/mf/100121');
        if (!res.ok) throw new Error('Network response not ok');
        const data = await res.json();
        if (mounted) setMfData(data);
      } catch (err) {
        if (mounted) setMfError(err.message || 'Failed to fetch mutual fund data');
      } finally {
        if (mounted) setMfLoading(false);
      }
    }
    fetchMf();
    return () => { mounted = false; };
  }, []);

  return (
    <section className="investments-section container" aria-labelledby="investments-heading">
      <h2 id="investments-heading">Your Investments</h2>
      <form className="investment-form" onSubmit={addInvestment}>
        <div className="form-row-inline">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Instrument Name"
            required
            pattern="^[A-Za-z0-9 ._-]{2,40}$"
            title="2-40 letters, numbers, spaces or . _ -"
          />
          <input
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Amount"
            type="number"
            step="0.01"
            min="0"
            required
          />
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />
          <button type="submit" className="btn-primary">Add</button>
        </div>
      </form>
      <div className="investment-summary">Total Invested: <strong>{total.toFixed(2)}</strong></div>
      <ul className="investment-list" aria-label="Investment List">
        {items.map(item => (
          <li key={item.id} className="investment-item">
            <div>
              <strong>{item.name}</strong> — {item.amount} on {item.date}
            </div>
            <button type="button" className="btn-secondary" onClick={() => removeInvestment(item.id)}>Remove</button>
          </li>
        ))}
        {items.length === 0 && <li>No investments yet.</li>}
      </ul>

      <section className="market-snapshot" aria-labelledby="market-heading">
        <h3 id="market-heading">Market Snapshot (Sample Data)</h3>
        <ul>
          {market.map(m => <li key={m.id}>{m.title}</li>)}
        </ul>

        <h3>Mutual Fund: Scheme 100121</h3>
        {mfLoading && <div>Loading mutual fund data…</div>}
        {mfError && <div className="error">{mfError}</div>}
        {mfData && (
          <div className="mf-data">
            <div><strong>{mfData.meta && mfData.meta.scheme_name}</strong></div>
            <div>Scheme Code: {mfData.meta && mfData.meta.scheme_code}</div>
            <div>Fund House: {mfData.meta && mfData.meta.fund_house}</div>
            <h4>Latest NAVs</h4>
            <ul>
              {mfData.data && mfData.data.slice(0,5).map((d, idx) => (
                <li key={idx}>{d.date} — {d.nav}</li>
              ))}
            </ul>
            <button type="button" className="btn-secondary" onClick={() => {
              // simple manual refresh
              setMfData(null);
              setMfLoading(true);
              setMfError(null);
              fetch('https://api.mfapi.in/mf/100121')
                .then(r => { if (!r.ok) throw new Error('Network response not ok'); return r.json(); })
                .then(d => setMfData(d))
                .catch(e => setMfError(e.message || 'Failed to fetch'))
                .finally(() => setMfLoading(false));
            }}>Refresh</button>
          </div>
        )}
      </section>
    </section>
  );
}
