import { ShieldCheck } from 'lucide-react';

const ClientPortal = () => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="card text-center" style={{ maxWidth: 400, padding: 32 }}>
      <ShieldCheck size={48} color="var(--accent-indigo)" style={{ margin: '0 auto 16px' }} />
      <h2>Client Portal</h2>
      <p className="text-muted" style={{ marginTop: 8 }}>Access your shared session notes and appointment history.</p>
      <button className="btn btn-primary mt-4">Login to Portal</button>
    </div>
  </div>
);
export default ClientPortal;
