import { useState } from 'react';

const issueOptions = [
  'Login issues',
  'Withdrawal problems',
  'Account locked',
  'Verification delays',
  'Unauthorized transactions',
  'Other'
];

const newsItems = [
  { title: 'Coinbase Blog Article 1', link: 'https://www.coinbase.com/blog' },
  { title: 'Coinbase Blog Article 2', link: 'https://www.coinbase.com/blog' },
  { title: 'Coinbase Blog Article 3', link: 'https://www.coinbase.com/blog' }
];

const features = [
  'Faster fiat on/off ramps',
  'Expanded asset support in select regions',
  'Improved account security controls'
];

const jobs = [
  'Senior Software Engineer (Sample Listing)',
  'Customer Experience Specialist (Sample Listing)',
  'Security Operations Analyst (Sample Listing)'
];

export default function App() {
  const [form, setForm] = useState({
    account_name: '',
    issue_type: issueOptions[0],
    phone: '',
    email: ''
  });
  const [status, setStatus] = useState('');

  const update = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');
    try {
      const res = await fetch('http://localhost:8000/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setStatus(data.message || 'Connecting to live agent...');
    } catch {
      setStatus('Connecting to live agent...');
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <nav>
          <h1>Help Center</h1>
          <ul>
            <li>News</li>
            <li>Scam Protection</li>
            <li>New Features</li>
            <li>Careers</li>
            <li>Support Bot</li>
          </ul>
        </nav>
        <p>Independent community resources for Coinbase users.</p>
      </header>

      <main>
        <section className="card">
          <h2>Coinbase News</h2>
          <ul>
            {newsItems.map((n) => (
              <li key={n.title}><a href={n.link} target="_blank" rel="noreferrer">{n.title}</a></li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Scam Protection</h2>
          <ul>
            <li>Beware fake support contacts asking for passwords or seed phrases.</li>
            <li>Enable 2FA and verify all URLs before signing in.</li>
            <li>Report suspicious activity through official Coinbase channels immediately.</li>
          </ul>
        </section>

        <section className="card">
          <h2>New Features</h2>
          <ul>{features.map((f) => <li key={f}>{f}</li>)}</ul>
        </section>

        <section className="card">
          <h2>Careers</h2>
          <p><a href="https://www.coinbase.com/careers" target="_blank" rel="noreferrer">Official Coinbase Careers</a></p>
          <ul>{jobs.map((j) => <li key={j}>{j}</li>)}</ul>
        </section>

        <section className="card">
          <h2>Chat / Support Bot</h2>
          <form onSubmit={submit} className="form">
            <label>Name on Coinbase account<input name="account_name" value={form.account_name} onChange={update} required /></label>
            <label>Issue Type
              <select name="issue_type" value={form.issue_type} onChange={update}>
                {issueOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>
            <label>Phone linked to Coinbase account<input name="phone" value={form.phone} onChange={update} required /></label>
            <label>Email linked to Coinbase account<input type="email" name="email" value={form.email} onChange={update} required /></label>
            <button type="submit">Connect</button>
          </form>
          {status && <p className="status">{status}</p>}
        </section>
      </main>

      <footer>
        We are not affiliated with Coinbase. We are an independent community helping Coinbase users.
      </footer>
    </div>
  );
}
