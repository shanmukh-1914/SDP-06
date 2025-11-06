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
      </section>
    </section>
  );
}
