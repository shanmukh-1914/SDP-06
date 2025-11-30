import { useState, useEffect } from 'react';
import { getCurrentUser, loadUserInvestments, saveUserInvestments } from './auth';
import useNotifications from '../hooks/useNotifications';
import { Link } from 'react-router-dom';

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
    try {
      const settings = loadReminderSettings();
      if (settings && settings.autoCreate) {
        // compute scheduledAt based on daysBefore
        const daysBefore = parseInt(settings.daysBefore || 0, 10) || 0;
        let scheduledAt = null;
        try {
          // prefer local date; set a default time so comparisons work (09:00 local)
          const dueParts = newItem.date;
          const due = new Date(dueParts + 'T09:00:00');
          if (!isNaN(due.getTime())) {
            const s = new Date(due);
            if (daysBefore > 0) s.setDate(s.getDate() - daysBefore);
            scheduledAt = s.toISOString();
          }
        } catch (e) { scheduledAt = null; }

        const payload = {
          type: 'payment_reminder',
          title: `Payment due for ${newItem.name}`,
          body: `A payment of ₹${newItem.amount} for ${newItem.name} is scheduled on ${newItem.date}.`,
          amount: newItem.amount,
          dueDate: newItem.date,
          investmentId: newItem.id
        };
        if (settings.recurrence && settings.recurrence !== 'none') payload.recurring = settings.recurrence;
        if (scheduledAt) payload.scheduledAt = scheduledAt;
        addNotification(payload);
        // also try to persist to server if available
        (async () => {
          try {
            const base = (import.meta.env.VITE_API_BASE || '');
            const invRes = await fetch(base + '/api/investments', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userEmail: user?.email, name: newItem.name, amount: newItem.amount, date: newItem.date })
            });
            if (!invRes.ok) {
              console.warn('Investments API returned', invRes.status);
            } else {
              const j = await invRes.json();
              console.log('Saved investment to server', j);
            }
            // create reminder on server as well
            const remRes = await fetch(base + '/api/reminders', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userEmail: user?.email, type: 'payment_reminder', title: payload.title, body: payload.body, amount: payload.amount, dueDate: payload.dueDate, scheduledAt: payload.scheduledAt, recurring: payload.recurring })
            });
            if (!remRes.ok) console.warn('Reminders API returned', remRes.status);
            else {
              const jr = await remRes.json();
              console.log('Saved reminder to server', jr);
            }
          } catch (e) {
            console.warn('Network/API error when saving to server (falling back to local):', e?.message || e);
          }
        })();
      }
    } catch (e) {
      // ignore
    }
  }

  // read reminder settings from localStorage; kept simple and per-user
  function loadReminderSettings() {
    try {
      const raw = localStorage.getItem('mf_reminder_settings');
      if (!raw) return { autoCreate: true, daysBefore: 3 };
      return JSON.parse(raw);
    } catch (e) { return { autoCreate: true, daysBefore: 3 }; }
  }

  const { addNotification } = useNotifications();

  // when items change, and last action was an add, auto-create a reminder
  useEffect(() => {
    // nothing here; we will trigger notification from addInvestment directly to avoid duplicates
  }, []);

  function removeInvestment(id) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  // Edit / Update
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', amount: '', date: '' });
  // (reminder UI removed)

  function startEdit(item) {
    setEditingId(item.id);
    setEditForm({ name: item.name, amount: item.amount, date: item.date });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: '', amount: '', date: '' });
  }

  function saveEdit(e) {
    e.preventDefault();
    if (!editForm.name || !editForm.amount) return;
    setItems(prev => prev.map(it => it.id === editingId ? { ...it, name: editForm.name.trim(), amount: parseFloat(editForm.amount), date: editForm.date || it.date } : it));
    cancelEdit();
  }

  const total = items.reduce((sum, i) => sum + (isNaN(i.amount) ? 0 : i.amount), 0);

  // Mutual Fund API state (mfapi.in)
  const [mfLoading, setMfLoading] = useState(false);
  const [mfError, setMfError] = useState(null);
  const [mfFunds, setMfFunds] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [fullFundData, setFullFundData] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const mfUrls = [
    'https://api.mfapi.in/mf/119551/latest',
    'https://api.mfapi.in/mf/122639/latest',
    'https://api.mfapi.in/mf/120503/latest',
    'https://api.mfapi.in/mf/120716/latest'
  ];

  async function fetchMfAll() {
    setMfLoading(true);
    setMfError(null);
    try {
      const promises = mfUrls.map(u =>
        fetch(u)
          .then(r => { if (!r.ok) throw new Error('Network response not ok'); return r.json(); })
          .catch(e => ({ _error: e.message || 'Failed to fetch' }))
      );
      const results = await Promise.all(promises);
      setMfFunds(results);
    } catch (err) {
      setMfError(err.message || 'Failed to fetch mutual fund data');
    } finally {
      setMfLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    if (mounted) fetchMfAll();
    return () => { mounted = false; };
  }, []);

  // Helpers for details modal and holdings
  function countHoldings(schemeName) {
    if (!schemeName) return 0;
    return items.filter(i => i.name && i.name.toLowerCase() === schemeName.toLowerCase()).length;
  }

  function sumHoldings(schemeName) {
    if (!schemeName) return 0;
    return items.reduce((s, i) => (i.name && i.name.toLowerCase() === schemeName.toLowerCase() ? s + (isNaN(i.amount) ? 0 : i.amount) : s), 0);
  }

  async function openDetails(meta, fundRaw) {
    // meta is the small meta we stored earlier. Try to fetch full historical data by scheme_code if available.
    setSelectedFund(meta || {});
    setFullFundData(null);
    setDetailsLoading(true);
    try {
      const code = meta && (meta.scheme_code || meta.schemeId || meta.schemeid);
      if (code) {
        // try mfapi full endpoint
        const url = `https://api.mfapi.in/mf/${code}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error('Network response not ok');
        const data = await r.json();
        // data.data is an array of historical NAVs; provide last 90 points
        const hist = Array.isArray(data.data) ? data.data.slice(0,90).reverse() : [];
        setFullFundData(hist);
      } else if (fundRaw && fundRaw.data) {
        // fallback: try use data available in latest endpoint
        const hist = fundRaw.data && Array.isArray(fundRaw.data) ? fundRaw.data.slice(0,90).reverse() : [];
        setFullFundData(hist);
      } else {
        setFullFundData(null);
      }
    } catch (e) {
      console.error('Failed to load full fund data', e);
      setFullFundData(null);
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeDetails() {
    setSelectedFund(null);
    setFullFundData(null);
    setDetailsLoading(false);
  }

  function buyFromDetails({ amount, date, name }) {
    const newItem = {
      id: Date.now().toString(),
      name: name || (selectedFund && selectedFund.scheme_name) || 'Fund',
      amount: parseFloat(amount) || 0,
      date: date || new Date().toISOString().slice(0,10)
    };
    setItems(prev => [newItem, ...prev]);
  }

  // Simple sparkline renderer using SVG from historical nav array [{date,nav}...]
  function renderSparkline(hist) {
    if (!hist || !hist.length) return null;
    // parse numeric values and normalize
    const points = hist.map((d, i) => ({ x: i, y: parseFloat(String(d.nav).replace(/,/g,'')) || 0, date: d.date }));
    const ys = points.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = 600;
    const h = 160;
    const dx = w / Math.max(1, points.length - 1);
    const scaleY = val => (maxY === minY ? h/2 : h - ((val - minY) / (maxY - minY) * h));
    const poly = points.map((p, i) => `${i*dx},${scaleY(p.y)}`).join(' ');
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={poly} />
      </svg>
    );
  }

  // Small buy form component used in modal
  function BuyForm({ onBuy, defaultName }) {
    const [amt, setAmt] = useState('');
    const [date, setDate] = useState(new Date().toISOString().slice(0,10));
    return (
      <form onSubmit={(e)=>{e.preventDefault(); if (!amt || isNaN(parseFloat(amt))) { alert('Enter valid amount'); return;} onBuy({ amount: parseFloat(amt), date, name: defaultName }); setAmt(''); }}>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <input placeholder="Amount (₹)" value={amt} onChange={e=>setAmt(e.target.value)} />
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
          <button className="btn-primary" type="submit">Buy</button>
        </div>
      </form>
    );
  }

  // SIP calculator component
  function SipCalculator() {
    const [contrib, setContrib] = useState('1000');
    const [rate, setRate] = useState('12');
    const [years, setYears] = useState('5');
    const [freq, setFreq] = useState('monthly');
    const [result, setResult] = useState(null);

    function compute() {
      const P = parseFloat(contrib) || 0;
      const rAnn = (parseFloat(rate) || 0) / 100;
      const t = parseFloat(years) || 0;
      const periods = freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : 1;
      const r = rAnn / periods;
      const n = periods * t;
      if (r === 0) {
        setResult({ fv: P * n, contrib: P*n });
        return;
      }
      const fv = P * ( (Math.pow(1+r, n) - 1) / r );
      setResult({ fv, contrib: P * n });
    }

    return (
      <div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <input value={contrib} onChange={e=>setContrib(e.target.value)} placeholder="Contribution per period" />
          <input value={rate} onChange={e=>setRate(e.target.value)} placeholder="Expected annual return (%)" />
          <input value={years} onChange={e=>setYears(e.target.value)} placeholder="Years" />
          <select value={freq} onChange={e=>setFreq(e.target.value)}>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <div style={{display:'flex',gap:8}}>
            <button type="button" className="btn-primary" onClick={compute}>Calculate</button>
          </div>
          {result && (
            <div style={{marginTop:8}}>
              <div>Future Value: <strong>₹{result.fv.toFixed(2)}</strong></div>
              <div>Total Contributed: ₹{result.contrib.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <Link to="/reminder-settings" style={{ alignSelf: 'center', marginLeft: 8 }} className="btn-secondary">Reminder Settings</Link>
        </div>
      </form>
      <div className="investment-summary">Total Invested: <strong>{total.toFixed(2)}</strong></div>
      <ul className="investment-list" aria-label="Investment List">
        {items.map(item => (
          <li key={item.id} className="investment-item">
            {editingId === item.id ? (
              <form onSubmit={saveEdit} style={{display:'flex',gap:8,alignItems:'center'}}>
                <input name="name" value={editForm.name} onChange={e=>setEditForm(prev=>({...prev,name:e.target.value}))} required />
                <input name="amount" type="number" step="0.01" value={editForm.amount} onChange={e=>setEditForm(prev=>({...prev,amount:e.target.value}))} required />
                <input name="date" type="date" value={editForm.date} onChange={e=>setEditForm(prev=>({...prev,date:e.target.value}))} />
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
              </form>
            ) : (
              <>
                <div>
                  <strong>{item.name}</strong> — {item.amount} on {item.date}
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button type="button" className="btn-secondary" onClick={() => startEdit(item)}>Edit</button>
                  <button type="button" className="btn-secondary" onClick={() => removeInvestment(item.id)}>Remove</button>
                </div>
              </>
            )}
            
          </li>
        ))}
        {items.length === 0 && <li>No investments yet.</li>}
      </ul>

      <section className="market-snapshot" aria-labelledby="market-heading">
        <h3 id="market-heading">Market Snapshot (Sample Data)</h3>
        <ul>
          {market.map(m => <li key={m.id}>{m.title}</li>)}
        </ul>

        <h3>Mutual Funds (from mfapi.in)</h3>
        {mfLoading && <div>Loading mutual fund data…</div>}
        {mfError && <div className="error">{mfError}</div>}
        <div style={{marginTop:8, marginBottom:12}}>
          <button type="button" className="btn-secondary" onClick={fetchMfAll}>Refresh Funds</button>
        </div>
        <div className="mf-list">
          {mfFunds.length === 0 && !mfLoading && <div>No mutual funds found.</div>}
          {mfFunds.map((f, idx) => {
            if (!f) return null;
            if (f._error) return <div key={idx} className="error">Fund {idx+1}: {f._error}</div>;
            const meta = f.meta || {};
            const latest = (Array.isArray(f.data) && f.data[0]) || f.data || null;
            const latestNav = latest ? (latest.nav || latest.cnav || latest.nav_value || '') : '';
            const latestDate = latest ? (latest.date || '') : '';
            return (
              <div key={idx} className="mf-item" style={{border:'1px solid #e5e7eb',padding:10,marginBottom:8}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div><strong>{meta.scheme_name || `Scheme ${meta.scheme_code || 'N/A'}`}</strong></div>
                    <div style={{color:'#6b7280',fontSize:13}}>{meta.fund_house || ''} — Code: {meta.scheme_code || ''}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:16}}>{latestNav || '—'}</div>
                    <div style={{color:'#6b7280',fontSize:12}}>{latestDate}</div>
                  </div>
                </div>
                <div style={{marginTop:8}}>
                  <button type="button" className="btn-secondary" onClick={() => openDetails(meta, f)}>
                    View full details
                  </button>
                </div>
        {selectedFund && (
          <div className="mf-details-backdrop" onClick={closeDetails}>
            <div className="mf-details-dialog" role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()}>
              <div className="mf-details-header">
                <h3 className="mf-details-title">{selectedFund.scheme_name}</h3>
                <button onClick={closeDetails} className="mf-details-close">Close</button>
              </div>
              <div className="mf-details-body">
                <div className="mf-details-main">
                  <div className="mf-chart-box">
                    {detailsLoading && <div>Loading chart…</div>}
                    {!detailsLoading && fullFundData && renderSparkline(fullFundData)}
                    {!detailsLoading && !fullFundData && <div className="muted">No historical data available to render chart.</div>}
                  </div>
                  <div className="mf-meta">
                    <div><strong>Fund House:</strong> {selectedFund.fund_house || '—'}</div>
                    <div><strong>Scheme Code:</strong> {selectedFund.scheme_code || '—'}</div>
                  </div>
                </div>

                <aside className="mf-details-side">
                  <div className="mf-holdings">
                    <h4>Your Holdings</h4>
                    <div>Positions: {countHoldings(selectedFund.scheme_name)}</div>
                    <div>Total Cost: ₹{sumHoldings(selectedFund.scheme_name).toFixed(2)}</div>
                  </div>

                  <div className="mf-buy">
                    <h4>Buy this fund</h4>
                    <BuyForm onBuy={buyFromDetails} defaultName={selectedFund.scheme_name} />
                  </div>

                  <div className="mf-sip">
                    <h4>SIP Calculator</h4>
                    <SipCalculator />
                  </div>
                </aside>
              </div>
            </div>
          </div>
        )}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}